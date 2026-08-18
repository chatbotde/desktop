(async function startLanP2pPublisher() {
  if (!window.lanP2pAPI) {
    console.error('[RemotePad LAN-P2P] lanP2pAPI unavailable');
    return;
  }

  /** @type {RTCPeerConnection | null} */
  let pc = null;
  /** @type {MediaStream | null} */
  let stream = null;
  let captureSuspended = false;
  let makingOffer = false;

  const VIDEO_MAX_BITRATE = 8_000_000;
  const VIDEO_MAX_FRAMERATE = 60;
  const AUDIO_MAX_BITRATE = 128_000;

  function send(message) {
    window.lanP2pAPI.sendSignal(message);
  }

  async function ensureStream() {
    if (stream) {
      return stream;
    }

    try {
      if (navigator.mediaDevices.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: VIDEO_MAX_FRAMERATE, max: VIDEO_MAX_FRAMERATE },
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
          },
          // System/loopback audio (Electron display-media handler uses audio: 'loopback').
          audio: {
            // Keep AEC off for loopback (it can distort system sound).
            echoCancellation: false,
            // Cut hiss/floor noise from desktop capture.
            noiseSuppression: true,
            // AGC pumps quiet noise — leave off.
            autoGainControl: false,
            channelCount: 2,
            sampleRate: 48000,
          },
        });
        console.log(
          `[RemotePad LAN-P2P] Capture via getDisplayMedia (video + ${stream.getAudioTracks().length} audio)`
        );
        prepareTracks(stream);
        return stream;
      }
    } catch (error) {
      console.warn(
        `[RemotePad LAN-P2P] getDisplayMedia failed: ${error?.message || error}`
      );
    }

    const sourceId = await window.lanP2pAPI.getDesktopSourceId();
    if (!sourceId) {
      throw new Error('No desktop capture source found');
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
          },
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
            minFrameRate: 30,
            maxFrameRate: VIDEO_MAX_FRAMERATE,
          },
        },
      });
      console.log(
        `[RemotePad LAN-P2P] Capture via desktopCapturer (video + ${stream.getAudioTracks().length} audio)`
      );
    } catch (audioError) {
      console.warn(
        `[RemotePad LAN-P2P] Audio capture failed, video-only: ${audioError?.message || audioError}`
      );
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
            minFrameRate: 30,
            maxFrameRate: VIDEO_MAX_FRAMERATE,
          },
        },
      });
      console.log('[RemotePad LAN-P2P] Capture via desktopCapturer (video-only)');
    }

    prepareTracks(stream);
    return stream;
  }

  /**
   * @param {MediaStream} media
   */
  function prepareTracks(media) {
    for (const track of media.getVideoTracks()) {
      try {
        track.contentHint = 'motion';
      } catch {
        // ignore
      }
    }
    for (const track of media.getAudioTracks()) {
      track.enabled = true;
      void track
        .applyConstraints({
          echoCancellation: false,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 2,
          sampleRate: 48000,
        })
        .catch(() => {});
      console.log(
        `[RemotePad LAN-P2P] Audio track ready: ${track.label || track.id} state=${track.readyState}`
      );
    }
  }

  async function stopStream() {
    if (stream) {
      for (const track of stream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      stream = null;
    }
  }

  async function closePeer() {
    if (pc) {
      try {
        pc.close();
      } catch {
        // ignore
      }
      pc = null;
    }
  }

  /**
   * @param {RTCRtpSender} sender
   */
  async function applySenderParams(sender) {
    const kind = sender.track?.kind;
    if (!kind) {
      return;
    }

    try {
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      if (kind === 'video') {
        params.degradationPreference = 'maintain-framerate';
        params.encodings[0].maxBitrate = VIDEO_MAX_BITRATE;
        params.encodings[0].maxFramerate = VIDEO_MAX_FRAMERATE;
        params.encodings[0].scaleResolutionDownBy = 1;
      } else if (kind === 'audio') {
        params.encodings[0].maxBitrate = AUDIO_MAX_BITRATE;
      }

      await sender.setParameters(params);
    } catch (error) {
      console.warn(`[RemotePad LAN-P2P] setParameters: ${error?.message || error}`);
    }
  }

  /**
   * @param {RTCPeerConnection} connection
   * @param {'video' | 'audio'} kind
   * @param {string} mime
   */
  function preferCodec(connection, kind, mime) {
    try {
      const caps = RTCRtpSender.getCapabilities?.(kind);
      if (!caps?.codecs?.length) {
        return;
      }
      const preferred = [
        ...caps.codecs.filter((c) => c.mimeType.toLowerCase() === mime.toLowerCase()),
        ...caps.codecs.filter((c) => c.mimeType.toLowerCase() !== mime.toLowerCase()),
      ];
      for (const transceiver of connection.getTransceivers()) {
        if (transceiver.sender?.track?.kind !== kind) {
          continue;
        }
        try {
          transceiver.setCodecPreferences(preferred);
        } catch {
          // ignore unsupported
        }
      }
    } catch {
      // ignore
    }
  }

  function createPeerConnection() {
    const connection = new RTCPeerConnection({
      iceServers: [],
      bundlePolicy: 'max-bundle',
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        send({
          type: 'webrtc_ice',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    connection.onconnectionstatechange = () => {
      console.log(`[RemotePad LAN-P2P] connectionState=${connection.connectionState}`);
    };

    connection.oniceconnectionstatechange = () => {
      console.log(`[RemotePad LAN-P2P] ice=${connection.iceConnectionState}`);
    };

    return connection;
  }

  async function createAndSendOffer() {
    if (captureSuspended || makingOffer) {
      return;
    }

    makingOffer = true;
    try {
      await closePeer();
      // Always re-capture so audio/video tracks are fresh and live.
      await stopStream();
      const media = await ensureStream();
      pc = createPeerConnection();

      for (const track of media.getTracks()) {
        const sender = pc.addTrack(track, media);
        await applySenderParams(sender);
      }

      preferCodec(pc, 'video', 'video/H264');
      preferCodec(pc, 'audio', 'audio/opus');

      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      send({
        type: 'webrtc_offer',
        sdp: offer.sdp,
      });
      const hasAudio = media.getAudioTracks().some((t) => t.readyState === 'live');
      console.log(
        `[RemotePad LAN-P2P] Offer sent (${VIDEO_MAX_FRAMERATE}fps / ${VIDEO_MAX_BITRATE / 1e6}Mbps${hasAudio ? ' + audio' : ' — NO AUDIO TRACK'})`
      );
    } catch (error) {
      console.error(`[RemotePad LAN-P2P] Offer failed: ${error?.message || error}`);
      send({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to start LAN video',
      });
    } finally {
      makingOffer = false;
    }
  }

  async function handleAnswer(message) {
    if (!pc || typeof message.sdp !== 'string') {
      return;
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: message.sdp });
    console.log('[RemotePad LAN-P2P] Answer applied');
  }

  async function handleIce(message) {
    if (!pc || !message.candidate) {
      return;
    }
    try {
      await pc.addIceCandidate(message.candidate);
    } catch (error) {
      console.warn(`[RemotePad LAN-P2P] ICE add failed: ${error?.message || error}`);
    }
  }

  async function handleScreenShare(message) {
    if (message.enabled === false) {
      captureSuspended = true;
      await closePeer();
      await stopStream();
      send({ type: 'webrtc_closed', reason: 'paused' });
      console.log('[RemotePad LAN-P2P] Capture paused by phone');
      return;
    }

    captureSuspended = false;
    await createAndSendOffer();
    console.log('[RemotePad LAN-P2P] Capture resumed by phone');
  }

  window.lanP2pAPI.onSignal(async (message) => {
    if (!message || typeof message.type !== 'string') {
      return;
    }

    try {
      switch (message.type) {
        case 'webrtc_request':
          captureSuspended = false;
          await createAndSendOffer();
          break;
        case 'webrtc_answer':
          await handleAnswer(message);
          break;
        case 'webrtc_ice':
          await handleIce(message);
          break;
        case 'screenShare':
          await handleScreenShare(message);
          break;
        case 'webrtc_hangup':
          await closePeer();
          await stopStream();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`[RemotePad LAN-P2P] Signal error: ${error?.message || error}`);
    }
  });

  send({ type: 'publisher_ready' });
  console.log('[RemotePad LAN-P2P] Publisher ready — waiting for phone');
})();
