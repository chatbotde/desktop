(function loadLiveKitPublisher() {
  const scriptUrl = new URL(
    '../node_modules/livekit-client/dist/livekit-client.umd.js',
    window.location.href
  ).href;

  const script = document.createElement('script');
  script.src = scriptUrl;
  script.onload = function onLiveKitLoaded() {
    if (!window.LivekitClient?.Room) {
      console.error(`livekit-client loaded but LivekitClient.Room is missing (${scriptUrl})`);
      return;
    }

    const renderer = document.createElement('script');
    renderer.src = new URL('./stream-renderer.js', window.location.href).href;
    document.body.appendChild(renderer);
  };
  script.onerror = function onLiveKitLoadError() {
    console.error(`Failed to load livekit-client from ${scriptUrl}`);
  };
  document.head.appendChild(script);
})();
