// src/voice.js
// Human-Centric Speech Recognition, Modulated Speech Synthesis, and Web Audio API Analyzer
// Features: Expressive pitch modulation (1.05 warm, 0.98 serious), natural cadence (1.02 rate),
// graceful sentence-by-sentence pause cadence ("insaan jaisa bolna"), and procedural acoustic feedback.

import { sound } from './sound.js';
import { DeepgramAuraManager } from './deepgram.js';

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

    this.speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.selectedVoice = null;
    this.lang = 'en-US';

    // Deepgram Aura & Flux High-Fidelity Voice Manager
    this.deepgram = new DeepgramAuraManager({
      audioContext: null,
      analyserNode: null,
      onStateChange: (state) => {
        this.isSpeaking = (state === 'speaking');
        this.onStateChange(state);
      },
      onError: (err) => {
        console.warn('Deepgram notice:', err);
      }
    });

    // Streaming Clause-Pipelined TTS State
    this.sentenceQueue = [];
    this.clauseAccumulator = '';
    this.isFirstClause = true;
    this.isStreaming = false;
    this.isStreamComplete = false;
    this.isSpeakingSentence = false;
    this.streamOnComplete = null;
    this.onWordCallback = null;
    this.onClauseStartCallback = null;
    this.pauseTimeoutId = null;
    this.currentUtterance = null;
    this.speechSessionId = 0;

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

  // Initialize SpeechRecognition (Speech-to-Text) with instant Barge-In
  initRecognition() {
    if (typeof window === 'undefined') return;
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
        // Barge-In: immediately interrupt AI speech when mic starts
        if (this.isSpeaking || this.isStreaming) {
          this.cancelSpeech();
        }
        this.isListening = true;
        this.onStateChange('listening');
        sound.playChime('activate');
        this.startMicAudioAnalysis();
      };

      this.recognition.onresult = (event) => {
        // Barge-In: if user starts speaking while AI is speaking, cancel immediately
        if (this.isSpeaking || this.isStreaming) {
          this.cancelSpeech();
        }

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

  // Initialize SpeechSynthesis (Text-to-Speech) with High-Definition Voice Preference
  initVoices() {
    if (!this.speechSynthesis) return;

    const loadVoices = () => {
      const voices = this.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const isHindi = this.lang && this.lang.startsWith('hi');
      let preferred = null;

      if (isHindi) {
        preferred = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) ||
                    voices.find(v => v.name.includes('Swara') || v.name.includes('Madhur') || v.name.includes('Lekha')) ||
                    voices.find(v => v.lang.includes('IN')) ||
                    voices.find(v => v.lang.startsWith('en'));
      } else {
        // High fidelity natural voices preference order
        preferred = voices.find(v => (v.name.includes('Natural') || v.name.includes('Online')) && v.lang.startsWith('en')) ||
                    voices.find(v => (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen') || v.name.includes('Serena')) && v.lang.startsWith('en')) ||
                    voices.find(v => v.lang.startsWith('en-US')) ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0];
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
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    if (this.deepgram && this.audioContext) {
      this.deepgram.audioContext = this.audioContext;
    }
    if (this.deepgram && this.analyser) {
      this.deepgram.analyserNode = this.analyser;
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
        // Connect procedural sound synthesizer to the same analyser
        sound.connectAnalyser(this.analyser);
      }

      if (!this.micStream && navigator.mediaDevices) {
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

      if (typeof requestAnimationFrame !== 'undefined') {
        this.animationFrameId = requestAnimationFrame(update);
      }
    };

    update();
  }

  // Synthetic audio analysis loop for speech synthesis and when mic stream is not direct
  startSyntheticAnalysisLoop() {
    if (this.animationFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = null;

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
      if (typeof requestAnimationFrame !== 'undefined') {
        this.animationFrameId = requestAnimationFrame(update);
      }
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
    // Instant Barge-In: immediately cancel any speaking AI session
    if (this.isSpeaking || this.isStreaming) {
      this.cancelSpeech();
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

  // Clean Markdown & Code for Speech Synthesis
  cleanTextForSpeech(text) {
    return text
      // Replace code blocks with natural spoken prompt
      .replace(/```[\s\S]*?```/g, 'Here is the code implementation.')
      // Replace inline code with plain word
      .replace(/`([^`]+)`/g, '$1')
      // Remove LaTeX math blocks or formulas
      .replace(/\$\$[\s\S]*?\$\$/g, 'Mathematical equation displayed.')
      .replace(/\$([^\$]+)\$/g, '$1')
      .replace(/\\lvert|\\rangle|\\frac|\\text|\\psi/g, '')
      // Clean URLs
      .replace(/https?:\/\/\S+/g, 'link')
      // Remove markdown links: [label](url) -> label
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Clean quotes, bullets, asterisks, brackets, hashes
      .replace(/^[•\-\*]\s+/gm, '')
      .replace(/[*_#>[\]~]/g, '')
      // Strip emojis so TTS does not read out emoji names
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      // Simplify double quotes
      .replace(/["""]/g, '"')
      .replace(/[''']/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract spoken word accounting for Devanagari & Latin unicode
  _extractWord(text, charIndex, charLength) {
    if (charLength && charLength > 0) {
      return text.substr(charIndex, charLength);
    }
    const remainder = text.slice(charIndex);
    const match = remainder.match(/^[\w\u0900-\u097F\uA8E0-\uA8FF']+/);
    return match ? match[0] : remainder.split(/\s+/)[0] || '';
  }

  // Compute Expressive Pitch & Rate Modulation per sentence
  calculateModulation(sentence) {
    const s = sentence.toLowerCase();

    // 1. Warm greetings, cheerful, emotional warmth, poetry, jokes -> 1.05 Pitch
    const isWarmOrGreeting = /namaste|pranam|hello|\bhi\b|\bhey\b|badhiya|first-class|dost|sukoon|khoobsurat|shayari|kavita|\bsher\b|joke|chutkula|smile|laugh|welcome|congratulations|shubh|sweet dreams|bhai|yaar|dil se/i.test(s);
    if (isWarmOrGreeting) {
      return {
        pitch: 1.05,
        rate: 1.03 // Natural lively cadence
      };
    }

    // 2. Serious explanations, science, physics, algorithms, architecture -> 0.98 Pitch
    const isSeriousExplanation = /quantum|singularity|schwarzschild|mechanics|equation|algorithm|complexity|architecture|backpropagation|transformer|tensor|diagnostic|status|polygons|physics|proof|mathematics|quicksort|binary search|lomuto|in-place|partition|o\(|glsl/i.test(s);
    if (isSeriousExplanation) {
      return {
        pitch: 0.98,
        rate: 1.02 // Grounded, thoughtful cadence
      };
    }

    // 3. Contemplative philosophy -> 1.00 Pitch, slightly slower reflective pace
    const isContemplative = /consciousness|qualia|hard problem|universe|cosmos|philosophy|memento mori|stoic|panpsychism|meaning of life|simulation/i.test(s);
    if (isContemplative) {
      return {
        pitch: 1.00,
        rate: 1.00
      };
    }

    // 4. Default natural human conversational standard
    return {
      pitch: 1.02,
      rate: 1.03
    };
  }

  // Start a new streaming speech pipeline session
  startStreamingSpeech({ onWord, onClauseStart, onComplete } = {}) {
    this.cancelSpeech();
    this.isStreaming = true;
    this.isStreamComplete = false;
    this.isFirstClause = true;
    this.clauseAccumulator = '';
    this.sentenceQueue = [];
    this.streamOnComplete = onComplete || null;
    this.onWordCallback = onWord || null;
    this.onClauseStartCallback = onClauseStart || null;
  }

  // Feed streamed token/chunk from AIEngine with clause breakpoint accumulator
  feedSpeechToken(token) {
    if (this.isMuted || !this.speechSynthesis) return;
    this.clauseAccumulator += token;

    let nextClause = this._extractNextClause();
    while (nextClause) {
      this._dispatchClause(nextClause);
      nextClause = this._extractNextClause();
    }
  }

  // Extract next natural clause from accumulator
  // First clause breaks ultra-fast (sub-150ms TTFW: initial 4-6 words or first punctuation)
  // Subsequent clauses break smoothly on phrase/sentence boundaries
  _extractNextClause() {
    const text = this.clauseAccumulator;
    if (!text || !text.trim()) return null;

    if (this.isFirstClause) {
      // 1. Natural breakpoint (comma, period, question mark, semicolon, dash, colon, devanagari danda)
      const punctMatch = text.match(/[.!?,;:\n—–|।]/);
      if (punctMatch && punctMatch.index !== undefined) {
        const breakIdx = punctMatch.index + punctMatch[0].length;
        const clause = text.slice(0, breakIdx).trim();
        this.clauseAccumulator = text.slice(breakIdx).trimStart();
        if (clause) {
          this.isFirstClause = false;
          return clause;
        }
      }

      // 2. Initial 4-6 words threshold if no punctuation arrived yet (sub-150ms TTFW guarantee!)
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 4) {
        const targetWordCount = Math.min(5, words.length);
        const wordRegex = /\S+\s*/g;
        let count = 0;
        let match;
        let breakIdx = -1;
        while ((match = wordRegex.exec(text)) !== null) {
          count++;
          if (count === targetWordCount) {
            breakIdx = match.index + match[0].length;
            break;
          }
        }
        if (breakIdx > 0) {
          const clause = text.slice(0, breakIdx).trim();
          this.clauseAccumulator = text.slice(breakIdx).trimStart();
          if (clause) {
            this.isFirstClause = false;
            return clause;
          }
        }
      }
    } else {
      // Subsequent clauses: break on sentence boundaries, or mid-sentence pauses
      const sentenceEndMatch = text.match(/[.!?।\n]/);
      if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
        const breakIdx = sentenceEndMatch.index + sentenceEndMatch[0].length;
        const clause = text.slice(0, breakIdx).trim();
        this.clauseAccumulator = text.slice(breakIdx).trimStart();
        if (clause) return clause;
      }

      const words = text.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 4) {
        const commaMatch = text.match(/[,;:\—–]/);
        if (commaMatch && commaMatch.index !== undefined) {
          const breakIdx = commaMatch.index + commaMatch[0].length;
          const clause = text.slice(0, breakIdx).trim();
          this.clauseAccumulator = text.slice(breakIdx).trimStart();
          if (clause) return clause;
        }
      }

      if (words.length >= 9) {
        const wordRegex = /\S+\s*/g;
        let count = 0;
        let match;
        let breakIdx = -1;
        while ((match = wordRegex.exec(text)) !== null) {
          count++;
          if (count === 8) {
            breakIdx = match.index + match[0].length;
            break;
          }
        }
        if (breakIdx > 0) {
          const clause = text.slice(0, breakIdx).trim();
          this.clauseAccumulator = text.slice(breakIdx).trimStart();
          if (clause) return clause;
        }
      }
    }

    return null;
  }

  _dispatchClause(clauseText) {
    const cleaned = this.cleanTextForSpeech(clauseText);
    if (!cleaned) return;

    this.sentenceQueue.push(cleaned);

    if (!this.isSpeaking) {
      this._startSpeakingQueue();
    } else if (!this.isSpeakingSentence && this.speakNextFunction) {
      this.speakNextFunction();
    }
  }

  _startSpeakingQueue() {
    if (!this.speechSynthesis || this.isMuted) {
      if (this.isStreamComplete && this.sentenceQueue.length === 0) {
        this._finishSpeech();
      }
      return;
    }

    this.speechSessionId++;
    const currentSession = this.speechSessionId;

    this.isSpeaking = true;
    this.onStateChange('speaking');
    sound.playChime('response');
    this.startSyntheticAnalysisLoop();

    const speakNext = () => {
      if (currentSession !== this.speechSessionId || !this.isSpeaking) {
        this.isSpeakingSentence = false;
        return;
      }

      if (this.sentenceQueue.length === 0) {
        this.isSpeakingSentence = false;
        if (this.isStreamComplete) {
          this._finishSpeech();
        }
        return;
      }

      this.isSpeakingSentence = true;
      const sentence = this.sentenceQueue.shift();
      const { pitch, rate } = this.calculateModulation(sentence);

      const utterance = new SpeechSynthesisUtterance(sentence);
      this.currentUtterance = utterance;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.pitch = pitch;
      utterance.rate = rate;
      if (this.lang) utterance.lang = this.lang;

      utterance.onstart = () => {
        if (currentSession !== this.speechSessionId) return;
        if (this.onClauseStartCallback) {
          this.onClauseStartCallback(sentence);
        }
      };

      utterance.onboundary = (event) => {
        if (currentSession !== this.speechSessionId) return;
        if (event.name === 'word') {
          const word = this._extractWord(sentence, event.charIndex, event.charLength);
          if (this.onWordCallback) {
            this.onWordCallback(word, sentence);
          }
        }
      };

      utterance.onend = () => {
        if (currentSession !== this.speechSessionId) return;

        // Gapless human breath pauses: 45ms for comma/semicolon, 110ms for sentence boundaries
        const isSentenceEnd = /[.!?।]$/.test(sentence);
        const pauseDuration = isSentenceEnd ? 110 : 45;

        this.onAudioData({ intensity: 0.05, bass: 0.02, treble: 0.02 });

        this.pauseTimeoutId = setTimeout(() => {
          speakNext();
        }, pauseDuration);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance notice:', e);
        if (currentSession !== this.speechSessionId) return;
        speakNext();
      };

      // Deepgram Aura & Flux High-Fidelity Voice Synthesis
      if (this.deepgram && this.deepgram.apiKey) {
        if (this.onClauseStartCallback) {
          this.onClauseStartCallback(sentence);
        }
        const words = sentence.split(/\s+/).filter(Boolean);
        words.forEach((w, idx) => {
          setTimeout(() => {
            if (currentSession === this.speechSessionId && this.onWordCallback) {
              this.onWordCallback(w, sentence);
            }
          }, idx * 160);
        });

        this.ensureAudioContext().then(() => {
          this.deepgram.audioContext = this.audioContext;
          this.deepgram.analyserNode = this.analyser;
          return this.deepgram.speak(sentence, {
            lang: this.lang,
            onEnd: () => {
              if (currentSession !== this.speechSessionId) return;
              this.isSpeakingSentence = false;
              const isSentenceEnd = /[.!?।]$/.test(sentence);
              const pauseDuration = isSentenceEnd ? 90 : 35;
              this.pauseTimeoutId = setTimeout(speakNext, pauseDuration);
            },
            onError: (err) => {
              console.warn('Deepgram speak error, falling back to Web Speech:', err);
              this.speechSynthesis.speak(utterance);
            }
          });
        }).catch(err => {
          console.warn('Deepgram audio context error:', err);
          this.speechSynthesis.speak(utterance);
        });
        return;
      }

      if (this.speechSynthesis.paused) {
        this.speechSynthesis.resume();
      }

      this.speechSynthesis.speak(utterance);
    };

    this.speakNextFunction = speakNext;
    speakNext();
  }

  // Finalize streaming speech when AI generation completes
  endStreamingSpeech() {
    this.isStreamComplete = true;
    const remaining = this.clauseAccumulator.trim();
    this.clauseAccumulator = '';
    if (remaining) {
      this._dispatchClause(remaining);
    }
    if (this.sentenceQueue.length === 0 && !this.isSpeakingSentence) {
      this._finishSpeech();
    }
  }

  _finishSpeech() {
    this.isSpeaking = false;
    this.isStreaming = false;
    this.isSpeakingSentence = false;
    this.sentenceQueue = [];
    this.clauseAccumulator = '';
    this.speakNextFunction = null;

    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId);
      this.pauseTimeoutId = null;
    }

    if (this.animationFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }

    this.onAudioData({ intensity: 0, bass: 0, treble: 0 });
    this.onStateChange('idle');

    if (this.streamOnComplete) {
      const cb = this.streamOnComplete;
      this.streamOnComplete = null;
      cb();
    }
  }

  // Instant Barge-In / Interruption: cancel speech and flush queue immediately
  cancelSpeech() {
    this.speechSessionId++;
    this.isStreaming = false;
    this.isStreamComplete = true;
    this.isSpeaking = false;
    this.isSpeakingSentence = false;
    this.isFirstClause = true;
    this.clauseAccumulator = '';
    this.sentenceQueue = [];
    this.speakNextFunction = null;

    if (this.deepgram) {
      this.deepgram.stop();
    }

    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId);
      this.pauseTimeoutId = null;
    }

    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }

    if (this.animationFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }

    this.onAudioData({ intensity: 0, bass: 0, treble: 0 });
    this.onStateChange('idle');

    if (this.streamOnComplete) {
      const cb = this.streamOnComplete;
      this.streamOnComplete = null;
      cb();
    }
  }

  stopSpeaking() {
    this.cancelSpeech();
  }

  // Pipelined speech for full strings
  speak(text, onComplete) {
    if (!this.speechSynthesis || this.isMuted) {
      if (onComplete) onComplete();
      return;
    }

    this.startStreamingSpeech({ onComplete });
    this.feedSpeechToken(text);
    this.endStreamingSpeech();
  }

  // High-level async generator consumer
  async speakStream(asyncIterator, options = {}) {
    this.startStreamingSpeech(options);
    try {
      for await (const token of asyncIterator) {
        if (!this.isStreaming) break;
        if (options.onToken) options.onToken(token);
        this.feedSpeechToken(token);
      }
      this.endStreamingSpeech();
    } catch (err) {
      console.warn('speakStream notice:', err);
      this.cancelSpeech();
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    sound.setMute(muted);
    if (muted && this.isSpeaking) {
      this.cancelSpeech();
    }
  }
}
