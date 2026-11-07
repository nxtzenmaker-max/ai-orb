// src/voice.js
// Zero-config Speech Recognition, Speech Synthesis, and Web Audio API Analyzer
// Integrated with procedural Web Audio sound synthesis for harmonious sensory feedback.

import { sound } from './sound.js';

export class VoiceManager {
  constructor({ onTranscript, onStateChange, onAudioData, onError }) {
    this.onTranscript = onTranscript || (() => {});
    this.onStateChange = onStateChange || (() => {});
    this.onAudioData = onAudioData || (() => {});
    this.onError = onError || (() => {});

    this.isMuted = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.recognition = null;
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.dataArray = null;
    this.animationFrameId = null;

    this.speechSynthesis = window.speechSynthesis || null;
    this.selectedVoice = null;
    this.lang = 'en-US';

    this.initRecognition();
    this.initVoices();
  }

  setLanguage(langCode) {
    this.lang = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
    this.initVoices();
  }

  // Initialize SpeechRecognition (Speech-to-Text)
  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser. Text input remains fully active.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang || 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChange('listening');
        sound.playChime('activate');
        this.startMicAudioAnalysis();
      };

      this.recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        if (finalText) {
          sound.playChime('complete');
        }

        this.onTranscript({ interim: interimText, final: finalText });
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          this.onError(`Speech recognition notice: ${event.error}`);
        }
        this.stopListening();
      };

      this.recognition.onend = () => {
        this.stopListening();
      };
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
    }
  }

  // Initialize SpeechSynthesis (Text-to-Speech)
  initVoices() {
    if (!this.speechSynthesis) return;

    const loadVoices = () => {
      const voices = this.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const isHindi = this.lang && this.lang.startsWith('hi');
      let preferred = null;

      if (isHindi) {
        preferred = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) ||
                    voices.find(v => v.lang.includes('IN')) ||
                    voices.find(v => v.lang.startsWith('en'));
      } else {
        preferred = voices.find(v => 
          (v.name.includes('Natural') || v.name.includes('Google UK English Female') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel')) &&
          v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      }

      this.selectedVoice = preferred;
    };

    loadVoices();
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // Ensure Web Audio AudioContext is active (user gesture compliant)
  async ensureAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  // Start live microphone analyzer
  async startMicAudioAnalysis() {
    try {
      await this.ensureAudioContext();
      if (!this.audioContext) return;

      if (!this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        // Connect procedural sound synthesizer to the same analyser so the orb reacts to chimes
        sound.connectAnalyser(this.analyser);
      }

      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        source.connect(this.analyser);
      }

      this.startAnalysisLoop();
    } catch (err) {
      console.info('Microphone audio stream notice:', err.message);
      // Fallback: start synthetic audio wave generator so orb still reacts dynamically
      this.startSyntheticAnalysisLoop();
    }
  }

  // Analysis Loop: compute bass, treble, overall amplitude
  startAnalysisLoop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    const update = () => {
      if (!this.isListening && !this.isSpeaking) {
        this.onAudioData({ intensity: 0, bass: 0, treble: 0 });
        return;
      }

      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);
        const binCount = this.dataArray.length;

        let total = 0;
        let bassSum = 0;
        let trebleSum = 0;

        const bassBins = Math.floor(binCount * 0.25);
        const trebleStart = Math.floor(binCount * 0.5);

        for (let i = 0; i < binCount; i++) {
          const val = this.dataArray[i] / 255.0;
          total += val;
          if (i < bassBins) bassSum += val;
          if (i >= trebleStart) trebleSum += val;
        }

        const intensity = Math.min((total / binCount) * 2.2, 1.0);
        const bass = Math.min((bassSum / bassBins) * 2.0, 1.0);
        const treble = Math.min((trebleSum / (binCount - trebleStart)) * 2.5, 1.0);

        this.onAudioData({ intensity, bass, treble });
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  // Synthetic audio analysis loop for speech synthesis and when mic stream is not direct
  startSyntheticAnalysisLoop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    let syntheticPhase = 0;

    const update = () => {
      if (!this.isListening && !this.isSpeaking) {
        this.onAudioData({ intensity: 0, bass: 0, treble: 0 });
        return;
      }

      syntheticPhase += 0.12;

      // Organic speech rhythm emulation: modulated bursts resembling phonetic cadence
      const burst = Math.sin(syntheticPhase * 2.5) * Math.cos(syntheticPhase * 1.2);
      const intensity = Math.max(0, burst * 0.75 + Math.random() * 0.25);
      const bass = Math.max(0, Math.sin(syntheticPhase * 1.8) * 0.8 + Math.random() * 0.2);
      const treble = Math.max(0, Math.cos(syntheticPhase * 3.2) * 0.7 + Math.random() * 0.3);

      this.onAudioData({ intensity, bass, treble });
      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  // Toggle listening state
  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    if (!this.recognition) {
      this.onError('Speech Recognition is not available in your browser. Please type your message below.');
      return;
    }

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Recognition start caught:', err);
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    // Stop mic tracks to free hardware indicator
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    this.onStateChange('idle');
  }

  // Speak response using SpeechSynthesis with audio-reactive synchronization
  speak(text, onComplete) {
    if (!this.speechSynthesis || this.isMuted) {
      if (onComplete) onComplete();
      return;
    }

    // Cancel any previous utterance
    this.speechSynthesis.cancel();

    // Clean markdown/symbols from speech text
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#>[\]()~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanText) {
      if (onComplete) onComplete();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.05; // Modern AI cadence
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.onStateChange('speaking');
      // Gentle ambient chime shimmer when speech begins
      sound.playChime('response');
      this.startSyntheticAnalysisLoop();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.onStateChange('idle');
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.onAudioData({ intensity: 0, bass: 0, treble: 0 });
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      this.isSpeaking = false;
      this.onStateChange('idle');
      if (onComplete) onComplete();
    };

    this.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.onStateChange('idle');
  }

  setMute(muted) {
    this.isMuted = muted;
    sound.setMute(muted);
    if (muted && this.isSpeaking) {
      this.stopSpeaking();
    }
  }
}
