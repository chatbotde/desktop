const { desktopCapturer } = require('electron');

/**
 * Capture the primary display as a PNG buffer (same approach as Buddy quickScreenshot).
 * @returns {Promise<{ buffer: Buffer; width: number; height: number }>}
 */
async function capturePrimaryScreenPng() {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 },
  });

  if (!sources.length) {
    throw new Error('No screen sources available');
  }

  const primary =
    sources.find((source) => /primary|screen 1|display 1/i.test(source.name)) ?? sources[0];

  if (!primary?.thumbnail || primary.thumbnail.isEmpty()) {
    throw new Error('Failed to capture screen');
  }

  const { width, height } = primary.thumbnail.getSize();
  return {
    buffer: primary.thumbnail.toPNG(),
    width,
    height,
  };
}

module.exports = { capturePrimaryScreenPng };
