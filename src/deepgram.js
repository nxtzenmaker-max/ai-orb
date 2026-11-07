// src/deepgram.js
// Deepgram Aura & Flux Expressive Voice Engine
// Ultra-low latency, studio-quality human voice synthesis with real-time 3D Orb visualizer coupling

export const DEEPGRAM_DEFAULT_KEY = '69af5b84f97eade08cffac0c385eadb0fb307b83';

export const DEEPGRAM_MODELS = {
  hindi: {
    id: 'flux-pallavi-hi',
    name: 'Pallavi (Hindi)',
    version: 'v2',
    expressivity: 2,
    endpoint: 'https://api.deepgram.com/v2/speak?model=flux-pallavi-hi&expressivity=2'
  },
  english: [
    { id: 'aura-asteria-en', name: 'Asteria (Warm & Natural)', version: 'v1' },
    { id: 'aura-luna-en', name: 'Luna (Lively & Conversational)', version: 'v1' },
    { id: 'aura-stella-en', name: 'Stella (Clear & Professional)', version: 'v1' },
    { id: 'aura-helios-en', name: 'Helios (Warm & Thoughtful Male)', version: 'v1' },
    { id: 'aura-zeus-en', name: 'Zeus (Deep & Commanding Male)', version: 'v1' },
    { id: 'aura-orion-en', name: 'Orion (Modern & Approachable Male)', version: 'v1' }
  ]
};

export class DeepgramAuraManager {
  constructor({ audioContext, analyserNode, onStateChange, onError }) {
    this.audioContext = audioContext;
    this.analyserNode = analyserNode;
    this.onStateChange = onStateChange || (() => {});
    this.onError = onError || (() => {});

    // Use stored key or default user key
    this.apiKey = localStorage.getItem('nexus_deepgram_api_key') || DEEPGRAM_DEFAULT_KEY;
    this.selectedEnglishVoice = localStorage.getItem('nexus_deepgram_voice') || 'aura-asteria-en';
    this.currentLanguage = 'en'; // 'en' or 'hi'
    this.currentSource = null;
    this.isPlaying = false;
    this.abortController = null;
    this.isMuted = false;
  }

  setLanguage(lang) {
    this.currentLanguage = (lang && lang.startsWith('hi')) ? 'hi' : 'en';
  }

  setMute(muted) {
    this.isMuted = muted;
    if (muted && this.isPlaying) {
      this.stop();
    }
  }

  setApiKey(key) {
    const trimmed = (key || '').trim();
    this.apiKey = trimmed || DEEPGRAM_DEFAULT_KEY;
    localStorage.setItem('nexus_deepgram_api_key', this.apiKey);
  }

  getApiKey() {
    return this.apiKey;
  }

  setEnglishVoice(voiceId) {
    this.selectedEnglishVoice = voiceId;
    localStorage.setItem('nexus_deepgram_voice', voiceId);
  }

  getEnglishVoice() {
    return this.selectedEnglishVoice;
  }

  // Pre-clean text for spoken naturalness
  cleanTextForSpeech(text) {
    return text
      .replace(/```[\s\S]*?```/g, ' यहाँ कोड दिया गया है। ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$]+\$/g, '')
      .trim();
  }

  // Speak text using Deepgram Aura / Flux
  async speak(text, options = {}) {
    if (this.isMuted) return;

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText || cleanText.length < 2) return;

    this.stop();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {}
    }

    this.abortController = new AbortController();
    this.isPlaying = true;
    this.onStateChange('speaking');

    try {
      const isHindi = options.lang ? options.lang.startsWith('hi') : this.currentLanguage === 'hi';
      let endpoint;

      if (isHindi) {
        // Flux Pallavi Hindi model (v2 API with expressivity)
        endpoint = `https://api.deepgram.com/v2/speak?model=flux-pallavi-hi&expressivity=2`;
      } else {
        // Deepgram Aura English model (v1 API)
        const voice = options.voice || this.selectedEnglishVoice;
        endpoint = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}&encoding=mp3`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: cleanText }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Deepgram TTS (${response.status}): ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (!this.isPlaying) return;

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      if (!this.isPlaying) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Pipe through AnalyserNode so 3D Particle Orb reacts in real time to the voice!
      if (this.analyserNode) {
        source.connect(this.analyserNode);
      }
      source.connect(this.audioContext.destination);

      this.currentSource = source;

      source.onended = () => {
        if (this.currentSource === source) {
          this.isPlaying = false;
          this.currentSource = null;
          this.onStateChange('idle');
          if (options.onEnd) options.onEnd();
        }
      };

      source.start(0);
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.isPlaying = false;
      this.onStateChange('idle');
      console.warn('Deepgram playback error, falling back:', err.message);
      if (options.onError) options.onError(err);
      throw err;
    }
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {}
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.onStateChange('idle');
  }
}
