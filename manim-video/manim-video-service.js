const fs = require('fs');
const path = require('path');
const { app, protocol, net } = require('electron');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const MEDIA_SCHEME = 'sonic-media';
const MEDIA_HOST = 'video';

const DEFAULT_SCENE_NAME = 'GeneratedScene';
const DEFAULT_QUALITY = 'ql';
const TTS_URL = 'http://127.0.0.1:8000/tts';

function slugify(value) {
  return String(value || 'manim-video')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'manim-video';
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: process.platform === 'win32',
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

async function getMediaDurationSeconds(filePath) {
  try {
    const result = await runCommand('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const seconds = parseFloat(String(result.stdout || '').trim());
    return Number.isFinite(seconds) ? seconds : 0;
  } catch {
    return 0;
  }
}

async function muxVideoWithNarration(renderedPath, audioPath, finalPath, chapterDir) {
  const videoDuration = await getMediaDurationSeconds(renderedPath);
  const audioDuration = await getMediaDurationSeconds(audioPath);
  const padSeconds = Math.max(0, audioDuration - videoDuration + 0.25);

  if (padSeconds > 0.5) {
    await runCommand('ffmpeg', [
      '-y',
      '-i',
      renderedPath,
      '-i',
      audioPath,
      '-filter_complex',
      `[0:v]tpad=stop_mode=clone:stop_duration=${padSeconds.toFixed(3)}[v]`,
      '-map',
      '[v]',
      '-map',
      '1:a:0',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '28',
      '-c:a',
      'aac',
      '-shortest',
      finalPath,
    ], { cwd: chapterDir });
    return;
  }

  await runCommand('ffmpeg', [
    '-y',
    '-i',
    renderedPath,
    '-i',
    audioPath,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-shortest',
    finalPath,
  ], { cwd: chapterDir });
}

function findFirstMp4(dir) {
  if (!fs.existsSync(dir)) return null;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findFirstMp4(fullPath);
      if (nested) return nested;
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp4')) {
      return fullPath;
    }
  }

  return null;
}

function extractManimErrorMessage(stdout, stderr, fallback) {
  const combined = `${stdout || ''}\n${stderr || ''}\n${fallback || ''}`;
  const nameError = combined.match(/NameError:\s*(.+)/i);
  if (nameError) return `Manim code error: ${nameError[1].trim()}`;
  const syntaxError = combined.match(/SyntaxError:\s*(.+)/i);
  if (syntaxError) return `Manim code error: ${syntaxError[1].trim()}`;
  const typeError = combined.match(/TypeError:\s*(.+)/i);
  if (typeError) return `Manim code error: ${typeError[1].trim()}`;
  if (/latex|dvisvgm|tex_file_writing|MathTex|\bTex\b|miktex|pdflatex|xelatex/i.test(combined)) {
    return 'Manim code used MathTex/LaTeX which is disabled. Regenerate using Text() with unicode math symbols only.';
  }
  if (/TransformMatchingStrings/i.test(combined)) {
    return 'Render failed: code used TransformMatchingStrings, which is not supported here. Regenerating with simpler animations.';
  }
  const tail = combined.trim().split('\n').slice(-6).join(' ').trim();
  return tail || fallback || 'Manim render failed.';
}

function validateManimCode(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Manim code is required.');
  }

  if (!code.includes(`class ${DEFAULT_SCENE_NAME}`)) {
    throw new Error(`Manim code must define class ${DEFAULT_SCENE_NAME}(Scene).`);
  }

  const blockedPatterns = [
    /\bimport\s+os\b/,
    /\bfrom\s+os\b/,
    /\bimport\s+subprocess\b/,
    /\bfrom\s+subprocess\b/,
    /\bimport\s+socket\b/,
    /\bimport\s+requests\b/,
    /\bimport\s+urllib\b/,
    /\bimport\s+shutil\b/,
    /\bopen\s*\(/,
    /\beval\s*\(/,
    /\bexec\s*\(/,
    /\b__import__\s*\(/,
    /\binput\s*\(/,
    /\bTransformMatchingStrings\s*\(/,
    /\bTransformMatchingShapes\s*\(/,
    /\bTransformMatchingTex\s*\(/,
    /\bMathTex\s*\(/,
    /\bTex\s*\(/,
  ];

  const blocked = blockedPatterns.find((pattern) => pattern.test(code));
  if (blocked) {
    throw new Error(`Generated Manim code uses a blocked operation: ${blocked}`);
  }
}

class ManimVideoService {
  constructor(ipcRegistry) {
    this.ipcRegistry = ipcRegistry;
    this.jobsRoot = path.join(app.getPath('userData'), 'manim-videos');
  }

  setup() {
    this.registerMediaProtocol();

    this.ipcRegistry.register('manim:check-support', async () => this.checkSupport());
    this.ipcRegistry.register('manim:render', async (_event, payload) => {
      try {
        console.log('[Manim] Render requested:', payload?.topic);
        const result = await this.render(payload);
        console.log('[Manim] Render finished:', result.videoPath);
        return result;
      } catch (error) {
        console.error('[Manim] Render failed:', error?.message || error);
        return {
          success: false,
          error: error?.message || String(error),
          jobId: '',
          jobDir: '',
          scenePath: '',
          videoPath: '',
          videoUrl: '',
          videoBase64: '',
          audioPath: null,
          warnings: [],
        };
      }
    });
    this.ipcRegistry.register('manim:concat-segments', async (_event, payload) => {
      try {
        console.log('[Manim] Concat requested:', payload?.topic, payload?.segmentPaths?.length);
        const result = await this.concatSegments(payload);
        return result;
      } catch (error) {
        console.error('[Manim] Concat failed:', error?.message || error);
        return {
          success: false,
          error: error?.message || String(error),
          jobId: '',
          jobDir: '',
          scenePath: '',
          videoPath: '',
          videoUrl: '',
          videoBase64: '',
          audioPath: null,
          warnings: [],
        };
      }
    });
  }

  registerMediaProtocol() {
    try {
      protocol.handle(MEDIA_SCHEME, (request) => {
        try {
          const url = new URL(request.url);
          const relative = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
          const jobsRootNormalized = path.normalize(this.jobsRoot);
          const filePath = path.normalize(path.join(this.jobsRoot, relative));

          if (!filePath.startsWith(jobsRootNormalized)) {
            return new Response('Forbidden', { status: 403 });
          }
          if (!fs.existsSync(filePath)) {
            return new Response('Not found', { status: 404 });
          }

          return net.fetch(pathToFileURL(filePath).toString());
        } catch (error) {
          console.error('[Manim] media protocol error:', error?.message || error);
          return new Response('Error', { status: 500 });
        }
      });
      console.log(`[Manim] ${MEDIA_SCHEME}:// protocol registered (serving ${this.jobsRoot})`);
    } catch (error) {
      console.error('[Manim] Failed to register media protocol:', error?.message || error);
    }
  }

  buildMediaUrl(filePath) {
    const relative = path.relative(this.jobsRoot, filePath);
    const encoded = relative
      .split(path.sep)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${MEDIA_SCHEME}://${MEDIA_HOST}/${encoded}`;
  }

  async checkSupport() {
    const checks = await Promise.allSettled([
      runCommand('manim', ['--version']),
      runCommand('ffmpeg', ['-version']),
      runCommand('python', ['--version']),
    ]);

    return {
      manim: checks[0].status === 'fulfilled',
      ffmpeg: checks[1].status === 'fulfilled',
      python: checks[2].status === 'fulfilled',
      details: checks.map((result) => (
        result.status === 'fulfilled'
          ? result.value.stdout || result.value.stderr
          : result.reason?.message || String(result.reason)
      )),
    };
  }

  async render(payload) {
    const topic = String(payload?.topic || 'Manim video');
    const manimCode = String(payload?.manimCode || '');
    const narration = String(payload?.narration || '').trim();
    const voiceUrl = typeof payload?.voiceUrl === 'string' ? payload.voiceUrl.trim() : '';
    const quality = typeof payload?.quality === 'string' ? payload.quality : DEFAULT_QUALITY;
    const parentJobId = typeof payload?.jobId === 'string' ? payload.jobId.trim() : '';
    const chapterId = typeof payload?.chapterId === 'string' ? payload.chapterId.trim() : '';

    validateManimCode(manimCode);

    fs.mkdirSync(this.jobsRoot, { recursive: true });
    const jobId = parentJobId || `${Date.now()}-${slugify(topic)}`;
    const resolvedJobDir = path.join(this.jobsRoot, jobId);
    const chapterDir = chapterId
      ? path.join(resolvedJobDir, chapterId)
      : resolvedJobDir;
    const mediaDir = path.join(chapterDir, 'media');
    fs.mkdirSync(chapterDir, { recursive: true });

    const scenePath = path.join(chapterDir, 'scene.py');
    const metadataPath = path.join(chapterDir, 'metadata.json');
    const audioPath = path.join(chapterDir, 'narration.wav');
    const finalPath = path.join(chapterDir, 'final.mp4');

    fs.writeFileSync(scenePath, manimCode, 'utf8');
    fs.writeFileSync(metadataPath, JSON.stringify({
      jobId,
      topic,
      chapterId: chapterId || null,
      narration,
      createdAt: new Date().toISOString(),
    }, null, 2), 'utf8');

    const warnings = [];

    console.log('[Manim] Running manim render in', chapterDir);
    let manimResult;
    try {
      manimResult = await runCommand('manim', [
        `-${quality}`,
        scenePath,
        DEFAULT_SCENE_NAME,
        '--media_dir',
        mediaDir,
      ], { cwd: chapterDir });
    } catch (error) {
      throw new Error(
        extractManimErrorMessage(error?.stdout, error?.stderr, error?.message),
      );
    }
    console.log('[Manim] manim stdout tail:', (manimResult.stdout || '').slice(-400));

    const renderedPath = findFirstMp4(mediaDir);
    if (!renderedPath) {
      throw new Error('Manim completed but no MP4 output was found.');
    }

    let outputPath = renderedPath;
    const skipNarration = payload?.skipNarration === true;
    if (narration && !skipNarration) {
      try {
        await this.generateNarration({ narration, voiceUrl, audioPath });
        await muxVideoWithNarration(renderedPath, audioPath, finalPath, chapterDir);
        outputPath = finalPath;
      } catch (error) {
        warnings.push(`Audio generation/mux failed, returning silent video: ${error.message}`);
      }
    }

    return {
      success: true,
      jobId,
      jobDir: resolvedJobDir,
      scenePath,
      videoPath: outputPath,
      videoUrl: this.buildMediaUrl(outputPath),
      videoBase64: '',
      audioPath: fs.existsSync(audioPath) ? audioPath : null,
      warnings,
    };
  }

  async concatSegments(payload) {
    const topic = String(payload?.topic || 'Manim video');
    const segmentPaths = Array.isArray(payload?.segmentPaths) ? payload.segmentPaths : [];
    const parentJobId = typeof payload?.jobId === 'string' ? payload.jobId.trim() : '';

    if (segmentPaths.length === 0) {
      throw new Error('No video segments to concatenate.');
    }

    for (const segmentPath of segmentPaths) {
      if (!fs.existsSync(segmentPath)) {
        throw new Error(`Segment not found: ${segmentPath}`);
      }
    }

    const jobId = parentJobId || `${Date.now()}-${slugify(topic)}`;
    const resolvedJobDir = path.join(this.jobsRoot, jobId);
    fs.mkdirSync(resolvedJobDir, { recursive: true });

    const concatListPath = path.join(resolvedJobDir, 'concat.txt');
    const stitchedPath = path.join(resolvedJobDir, 'final.mp4');
    const concatLines = segmentPaths
      .map((segmentPath) => `file '${segmentPath.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
      .join('\n');
    fs.writeFileSync(concatListPath, concatLines, 'utf8');

    console.log('[Manim] Stitching', segmentPaths.length, 'segments into', stitchedPath);
    await runCommand('ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-c',
      'copy',
      stitchedPath,
    ], { cwd: resolvedJobDir });

    if (!fs.existsSync(stitchedPath)) {
      throw new Error('ffmpeg concat completed but final.mp4 was not created.');
    }

    fs.writeFileSync(path.join(resolvedJobDir, 'metadata.json'), JSON.stringify({
      topic,
      segmentCount: segmentPaths.length,
      createdAt: new Date().toISOString(),
    }, null, 2), 'utf8');

    return {
      success: true,
      jobId: path.basename(resolvedJobDir),
      jobDir: resolvedJobDir,
      scenePath: '',
      videoPath: stitchedPath,
      videoUrl: this.buildMediaUrl(stitchedPath),
      videoBase64: '',
      audioPath: null,
      warnings: [],
    };
  }

  async generateNarration({ narration, voiceUrl, audioPath }) {
    const form = new FormData();
    form.append('text', narration);
    if (voiceUrl) {
      form.append('voice_url', voiceUrl);
    }

    const response = await fetch(TTS_URL, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error(`PocketTTS request failed with ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new Error('PocketTTS returned empty audio.');
    }

    fs.writeFileSync(audioPath, buffer);
  }
}

module.exports = { ManimVideoService };
