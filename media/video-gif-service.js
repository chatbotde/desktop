/**
 * Convert short recorded videos to GIF via ffmpeg.
 * Only clips under MAX_GIF_DURATION_SECONDS are accepted.
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { spawn } = require('child_process');

const MAX_GIF_DURATION_SECONDS = 14;
const MAX_INPUT_BYTES = 80 * 1024 * 1024; // 80 MB safety cap

function runCommand(command, args, options = {}) {
  const useShell = options.shell === true || (
    options.shell !== false &&
    process.platform === 'win32' &&
    !path.isAbsolute(command)
  );

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: useShell,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const error = new Error(`${command} exited with code ${code}: ${stderr || stdout}`);
      error.stdout = stdout;
      error.stderr = stderr;
      error.exitCode = code;
      reject(error);
    });
  });
}

function resolveFfmpegPath() {
  const basePath = app.isPackaged ? process.resourcesPath : process.cwd();
  const bundledName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const candidates = [
    path.join(basePath, 'binaries', 'ffmpeg', bundledName),
    path.join(basePath, 'binaries', bundledName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'ffmpeg';
}

function extensionForMime(mimeType = '') {
  const mime = String(mimeType).toLowerCase();
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('mp4') || mime.includes('m4v')) return '.mp4';
  if (mime.includes('quicktime')) return '.mov';
  return '.webm';
}

function safeBaseName(name) {
  const base = path.basename(String(name || 'recording'), path.extname(String(name || '')));
  return base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'recording';
}

class VideoGifService {
  constructor(ipcRegistry) {
    this.ipcRegistry = ipcRegistry;
    this.workRoot = path.join(app.getPath('userData'), 'video-gif');
  }

  setup() {
    this.ipcRegistry.register('media:check-gif-support', async () => this.checkSupport());
    this.ipcRegistry.register('media:convert-video-to-gif', async (_event, payload) => {
      try {
        return await this.convertVideoToGif(payload || {});
      } catch (error) {
        console.error('[VideoGif] Convert failed:', error?.message || error);
        return {
          success: false,
          error: error?.message || String(error),
        };
      }
    });
  }

  async checkSupport() {
    const ffmpegPath = resolveFfmpegPath();
    try {
      await runCommand(ffmpegPath, ['-version'], { shell: !path.isAbsolute(ffmpegPath) });
      return { ffmpeg: true, maxDurationSeconds: MAX_GIF_DURATION_SECONDS, ffmpegPath };
    } catch (error) {
      return {
        ffmpeg: false,
        maxDurationSeconds: MAX_GIF_DURATION_SECONDS,
        ffmpegPath,
        error: error?.message || String(error),
      };
    }
  }

  async convertVideoToGif(payload) {
    const durationSeconds = Number(payload.durationSeconds);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error('Video duration is required to export a GIF.');
    }
    if (durationSeconds > MAX_GIF_DURATION_SECONDS) {
      throw new Error(`GIF export is only available for videos under ${MAX_GIF_DURATION_SECONDS} seconds.`);
    }

    const base64 = typeof payload.videoBase64 === 'string' ? payload.videoBase64 : '';
    if (!base64) {
      throw new Error('Missing video data for GIF export.');
    }

    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) {
      throw new Error('Video data was empty.');
    }
    if (buffer.length > MAX_INPUT_BYTES) {
      throw new Error('Video is too large to convert to GIF.');
    }

    const support = await this.checkSupport();
    if (!support.ffmpeg) {
      throw new Error('ffmpeg is not available. Install ffmpeg on PATH to export GIFs.');
    }

    fs.mkdirSync(this.workRoot, { recursive: true });
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const jobDir = path.join(this.workRoot, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const baseName = safeBaseName(payload.fileName);
    const inputPath = path.join(jobDir, `input${extensionForMime(payload.mimeType)}`);
    const outputPath = path.join(jobDir, `${baseName}.gif`);
    const ffmpegPath = support.ffmpegPath || resolveFfmpegPath();

    try {
      fs.writeFileSync(inputPath, buffer);

      // Palette-based encode keeps short screen recordings readable at a small size.
      const filter =
        'fps=12,scale=480:-1:flags=lanczos:force_original_aspect_ratio=decrease,' +
        'split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5';

      await runCommand(ffmpegPath, [
        '-y',
        '-i',
        inputPath,
        '-t',
        String(MAX_GIF_DURATION_SECONDS),
        '-vf',
        filter,
        '-loop',
        '0',
        outputPath,
      ], { shell: !path.isAbsolute(ffmpegPath), cwd: jobDir });

      if (!fs.existsSync(outputPath)) {
        throw new Error('ffmpeg finished but GIF was not created.');
      }

      const gifBase64 = fs.readFileSync(outputPath).toString('base64');
      return {
        success: true,
        gifBase64,
        fileName: `${baseName}.gif`,
        mimeType: 'image/gif',
        maxDurationSeconds: MAX_GIF_DURATION_SECONDS,
      };
    } finally {
      // Best-effort cleanup; leave nothing large in userData.
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }
}

module.exports = {
  VideoGifService,
  MAX_GIF_DURATION_SECONDS,
};
