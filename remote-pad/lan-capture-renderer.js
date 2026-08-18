(async function startLanCapture() {
  if (!window.lanCaptureAPI) {
    console.error('[RemotePad LAN] lanCaptureAPI unavailable');
    return;
  }

  /** @type {MediaStream | null} */
  let stream = null;
  /** @type {HTMLVideoElement | null} */
  let video = null;
  /** @type {HTMLCanvasElement | null} */
  let canvas = null;
  /** @type {CanvasRenderingContext2D | null} */
  let ctx = null;
  let running = false;

  async function ensureStream() {
    if (stream) {
      return stream;
    }

    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 15,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
      },
      audio: false,
    });

    video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    return stream;
  }

  async function captureLoop() {
    if (!running) {
      return;
    }

    try {
      await ensureStream();
      if (!video || !canvas || !ctx || video.videoWidth <= 0) {
        setTimeout(captureLoop, 200);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.65);
      });

      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        window.lanCaptureAPI.sendFrame(new Uint8Array(arrayBuffer));
      }
    } catch (error) {
      console.error(`[RemotePad LAN] Capture error: ${error?.message || error}`);
    }

    setTimeout(captureLoop, 66);
  }

  running = true;
  captureLoop();
})();
