/**
 * Whisper Manager
 * Handles speech-to-text transcription using local whisper.cpp binaries
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class WhisperManager {
    constructor() {
        this.isTranscribing = false;

        const basePath = app.isPackaged ? process.resourcesPath : process.cwd();

        this.modelPath = path.join(basePath, 'models', 'ggml-base.en.bin');
        this.binariesPath = path.join(basePath, 'binaries', 'whisper');
        this.ffmpegPath = path.join(basePath, 'binaries', 'ffmpeg');
    }

    /**
     * Transcribe an audio file using whisper-cli
     * @param {string} audioPath - Path to the audio file
     * @returns {Promise<string>} - Transcribed text
     */
    async transcribe(audioPath) {
        if (this.isTranscribing) {
            throw new Error('Transcription already in progress');
        }

        this.isTranscribing = true;

        try {
            // Ensure model exists
            if (!fs.existsSync(this.modelPath)) {
                throw new Error(`Model not found at ${this.modelPath}`);
            }

            const whisperExe = path.join(this.binariesPath, 'whisper-cli.exe');
            if (!fs.existsSync(whisperExe)) {
                throw new Error(`Whisper binary not found at ${whisperExe}`);
            }

            console.log(`[WhisperManager] Starting transcription for ${audioPath}`);
            console.log(`[WhisperManager] Using model: ${this.modelPath}`);

            return new Promise((resolve, reject) => {
                const args = [
                    '-m', this.modelPath,
                    '-f', audioPath,
                    '-l', 'en',       // Force English
                    '--output-txt',   // Output text file
                    '--no-timestamps', // Simple text output
                    '-t', '4',        // 4 threads
                    '-bs', '1',       // Beam size 1 (faster)
                    '-bo', '1',       // Best of 1 (faster)
                ];

                const child = spawn(whisperExe, args, {
                    cwd: this.binariesPath,
                    windowsHide: true
                });

                let stdout = '';
                let stderr = '';

                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                child.on('close', async (code) => {
                    this.isTranscribing = false;

                    if (code !== 0) {
                        console.error('[WhisperManager] Transcription failed:', stderr);
                        reject(new Error(`Whisper process exited with code ${code}: ${stderr}`));
                        return;
                    }

                    // Check if output file exists (whisper-cli creates <audioPath>.txt)
                    const outputPath = audioPath + '.txt';

                    if (fs.existsSync(outputPath)) {
                        try {
                            const text = fs.readFileSync(outputPath, 'utf8').trim();
                            fs.unlinkSync(outputPath); // Clean up
                            resolve(text);
                        } catch (err) {
                            reject(new Error(`Failed to read output file: ${err.message}`));
                        }
                    } else {
                        // Fallback to stdout if file not created (though --output-txt should create it)
                        // Sometimes stdout contains progress info, so we need to be careful
                        console.warn('[WhisperManager] Output file not found, checking stdout');

                        // Filter out common whisper logs from stdout if needed, 
                        // but usually stdout is clean if valid transcription happens
                        // For now, assume failure if file is missing as we requested --output-txt
                        if (stdout.trim().length > 0) {
                            // Try to parse partial result or just return stdout
                            resolve(stdout.trim());
                        } else {
                            resolve(''); // Empty transcription
                        }
                    }
                });

                child.on('error', (err) => {
                    this.isTranscribing = false;
                    reject(err);
                });
            });
        } catch (error) {
            this.isTranscribing = false;
            throw error;
        }
    }

    /**
     * Convert audio buffer to WAV file compatible with Whisper (16kHz, 16-bit, mono)
     * @param {Buffer} audioBuffer - Raw audio data
     * @param {string} format - Input format (wav, webm, etc.)
     * @returns {Promise<string>} - Path to converted WAV file
     */
    async processAudioBuffer(audioBuffer, format) {
        const tempDir = app.getPath('temp');
        const inputPath = path.join(tempDir, `input-${Date.now()}.${format}`);
        const outputPath = path.join(tempDir, `output-${Date.now()}.wav`);

        try {
            fs.writeFileSync(inputPath, audioBuffer);

            // If already WAV, we still might need to resample to 16k
            // So always run through ffmpeg to be safe and consistent

            const ffmpegExe = path.join(this.ffmpegPath, 'ffmpeg.exe');
            if (!fs.existsSync(ffmpegExe)) {
                throw new Error(`FFmpeg binary not found at ${ffmpegExe}`);
            }

            return new Promise((resolve, reject) => {
                const args = [
                    '-y',             // Overwrite output
                    '-hide_banner',
                    '-loglevel', 'error',
                    '-i', inputPath,
                    '-ar', '16000',   // 16kHz sample rate
                    '-ac', '1',       // Mono
                    '-c:a', 'pcm_s16le', // 16-bit PCM
                    outputPath
                ];

                const child = spawn(ffmpegExe, args, {
                    cwd: this.ffmpegPath,
                    windowsHide: true
                });

                let stderr = '';
                child.stderr.on('data', d => stderr += d.toString());

                child.on('close', (code) => {
                    // Clean up input
                    try { fs.unlinkSync(inputPath); } catch (e) { }

                    if (code !== 0) {
                        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
                        return;
                    }

                    resolve(outputPath);
                });
            });

        } catch (error) {
            // Clean up on error
            if (fs.existsSync(inputPath)) try { fs.unlinkSync(inputPath); } catch (e) { }
            throw error;
        }
    }

    /**
   * Helper to delete file safely
   */
    cleanupFile(filePath) {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.warn(`[WhisperManager] Failed to cleanup ${filePath}:`, e);
            }
        }
    }
}

module.exports = { WhisperManager };
