(async function startLiveKitPublisher() {
  if (!window.streamAPI) {
    console.error('streamAPI preload is unavailable');
    return;
  }

  const config = await window.streamAPI.getPublisherConfig();
  const url = config?.url;
  const token = config?.token;
  const allowScreenView = config?.allowScreenView !== false;

  if (!url || !token) {
    console.error('Missing LiveKit url or token from publisher config');
    return;
  }

  const LiveKit = window.LivekitClient;
  if (!LiveKit?.Room) {
    console.error('livekit-client UMD failed to load');
    return;
  }

  /** @type {Set<string>} */
  const authenticatedIdentities = new Set();
  /** @type {import('livekit-client').Room | null} */
  let room = null;
  let screenShareStarted = false;
  /** @type {MediaStream | null} */
  let activeStream = null;
  /** @type {import('livekit-client').LocalTrackPublication[]} */
  let publishedTracks = [];
  /** @type {RTCPeerConnection | null} */
  let directPeer = null;
  /** @type {RTCDataChannel | null} */
  let directControlChannel = null;
  /** @type {MediaStreamTrack[]} */
  let directTracks = [];
  /** Sender -> media kind, so a paused sender can be refilled with the right track. */
  /** @type {Map<RTCRtpSender, string>} */
  let directSenderKinds = new Map();
  let directConnected = false;
  let directParticipantIdentity = null;
  // Capture never starts on its own: the phone asks for it and can pause it.
  let captureSuspended = true;

  /**
   * @param {Record<string, unknown>} payload
   * @param {string[]} [destinationIdentities]
   */
  async function publishJson(payload, destinationIdentities) {
    if (!room) {
      return;
    }

    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    await room.localParticipant.publishData(bytes, {
      reliable: true,
      destinationIdentities,
    });
  }

  /**
   * Deliver a payload to the phone over direct P2P data channel or LiveKit.
   * @param {Record<string, unknown>} payload
   * @returns {Promise<boolean>}
   */
  function canSendToPhone() {
    if (directControlChannel && directControlChannel.readyState === 'open') {
      return true;
    }
    if (!room || String(room.state).toLowerCase() !== 'connected') {
      return false;
    }
    return authenticatedIdentities.size > 0;
  }

  async function sendToPhone(payload) {
    if (!canSendToPhone()) {
      return false;
    }

    const json = JSON.stringify(payload);

    if (directControlChannel && directControlChannel.readyState === 'open') {
      try {
        directControlChannel.send(json);
        return true;
      } catch {
        return false;
      }
    }

    if (room) {
      try {
        const identities = authenticatedIdentities.size > 0
          ? Array.from(authenticatedIdentities)
          : undefined;
        await publishJson(payload, identities);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  window.__remotePadSendToPhone = sendToPhone;
  window.__remotePadCanSendToPhone = canSendToPhone;

  async function handleDirectControlMessage(message) {
    if (message.type === 'remote_p2p_hangup') {
      await finishDirectSession();
      return null;
    }

    if (message.type === 'screenShare') {
      await setDirectCaptureEnabled(message.enabled !== false);
      return null;
    }

    return window.streamAPI.handleInput(message);
  }

  /**
   * Pause/resume the direct P2P video by swapping the sender track. Pausing
   * releases the desktop capture entirely so the PC stops recording the screen;
   * resuming re-captures without renegotiating the peer connection.
   * @param {boolean} enabled
   */
  async function setDirectCaptureEnabled(enabled) {
    if (!directPeer) {
      captureSuspended = !enabled;
      return;
    }

    if (!enabled) {
      captureSuspended = true;
      for (const [sender] of directSenderKinds) {
        try {
          await sender.replaceTrack(null);
        } catch (error) {
          console.warn(`[RemotePad P2P] replaceTrack(null) failed: ${error?.message || error}`);
        }
      }
      for (const track of directTracks) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      directTracks = [];
      stopCaptureStream();
      console.log('[RemotePad P2P] Capture stopped by phone');
      return;
    }

    captureSuspended = false;
    const stream = await ensureCaptureStream();
    if (!stream) {
      console.warn('[RemotePad P2P] Capture resume failed: no desktop stream');
      return;
    }

    directTracks = stream.getTracks().map((track) => track.clone());
    const unassigned = [...directTracks];
    for (const [sender, kind] of directSenderKinds) {
      const index = unassigned.findIndex((track) => track.kind === kind);
      if (index === -1) {
        continue;
      }
      const [replacement] = unassigned.splice(index, 1);
      try {
        await sender.replaceTrack(replacement);
      } catch (error) {
        console.warn(`[RemotePad P2P] replaceTrack failed: ${error?.message || error}`);
      }
    }
    console.log('[RemotePad P2P] Capture resumed by phone');
  }

  async function closeDirectPeer({ stopTracks = true } = {}) {
    directConnected = false;
    directParticipantIdentity = null;

    if (directControlChannel) {
      const channel = directControlChannel;
      directControlChannel = null;
      try {
        channel.close();
      } catch {
        // ignore
      }
    }

    if (directPeer) {
      const peer = directPeer;
      directPeer = null;
      try {
        peer.close();
      } catch {
        // ignore
      }
    }

    if (stopTracks) {
      for (const track of directTracks) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
    }
    directTracks = [];
    directSenderKinds = new Map();
  }

  /** Release the desktop capture source so the PC is no longer recording. */
  function stopCaptureStream() {
    if (!activeStream) {
      return;
    }
    for (const track of activeStream.getTracks()) {
      try {
        track.stop();
      } catch {
        // ignore
      }
    }
    activeStream = null;
  }

  async function finishDirectSession() {
    await closeDirectPeer();
    stopCaptureStream();
    captureSuspended = true;

    try {
      await window.streamAPI.notifySessionIdle();
    } catch (error) {
      console.warn(`Failed to finish direct session: ${error?.message || error}`);
    }
  }

  async function stopLiveKitMediaRelay() {
    if (!room) {
      return;
    }

    for (const publication of publishedTracks) {
      try {
        if (publication?.track) {
          await room.localParticipant.unpublishTrack(publication.track, false);
        }
      } catch (error) {
        console.warn(`Failed to stop LiveKit media relay: ${error?.message || error}`);
      }
    }
    publishedTracks = [];
    screenShareStarted = false;
    console.log('[RemotePad P2P] LiveKit media relay stopped; direct media active');
  }

  async function startDirectP2p(participant) {
    if (!allowScreenView) {
      await publishJson(
        { type: 'remote_p2p_failed', reason: 'screen_view_disabled' },
        [participant.identity]
      );
      return;
    }

    await closeDirectPeer();
    captureSuspended = false;
    await ensureCaptureStream();
    if (!activeStream) {
      throw new Error('Desktop capture unavailable for direct P2P');
    }

    directParticipantIdentity = participant.identity;
    directPeer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
      ],
      bundlePolicy: 'max-bundle',
    });

    directControlChannel = directPeer.createDataChannel('remote-pad-control', {
      ordered: true,
    });
    directControlChannel.onopen = () => {
      console.log('[RemotePad P2P] Direct control channel open');
    };
    directControlChannel.onmessage = async (event) => {
      try {
        const message = JSON.parse(String(event.data));
        const response = await handleDirectControlMessage(message);
        if (response && directControlChannel?.readyState === 'open') {
          directControlChannel.send(JSON.stringify(response));
        }
      } catch (error) {
        if (directControlChannel?.readyState === 'open') {
          directControlChannel.send(
            JSON.stringify({
              type: 'error',
              message: error instanceof Error ? error.message : 'Invalid direct message',
            })
          );
        }
      }
    };

    directPeer.onicecandidate = (event) => {
      if (!event.candidate || !directParticipantIdentity) {
        return;
      }
      void publishJson(
        {
          type: 'remote_p2p_ice',
          candidate: event.candidate.toJSON(),
        },
        [directParticipantIdentity]
      );
    };

    directPeer.onconnectionstatechange = () => {
      if (!directPeer) {
        return;
      }
      console.log(`[RemotePad P2P] connectionState=${directPeer.connectionState}`);
      if (directPeer.connectionState === 'connected') {
        directConnected = true;
        if (directParticipantIdentity) {
          void publishJson(
            { type: 'remote_p2p_connected' },
            [directParticipantIdentity]
          );
        }
        void stopLiveKitMediaRelay();
      } else if (directPeer.connectionState === 'failed') {
        if (directConnected) {
          void finishDirectSession();
        } else {
          const identity = directParticipantIdentity;
          void closeDirectPeer().then(() => {
            if (identity) {
              return publishJson(
                { type: 'remote_p2p_failed', reason: 'ice_failed' },
                [identity]
              );
            }
            return undefined;
          });
        }
      } else if (directPeer.connectionState === 'closed' && directConnected) {
        void finishDirectSession();
      }
    };

    directTracks = activeStream.getTracks().map((track) => track.clone());
    const directStream = new MediaStream(directTracks);
    directSenderKinds = new Map();
    for (const track of directTracks) {
      directSenderKinds.set(directPeer.addTrack(track, directStream), track.kind);
    }

    const offer = await directPeer.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });
    await directPeer.setLocalDescription(offer);
    await publishJson(
      { type: 'remote_p2p_offer', sdp: offer.sdp },
      [participant.identity]
    );
    console.log(`[RemotePad P2P] Direct offer sent to ${participant.identity}`);
  }

  async function handleDirectAnswer(message) {
    if (!directPeer || typeof message.sdp !== 'string') {
      return;
    }
    await directPeer.setRemoteDescription({ type: 'answer', sdp: message.sdp });
  }

  async function handleDirectIce(message) {
    if (!directPeer || !message.candidate) {
      return;
    }
    await directPeer.addIceCandidate(message.candidate);
  }

  /**
   * @param {Record<string, unknown>} message
   * @param {import('livekit-client').RemoteParticipant} participant
   */
  async function handleClientMessage(message, participant) {
    if (message.type === 'auth') {
      const authResult = await window.streamAPI.buildAuthResponse(String(message.pin ?? ''));
      if (authResult?.error) {
        await publishJson(authResult.error, [participant.identity]);
        return;
      }

      authenticatedIdentities.add(participant.identity);
      await publishJson(authResult, [participant.identity]);
      console.log(`[RemotePad LiveKit] Authenticated ${participant.identity}`);
      return;
    }

    if (!authenticatedIdentities.has(participant.identity)) {
      await publishJson(
        { type: 'auth_fail', reason: 'auth_required' },
        [participant.identity]
      );
      return;
    }

    if (message.type === 'remote_p2p_request') {
      try {
        await startDirectP2p(participant);
      } catch (error) {
        console.error(`[RemotePad P2P] Direct setup failed: ${error?.message || error}`);
        await publishJson(
          {
            type: 'remote_p2p_failed',
            reason: error instanceof Error ? error.message : 'direct_setup_failed',
          },
          [participant.identity]
        );
      }
      return;
    }

    if (message.type === 'remote_p2p_answer') {
      await handleDirectAnswer(message);
      return;
    }

    if (message.type === 'remote_p2p_ice') {
      await handleDirectIce(message);
      return;
    }

    if (message.type === 'remote_p2p_hangup') {
      await closeDirectPeer();
      return;
    }

    if (message.type === 'remote_p2p_fallback') {
      captureSuspended = false;
      await closeDirectPeer();
      await startScreenShare();
      console.log('[RemotePad P2P] Direct unavailable; LiveKit relay fallback started');
      return;
    }

    // Phone asks to pause/resume the live desktop video — stops capture to save CPU.
    if (message.type === 'screenShare') {
      if (message.enabled === false) {
        captureSuspended = true;
        await stopScreenShare();
        console.log('[RemotePad LiveKit] Screen capture paused by phone');
      } else {
        captureSuspended = false;
        await startScreenShare();
        console.log('[RemotePad LiveKit] Screen capture resumed by phone');
      }
      return;
    }

    try {
      const response = await window.streamAPI.handleInput(message);
      if (response) {
        await publishJson(response, [participant.identity]);
      }
    } catch (error) {
      await publishJson(
        {
          type: 'error',
          message: error instanceof Error ? error.message : 'Invalid message',
        },
        [participant.identity]
      );
    }
  }

  async function stopScreenShare() {
    screenShareStarted = false;
    if (room) {
      for (const publication of publishedTracks) {
        try {
          if (publication?.track) {
            await room.localParticipant.unpublishTrack(publication.track, true);
          }
        } catch (error) {
          console.warn(`Failed to unpublish track: ${error?.message || error}`);
        }
      }
    }
    publishedTracks = [];
    stopCaptureStream();
    console.log('Desktop capture stopped');
  }

  async function ensureCaptureStream() {
    if (activeStream) {
      return activeStream;
    }
    if (!allowScreenView || captureSuspended) {
      return null;
    }

    try {
      let stream = null;

      if (navigator.mediaDevices.getDisplayMedia) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              frameRate: 20,
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
            },
            audio: true,
          });
          console.log('Desktop capture started via getDisplayMedia');
        } catch (displayMediaError) {
          console.warn(
            `getDisplayMedia failed, falling back to desktopCapturer: ${displayMediaError?.message || displayMediaError}`
          );
        }
      }

      if (!stream) {
        const sourceId = await window.streamAPI.getDesktopSourceId();
        if (!sourceId) {
          throw new Error('No desktop capture source found');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080,
              minFrameRate: 15,
              maxFrameRate: 20,
            },
          },
        });
        console.log('Desktop capture started via desktopCapturer');
      }

      const track = stream.getVideoTracks()[0];
      if (!track) {
        throw new Error('Desktop video track missing');
      }

      activeStream = stream;
      return activeStream;
    } catch (error) {
      console.error(`Screen capture failed: ${error?.message || error}`);
      return null;
    }
  }

  async function startScreenShare() {
    if (!allowScreenView || !room || screenShareStarted || captureSuspended) {
      return;
    }

    screenShareStarted = true;

    try {
      const stream = await ensureCaptureStream();
      if (!stream) {
        throw new Error('Desktop capture unavailable');
      }

      const track = stream.getVideoTracks()[0];
      publishedTracks = [];

      const videoPublication = await room.localParticipant.publishTrack(track, {
        source: LiveKit.Track.Source.ScreenShare,
        simulcast: false,
        videoEncoding: {
          maxBitrate: 2_500_000,
          maxFramerate: 20,
        },
      });
      publishedTracks.push(videoPublication);

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const audioPublication = await room.localParticipant.publishTrack(audioTrack, {
          source: LiveKit.Track.Source.ScreenShareAudio,
        });
        publishedTracks.push(audioPublication);
        console.log('LiveKit desktop audio track published');
      }

      console.log('LiveKit desktop track published');
    } catch (error) {
      screenShareStarted = false;
      console.error(`Screen share failed: ${error?.message || error}`);
    }
  }

  async function endSessionIfIdle() {
    if (!room || room.remoteParticipants.size > 0) {
      return;
    }

    captureSuspended = true;
    authenticatedIdentities.clear();
    if (!directConnected) {
      await stopScreenShare();
      console.log('[RemotePad LiveKit] No phones connected — capture stopped, signaling ready');
      return;
    }

    // A direct P2P session no longer needs LiveKit signaling. Its media tracks
    // remain active until the direct control channel sends a hangup.
    try {
      await room.disconnect();
    } catch {
      // ignore
    }

    room = null;
    console.log('[RemotePad P2P] Signaling session ended; direct P2P remains active');
  }

  try {
    room = new LiveKit.Room({
      adaptiveStream: true,
      dynacast: true,
    });

    room.on(LiveKit.RoomEvent.Disconnected, () => {
      console.log('LiveKit publisher disconnected');
      authenticatedIdentities.clear();
      screenShareStarted = false;
      publishedTracks = [];
      if (activeStream && !directConnected) {
        for (const track of activeStream.getTracks()) {
          try {
            track.stop();
          } catch {
            // ignore
          }
        }
        activeStream = null;
      }
    });

    room.on(LiveKit.RoomEvent.ParticipantConnected, () => {
      // Wait for authentication and direct-P2P negotiation. The cloud media
      // relay starts only if the phone explicitly requests fallback.
    });

    room.on(LiveKit.RoomEvent.ParticipantDisconnected, (participant) => {
      authenticatedIdentities.delete(participant?.identity);
      if (room && room.remoteParticipants.size === 0) {
        void endSessionIfIdle();
      }
    });

    room.on(LiveKit.RoomEvent.DataReceived, (payload, participant) => {
      if (!participant) {
        return;
      }

      let message;
      try {
        message = JSON.parse(new TextDecoder().decode(payload));
      } catch {
        return;
      }

      void handleClientMessage(message, participant);
    });

    await room.connect(url, token);
    console.log(`LiveKit publisher connected to ${url}`);

    if (allowScreenView) {
      console.log('LiveKit signaling ready — direct P2P will be attempted before relay');
    } else {
      console.log('LiveKit control channel ready (screen view disabled)');
    }
  } catch (error) {
    console.error(`LiveKit publisher failed: ${error?.message || error}`);
  }
})();
