const fs = require('fs');
const path = require('path');
const os = require('os');

// Convert raw PCM to WAV format for easier playback and verification
function pcmToWav(pcmBuffer, outputPath, sampleRate = 24000, channels = 1, bitDepth = 16) {
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize = pcmBuffer.length;

    // Create WAV header
    const header = Buffer.alloc(44);

    // "RIFF" chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(dataSize + 36, 4); // File size - 8
    header.write('WAVE', 8);

    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(channels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(byteRate, 28); // ByteRate
    header.writeUInt16LE(blockAlign, 32); // BlockAlign
    header.writeUInt16LE(bitDepth, 34); // BitsPerSample

    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40); // Subchunk2Size

    // Combine header and PCM data
    const wavBuffer = Buffer.concat([header, pcmBuffer]);

    // Write to file
    fs.writeFileSync(outputPath, wavBuffer);

    return outputPath;
}

// Analyze audio buffer for debugging
function analyzeAudioBuffer(buffer, label = 'Audio') {
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

    let minValue = 32767;
    let maxValue = -32768;
    let avgValue = 0;
    let rmsValue = 0;
    let silentSamples = 0;

    for (let i = 0; i < int16Array.length; i++) {
        const sample = int16Array[i];
        minValue = Math.min(minValue, sample);
        maxValue = Math.max(maxValue, sample);
        avgValue += sample;
        rmsValue += sample * sample;

        if (Math.abs(sample) < 100) {
            silentSamples++;
        }
    }

    avgValue /= int16Array.length;
    rmsValue = Math.sqrt(rmsValue / int16Array.length);

    const silencePercentage = (silentSamples / int16Array.length) * 100;

    console.log(`${label} Analysis:`);
    console.log(`  Samples: ${int16Array.length}`);
    console.log(`  Min: ${minValue}, Max: ${maxValue}`);
    console.log(`  Average: ${avgValue.toFixed(2)}`);
    console.log(`  RMS: ${rmsValue.toFixed(2)}`);
    console.log(`  Silence: ${silencePercentage.toFixed(1)}%`);
    console.log(`  Dynamic Range: ${20 * Math.log10(maxValue / (rmsValue || 1))} dB`);

    return {
        minValue,
        maxValue,
        avgValue,
        rmsValue,
        silencePercentage,
        sampleCount: int16Array.length,
    };
}

// Save audio buffer with metadata for debugging
function saveDebugAudio(buffer, type, timestamp = Date.now()) {
    const homeDir = os.homedir();
    const debugDir = path.join(homeDir, 'sonicplane', 'screen-capture', 'debug');

    if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
    }

    const pcmPath = path.join(debugDir, `${type}_${timestamp}.pcm`);
    const wavPath = path.join(debugDir, `${type}_${timestamp}.wav`);
    const metaPath = path.join(debugDir, `${type}_${timestamp}.json`);

    // Save raw PCM
    fs.writeFileSync(pcmPath, buffer);

    // Convert to WAV for easy playback
    pcmToWav(buffer, wavPath);

    // Analyze and save metadata
    const analysis = analyzeAudioBuffer(buffer, type);
    fs.writeFileSync(
        metaPath,
        JSON.stringify(
            {
                timestamp,
                type,
                bufferSize: buffer.length,
                analysis,
                format: {
                    sampleRate: 24000,
                    channels: 1,
                    bitDepth: 16,
                },
            },
            null,
            2
        )
    );

    console.log(`Screen Capture: Debug audio saved: ${wavPath}`);

    return { pcmPath, wavPath, metaPath };
}

// Enhanced audio processing for screen capture
function processAudioForCapture(buffer, options = {}) {
    const {
        sampleRate = 24000,
        channels = 1,
        bitDepth = 16,
        normalize = true,
        removeNoise = true
    } = options;

    let processedBuffer = buffer;

    if (normalize) {
        processedBuffer = normalizeAudioBuffer(processedBuffer);
    }

    if (removeNoise) {
        processedBuffer = applyNoiseReduction(processedBuffer);
    }

    return processedBuffer;
}

// Normalize audio buffer to prevent clipping
function normalizeAudioBuffer(buffer) {
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
    
    // Find the maximum absolute value
    let maxValue = 0;
    for (let i = 0; i < int16Array.length; i++) {
        maxValue = Math.max(maxValue, Math.abs(int16Array[i]));
    }

    // Calculate normalization factor
    const normalizationFactor = maxValue > 0 ? 32767 / maxValue : 1;

    // Apply normalization
    for (let i = 0; i < int16Array.length; i++) {
        int16Array[i] = Math.round(int16Array[i] * normalizationFactor);
    }

    return Buffer.from(int16Array.buffer);
}

// Simple noise reduction using a high-pass filter
function applyNoiseReduction(buffer) {
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
    const filteredArray = new Int16Array(int16Array.length);

    // Simple high-pass filter to remove low-frequency noise
    const alpha = 0.95; // Filter coefficient
    let previousInput = 0;
    let previousOutput = 0;

    for (let i = 0; i < int16Array.length; i++) {
        const currentInput = int16Array[i];
        const currentOutput = alpha * (previousOutput + currentInput - previousInput);
        
        filteredArray[i] = Math.round(currentOutput);
        
        previousInput = currentInput;
        previousOutput = currentOutput;
    }

    return Buffer.from(filteredArray.buffer);
}

// Create audio recording session manager
class AudioRecordingSession {
    constructor(options = {}) {
        this.sampleRate = options.sampleRate || 24000;
        this.channels = options.channels || 1;
        this.bitDepth = options.bitDepth || 16;
        this.isRecording = false;
        this.audioChunks = [];
        this.startTime = null;
        this.sessionId = null;
    }

    startSession() {
        if (this.isRecording) {
            console.warn('Screen Capture: Audio recording session already active');
            return false;
        }

        this.isRecording = true;
        this.audioChunks = [];
        this.startTime = Date.now();
        this.sessionId = `audio_session_${this.startTime}`;
        
        console.log(`Screen Capture: Started audio recording session: ${this.sessionId}`);
        return true;
    }

    addAudioChunk(buffer) {
        if (!this.isRecording) {
            console.warn('Screen Capture: Cannot add audio chunk - session not active');
            return false;
        }

        // Process the audio chunk
        const processedBuffer = processAudioForCapture(buffer, {
            sampleRate: this.sampleRate,
            channels: this.channels,
            bitDepth: this.bitDepth
        });

        this.audioChunks.push(processedBuffer);
        return true;
    }

    stopSession() {
        if (!this.isRecording) {
            console.warn('Screen Capture: No active audio recording session to stop');
            return null;
        }

        this.isRecording = false;
        const endTime = Date.now();
        const duration = endTime - this.startTime;

        // Combine all audio chunks
        const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedBuffer = Buffer.concat(this.audioChunks, totalLength);

        const sessionData = {
            sessionId: this.sessionId,
            startTime: this.startTime,
            endTime,
            duration,
            audioBuffer: combinedBuffer,
            metadata: {
                sampleRate: this.sampleRate,
                channels: this.channels,
                bitDepth: this.bitDepth,
                chunkCount: this.audioChunks.length,
                totalSamples: totalLength / 2, // 16-bit samples
            }
        };

        console.log(`Screen Capture: Stopped audio recording session: ${this.sessionId} (${duration}ms)`);
        
        // Save debug information
        this.saveSessionDebugInfo(sessionData);
        
        return sessionData;
    }

    saveSessionDebugInfo(sessionData) {
        try {
            const debugInfo = saveDebugAudio(
                sessionData.audioBuffer, 
                `session_${sessionData.sessionId}`, 
                sessionData.startTime
            );
            
            console.log(`Screen Capture: Session debug info saved: ${debugInfo.wavPath}`);
        } catch (error) {
            console.error('Screen Capture: Failed to save session debug info:', error);
        }
    }
}

module.exports = {
    pcmToWav,
    analyzeAudioBuffer,
    saveDebugAudio,
    processAudioForCapture,
    normalizeAudioBuffer,
    applyNoiseReduction,
    AudioRecordingSession,
};

