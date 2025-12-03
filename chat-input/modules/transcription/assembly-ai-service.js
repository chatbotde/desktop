
export class AssemblyAIService {
    constructor(apiKey) {
        this.apiKey = apiKey || "2a1a1ee819a3433da7f995354c54e86a";
        this.baseUrl = "https://api.assemblyai.com/v2";
        this.socket = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.scriptProcessor = null;
        this.isStreaming = false;
    }

    // --- Real-time Transcription ---

    async startRealtimeTranscription(onTranscript, onError, existingStream = null) {
        if (this.isStreaming) return;

        try {
            if (existingStream) {
                this.mediaStream = existingStream;
                this.usingSharedStream = true;
            } else {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.usingSharedStream = false;
            }

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sampleRate = this.audioContext.sampleRate;

            // Use v2 Realtime API endpoint
            const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}`;
            
            // Connect with token in query param
            this.socket = new WebSocket(`${wsUrl}&token=${this.apiKey}`);

            this.socket.onopen = () => {
                console.log("AssemblyAI WebSocket connected");
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'Turn' || data.type === 'PartialTranscript' || data.type === 'FinalTranscript') { // Adjust based on API version
                     // User code checks for 'Turn'
                     if (onTranscript) onTranscript(data);
                } else if (data.message_type === 'FinalTranscript' || data.message_type === 'PartialTranscript') {
                    // v2 API
                    if (onTranscript) onTranscript(data);
                }
                
                // User code logic:
                if (data.type === 'Turn') {
                    if (onTranscript) onTranscript(data);
                }
            };

            this.socket.onerror = (error) => {
                console.error("AssemblyAI WebSocket error:", error);
                if (onError) onError(error);
            };

            this.socket.onclose = () => {
                console.log("AssemblyAI WebSocket closed");
                this.cleanupStreaming();
            };

            // Setup Audio Processing
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);

            this.scriptProcessor.onaudioprocess = (e) => {
                if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);
                // Convert to 16-bit PCM
                const pcmData = this.floatTo16BitPCM(inputData);
                
                // Send to WebSocket
                // AssemblyAI expects JSON with "audio_data" field which is base64 encoded PCM?
                // Or binary?
                // The user code sends `ws.send(data)` where data is Buffer from `mic`.
                // `mic` output is raw binary.
                // So I should send binary.
                // But `ws` in browser sends Blob or ArrayBuffer.
                // AssemblyAI v2 Realtime accepts binary.
                
                // User code: `ws.send(data)` (Buffer).
                // So I will send the ArrayBuffer (pcmData).
                
                // However, the user code also handles JSON messages from server.
                // So it seems it's a mixed protocol.
                
                // Let's try sending binary.
                this.socket.send(pcmData);
            };

            this.isStreaming = true;

        } catch (error) {
            console.error("Error starting realtime transcription:", error);
            if (onError) onError(error);
            this.cleanupStreaming();
        }
    }

    stopRealtimeTranscription() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ terminate_session: true })); // v2
            // or
            // this.socket.send(JSON.stringify({ type: "Terminate" })); // User code uses this
            this.socket.close();
        }
        this.cleanupStreaming();
    }

    cleanupStreaming() {
        this.isStreaming = false;
        if (this.mediaStream && !this.usingSharedStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        this.mediaStream = null;
        this.usingSharedStream = false;
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.socket = null;
    }

    floatTo16BitPCM(input) {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }

    // --- File Transcription ---

    async transcribeAudioFile(audioBlob) {
        try {
            console.log("Starting file transcription...", audioBlob.type, audioBlob.size);
            
            // 1. Upload
            const uploadUrl = `${this.baseUrl}/upload`;
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': audioBlob.type || 'application/octet-stream' 
                },
                body: audioBlob
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error("Upload failed response:", errorText);
                throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
            }

            const uploadData = await uploadResponse.json();
            const audioUrl = uploadData.upload_url;
            console.log("Audio uploaded, URL:", audioUrl);

            // 2. Request Transcription
            const transcriptUrl = `${this.baseUrl}/transcript`;
            const transcriptResponse = await fetch(transcriptUrl, {
                method: 'POST',
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    speech_models: ["universal"] // from user code
                })
            });

            if (!transcriptResponse.ok) {
                const errorText = await transcriptResponse.text();
                console.error("Transcription request failed response:", errorText);
                throw new Error(`Transcription request failed: ${transcriptResponse.status} ${transcriptResponse.statusText} - ${errorText}`);
            }

            const transcriptData = await transcriptResponse.json();
            const transcriptId = transcriptData.id;
            console.log("Transcription started, ID:", transcriptId);

            // 3. Poll for results
            return this.pollForTranscript(transcriptId);

        } catch (error) {
            console.error("Error transcribing file:", error);
            throw error;
        }
    }

    async pollForTranscript(transcriptId) {
        const pollingEndpoint = `${this.baseUrl}/transcript/${transcriptId}`;
        
        while (true) {
            const pollingResponse = await fetch(pollingEndpoint, {
                headers: {
                    'Authorization': this.apiKey
                }
            });
            
            if (!pollingResponse.ok) {
                throw new Error(`Polling failed: ${pollingResponse.statusText}`);
            }

            const result = await pollingResponse.json();

            if (result.status === 'completed') {
                return result.text;
            } else if (result.status === 'error') {
                throw new Error(`Transcription failed: ${result.error}`);
            } else {
                // Wait 3 seconds
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
}
