// src/main.js
import { AIOrb } from './orb.js';
import { VoiceManager } from './voice.js';
import { AIEngine } from './ai.js';
import { sound } from './sound.js';

// DOM Elements
const ambientAura = document.getElementById('ambient-aura');
const canvasContainer = document.getElementById('canvas-container');
const visualizerCanvas = document.getElementById('visualizer-canvas');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const btnMic = document.getElementById('btn-mic');
const iconMic = document.getElementById('icon-mic');
const iconMicActive = document.getElementById('icon-mic-active');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const transcriptBody = document.getElementById('transcript-body');
const transcriptDrawer = document.getElementById('transcript-drawer') || document.getElementById('transcript-panel');
const transcriptBackdrop = document.getElementById('transcript-backdrop');
const btnToggleDrawer = document.getElementById('btn-toggle-drawer');
const btnMinimizePanel = document.getElementById('btn-minimize-panel');
const btnDrawerClear = document.getElementById('btn-drawer-clear');
const drawerDragArea = document.getElementById('drawer-drag-area');
const chatPillBadge = document.getElementById('chat-pill-badge');
const liveCaptionPill = document.getElementById('live-caption-pill');
const liveCaptionText = document.getElementById('live-caption-text');
const btnToggleVisualizer = document.getElementById('btn-toggle-visualizer');
const btnToggleMute = document.getElementById('btn-toggle-mute');
const iconVolumeOn = document.getElementById('icon-volume-on');
const iconVolumeOff = document.getElementById('icon-volume-off');
const btnClearChat = document.getElementById('btn-clear-chat');
const btnToggleLang = document.getElementById('btn-toggle-lang');
const btnToggleAura = document.getElementById('btn-toggle-aura');

// Instantiate Core Engines
const orb = new AIOrb(canvasContainer);
const ai = new AIEngine();

let currentInterimBubble = null;
let isVisualizerActive = true;
let isMuted = false;
let messageCount = 1;
let captionTimeout = null;

// 2D Audio Waveform Ring Visualizer
const vCtx = visualizerCanvas.getContext('2d');
let lastAudioMetrics = { intensity: 0, bass: 0, treble: 0 };

function resizeVisualizer() {
  const size = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.85, 440);
  visualizerCanvas.width = size;
  visualizerCanvas.height = size;
}
resizeVisualizer();
window.addEventListener('resize', resizeVisualizer);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (!isVisualizerActive) return;

  const w = visualizerCanvas.width;
  const h = visualizerCanvas.height;
  const cx = w / 2;
  const cy = h / 2;

  vCtx.clearRect(0, 0, w, h);

  const { intensity, bass, treble } = lastAudioMetrics;
  if (intensity < 0.02) return;

  const bars = 48;
  const baseRadius = w * 0.38;

  vCtx.save();
  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2;
    const freqOffset = Math.sin(i * 0.4 + performance.now() * 0.005) * 0.5 + 0.5;
    const barHeight = (intensity * 28 + bass * 20 + treble * freqOffset * 24);

    const x1 = cx + Math.cos(angle) * baseRadius;
    const y1 = cy + Math.sin(angle) * baseRadius;
    const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
    const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);

    const gradient = vCtx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.7)');
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.9)');

    vCtx.strokeStyle = gradient;
    vCtx.lineWidth = 2.5;
    vCtx.lineCap = 'round';

    vCtx.beginPath();
    vCtx.moveTo(x1, y1);
    vCtx.lineTo(x2, y2);
    vCtx.stroke();
  }
  vCtx.restore();
}
drawVisualizer();

// Enhanced Markdown Formatter with Copyable Code Blocks
function formatMarkdown(text) {
  let html = text
    // Code blocks with syntax container, language badge, and copy button
    .replace(/```([a-z0-9_+-]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
      const language = (lang || 'code').trim();
      const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `
        <div class="code-card">
          <div class="code-card-header">
            <span class="code-card-lang">${language.toUpperCase()}</span>
            <button class="code-copy-btn" type="button" aria-label="Copy code to clipboard">
              <svg class="copy-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span class="copy-label">Copy</span>
            </button>
          </div>
          <pre><code>${escaped}</code></pre>
        </div>
      `;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Bullet points
    .replace(/^[•\-\*]\s+(.*)$/gim, '<p>• $1</p>')
    // Blockquotes
    .replace(/^>\s+(.*)$/gim, '<blockquote>$1</blockquote>')
    // Line breaks
    .replace(/\n\n+/g, '</p><p>');

  return `<p>${html}</p>`;
}

// Update Chat Badge Indicator
function updateBadge() {
  if (chatPillBadge) {
    chatPillBadge.textContent = messageCount;
  }
}

// Floating Live Caption Toast Pill (shown when drawer is collapsed)
function showLiveCaption(text) {
  if (!liveCaptionPill || !liveCaptionText) return;
  // If drawer is already open, do not obstruct with the toast pill
  if (transcriptDrawer && !transcriptDrawer.classList.contains('collapsed')) {
    liveCaptionPill.classList.remove('visible');
    return;
  }
  const cleanSnippet = text.replace(/<[^>]*>/g, '').trim();
  if (!cleanSnippet) return;
  liveCaptionText.textContent = cleanSnippet;
  liveCaptionPill.classList.add('visible');
  clearTimeout(captionTimeout);
  captionTimeout = setTimeout(() => {
    liveCaptionPill.classList.remove('visible');
  }, 4800);
}

// Append message to transcript container with auto-scroll
function appendMessage(sender, content, isInterim = false) {
  if (isInterim && currentInterimBubble) {
    currentInterimBubble.querySelector('.msg-bubble').innerHTML = `<p class="live-interim">${content}...</p>`;
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
    showLiveCaption(content);
    return;
  }

  const msgEl = document.createElement('div');
  msgEl.className = `message-item ${sender === 'user' ? 'user-msg' : 'orb-msg'}`;

  const senderLabel = document.createElement('span');
  senderLabel.className = 'msg-sender';
  senderLabel.textContent = sender === 'user' ? 'You' : 'NEXUS Core';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (isInterim) {
    bubble.innerHTML = `<p class="live-interim">${content}...</p>`;
    currentInterimBubble = msgEl;
    showLiveCaption(content);
  } else {
    bubble.innerHTML = formatMarkdown(content);
    currentInterimBubble = null;
    messageCount++;
    updateBadge();
    showLiveCaption(content.slice(0, 90));
  }

  msgEl.appendChild(senderLabel);
  msgEl.appendChild(bubble);
  transcriptBody.appendChild(msgEl);

  transcriptBody.scrollTop = transcriptBody.scrollHeight;
  return bubble;
}

// Typewriter effect for streaming assistant text with natural human-like cadence
async function streamMessage(fullText, onProgress) {
  const bubble = appendMessage('orb', '');
  let currentText = '';
  const words = fullText.split(' ');

  for (let i = 0; i < words.length; i++) {
    currentText += (i === 0 ? '' : ' ') + words[i];
    bubble.innerHTML = formatMarkdown(currentText);
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
    if (onProgress) onProgress();

    // Natural typing cadence with breathing pauses for punctuation
    const word = words[i];
    let pause = 20;
    if (/[.!?]$/.test(word)) {
      pause = 65; // Sentence boundary pause
    } else if (/[,;:]$/.test(word)) {
      pause = 36; // Mid-sentence breath pause
    } else if (word.includes('\n')) {
      pause = 44; // Paragraph line break pause
    }
    await new Promise(r => setTimeout(r, pause));
  }
}

// Update UI Status Badge & Dynamic Aura Synchronization
function setStatus(state) {
  const stateLabels = {
    idle: 'Idle',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking'
  };

  statusBadge.dataset.state = state;
  statusText.textContent = stateLabels[state] || state;
  if (ambientAura) {
    ambientAura.dataset.state = state;
  }
  document.body.dataset.state = state;
  orb.setState(state);

  if (state === 'listening') {
    btnMic.classList.add('active');
    iconMic.style.display = 'none';
    iconMicActive.style.display = 'block';
  } else {
    btnMic.classList.remove('active');
    iconMic.style.display = 'block';
    iconMicActive.style.display = 'none';
  }
}

// Drawer Expansion & Collapse Logic
function openDrawer() {
  if (!transcriptDrawer) return;
  transcriptDrawer.classList.remove('collapsed');
  if (transcriptBackdrop) transcriptBackdrop.classList.add('active');
  if (liveCaptionPill) liveCaptionPill.classList.remove('visible');
  transcriptBody.scrollTop = transcriptBody.scrollHeight;
}

function closeDrawer() {
  if (!transcriptDrawer) return;
  transcriptDrawer.classList.add('collapsed');
  if (transcriptBackdrop) transcriptBackdrop.classList.remove('active');
  transcriptDrawer.style.transform = '';
}

function toggleDrawer() {
  if (!transcriptDrawer) return;
  sound.playChime('tap');
  if (transcriptDrawer.classList.contains('collapsed')) {
    openDrawer();
  } else {
    closeDrawer();
  }
}

// Wire Drawer Triggers
if (btnToggleDrawer) {
  btnToggleDrawer.addEventListener('click', toggleDrawer);
}
if (btnMinimizePanel) {
  btnMinimizePanel.addEventListener('click', () => {
    sound.playChime('tap');
    closeDrawer();
  });
}
if (transcriptBackdrop) {
  transcriptBackdrop.addEventListener('click', () => {
    sound.playChime('tap');
    closeDrawer();
  });
}
if (liveCaptionPill) {
  liveCaptionPill.addEventListener('click', () => {
    sound.playChime('tap');
    liveCaptionPill.classList.remove('visible');
    openDrawer();
  });
}
if (btnDrawerClear) {
  btnDrawerClear.addEventListener('click', () => {
    btnClearChat.click();
  });
}

// Swipe down to dismiss on mobile
if (drawerDragArea && transcriptDrawer) {
  let startY = 0;
  let currentDeltaY = 0;
  let isDragging = false;

  drawerDragArea.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startY = e.touches[0].clientY;
      currentDeltaY = 0;
      isDragging = true;
      transcriptDrawer.style.transition = 'none';
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;
    if (delta > 0) {
      currentDeltaY = delta;
      transcriptDrawer.style.transform = `translateY(${delta}px)`;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    transcriptDrawer.style.transition = '';
    if (currentDeltaY > 65) {
      sound.playChime('tap');
      closeDrawer();
    } else {
      transcriptDrawer.style.transform = '';
    }
  });
}

// Active Stream Controller for Instant Live Interruption & Barge-In
let activeStreamAbortController = null;

// Voice Manager Setup
const voiceManager = new VoiceManager({
  onTranscript: ({ interim, final }) => {
    // Instant Live Barge-In: if user starts speaking while AI is speaking, cancel AI immediately!
    if (voiceManager.isSpeaking || voiceManager.isStreaming) {
      if (activeStreamAbortController) {
        activeStreamAbortController.abort();
        activeStreamAbortController = null;
      }
      voiceManager.cancelSpeech();
    }

    if (interim) {
      appendMessage('user', interim, true);
    }
    if (final) {
      if (currentInterimBubble) {
        currentInterimBubble.remove();
        currentInterimBubble = null;
      }
      handleUserPrompt(final, true);
    }
  },
  onStateChange: (state) => {
    setStatus(state);
  },
  onAudioData: (data) => {
    lastAudioMetrics = data;
    orb.setAudioData(data);
    if (ambientAura) {
      const boost = (data.intensity * 0.45 + data.bass * 0.35).toFixed(3);
      ambientAura.style.setProperty('--audio-boost', boost);
    }
  },
  onError: (msg) => {
    sound.playChime('error');
    appendMessage('orb', `*Notice:* ${msg}`);
  }
});

// Process User Query with Instant Streaming Pipeline & Sub-150ms TTFW Voice Dispatch
async function handleUserPrompt(promptText, isVoice = false) {
  const query = promptText.trim();
  if (!query) return;

  // Instant Barge-In: Abort any previous active generation & voice pipeline immediately
  if (activeStreamAbortController) {
    activeStreamAbortController.abort();
    activeStreamAbortController = null;
  }
  voiceManager.cancelSpeech();

  // Create new AbortController for this conversation turn
  activeStreamAbortController = new AbortController();
  const signal = activeStreamAbortController.signal;

  // Append user message
  appendMessage('user', query);
  userInput.value = '';

  // Trigger completion sound feedback for typed input
  if (!isVoice) {
    sound.playChime('complete');
  }

  // Trigger Thinking State & Shockwave
  setStatus('thinking');
  orb.triggerShockwave();

  // Create live assistant message bubble with blinking cursor
  const bubble = appendMessage('orb', '', false);
  bubble.innerHTML = '<span class="live-typing-cursor">●</span>';

  let accumulatedText = '';
  let speechHasStarted = false;

  // Start Instant Streaming Voice Pipeline
  voiceManager.startStreamingSpeech({
    onWord: (word, clause) => {
      // Synchronous word-by-word starlight displacement wave & particle ripple
      orb.pulseWord(word);
      // Synchronous live caption toast update
      showLiveCaption(clause || word);
    },
    onClauseStart: (clause) => {
      if (!speechHasStarted) {
        speechHasStarted = true;
        setStatus('speaking');
      }
      showLiveCaption(clause);
    },
    onComplete: () => {
      setStatus('idle');
    }
  });

  try {
    // Stream tokens directly from AI engine generator
    const tokenStream = ai.streamAnswer(query, signal);

    for await (const token of tokenStream) {
      if (signal.aborted) break;

      accumulatedText += token;

      // Real-time markdown rendering
      bubble.innerHTML = formatMarkdown(accumulatedText);
      transcriptBody.scrollTop = transcriptBody.scrollHeight;

      // Concurrently feed token into clause-pipelined TTS engine (sub-150ms TTFW)
      voiceManager.feedSpeechToken(token);
    }

    // Finalize stream in voice manager (dispatches any trailing clause)
    voiceManager.endStreamingSpeech();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Error generating streaming response:', err);
      sound.playChime('error');
      bubble.innerHTML = formatMarkdown(accumulatedText || 'An error occurred while synthesizing a neural response.');
      voiceManager.cancelSpeech();
      setStatus('idle');
    }
  }
}

// Event Listeners: Input & Send
btnSend.addEventListener('click', () => {
  sound.playChime('tap');
  handleUserPrompt(userInput.value);
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sound.playChime('tap');
    handleUserPrompt(userInput.value);
  }
});

// Mic Toggle with Instant Barge-In
btnMic.addEventListener('click', () => {
  sound.playChime('tap');
  // Barge-In: if AI is speaking or streaming, immediately cancel speech and switch to listening
  if (voiceManager.isSpeaking || voiceManager.isStreaming || statusBadge.dataset.state === 'speaking') {
    if (activeStreamAbortController) {
      activeStreamAbortController.abort();
      activeStreamAbortController = null;
    }
    voiceManager.cancelSpeech();
    voiceManager.startListening();
    return;
  }
  voiceManager.toggleListening();
});

// Event Delegation for Prompt Suggestion Chips (seamless with static & dynamic chips)
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip-btn');
  if (chip) {
    sound.playChime('tap');
    const prompt = chip.dataset.prompt;
    if (prompt) {
      handleUserPrompt(prompt);
    }
  }
});

// Toggle Visualizer
btnToggleVisualizer.addEventListener('click', () => {
  isVisualizerActive = !isVisualizerActive;
  sound.playChime('toggle');
  btnToggleVisualizer.classList.toggle('active', isVisualizerActive);
  visualizerCanvas.classList.toggle('hidden', !isVisualizerActive);
});

// Toggle Mute
btnToggleMute.addEventListener('click', () => {
  isMuted = !isMuted;
  voiceManager.setMute(isMuted);
  sound.setMute(isMuted);
  btnToggleMute.classList.toggle('active', isMuted);
  iconVolumeOn.style.display = isMuted ? 'none' : 'block';
  iconVolumeOff.style.display = isMuted ? 'block' : 'none';
  if (!isMuted) {
    sound.playChime('toggle');
  }
});

// Deepgram Aura Voice Toggle
const auraVoices = ['aura-asteria-en', 'aura-luna-en', 'aura-helios-en', 'aura-zeus-en'];
let auraVoiceIdx = 0;
if (btnToggleAura) {
  btnToggleAura.addEventListener('click', () => {
    sound.playChime('tap');
    if (currentLang === 'hi') {
      showLiveCaption('⚡ Deepgram Flux Pallavi (Hindi Expressive) Active');
    } else {
      auraVoiceIdx = (auraVoiceIdx + 1) % auraVoices.length;
      const v = auraVoices[auraVoiceIdx];
      if (voiceManager.deepgram) {
        voiceManager.deepgram.setEnglishVoice(v);
      }
      const name = v.replace('aura-', '').replace('-en', '').toUpperCase();
      const lastSpan = btnToggleAura.querySelector('span:last-child');
      if (lastSpan) lastSpan.textContent = name;
      showLiveCaption(`⚡ Deepgram Aura Voice: ${name}`);
    }
  });
}

// Language Toggle (English / Hindi)
let currentLang = 'en';
if (btnToggleLang) {
  btnToggleLang.addEventListener('click', () => {
    sound.playChime('tap');
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    const langCode = currentLang === 'hi' ? 'hi-IN' : 'en-US';
    voiceManager.setLanguage(langCode);
    const span = btnToggleLang.querySelector('span');
    if (span) span.textContent = currentLang.toUpperCase();
    btnToggleLang.title = currentLang === 'hi' ? 'Language: Hindi / Hinglish (Click for English)' : 'Language: English (Click for Hindi)';
  });
}

// Clear Chat History & Context Memory
btnClearChat.addEventListener('click', () => {
  ai.clearHistory();
  sound.playChime('clear');
  transcriptBody.innerHTML = `
    <div class="message-item orb-msg">
      <span class="msg-sender">NEXUS Core</span>
      <div class="msg-bubble">
        <p>Memory stream refreshed. Ready for commands.</p>
      </div>
    </div>
  `;
  messageCount = 1;
  updateBadge();
});

// One-Click Code Snippet Copy Handler (Event Delegation)
transcriptBody.addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('.code-copy-btn');
  if (!copyBtn) return;

  const codeCard = copyBtn.closest('.code-card');
  if (!codeCard) return;

  const codeEl = codeCard.querySelector('pre code');
  if (!codeEl) return;

  const rawCode = codeEl.innerText || codeEl.textContent;
  try {
    await navigator.clipboard.writeText(rawCode);
    sound.playChime('complete');
    copyBtn.classList.add('copied');
    const label = copyBtn.querySelector('.copy-label');
    const prevText = label ? label.textContent : 'Copy';
    if (label) label.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      if (label) label.textContent = prevText;
    }, 2000);
  } catch (err) {
    console.warn('Clipboard copy notice:', err);
  }
});

// Restore Conversation History from Persistent Storage on Startup
function restoreHistory() {
  const history = ai.getHistory();
  if (history && history.length > 0) {
    transcriptBody.innerHTML = '';
    messageCount = 0;
    history.forEach(item => {
      appendMessage(item.role === 'user' ? 'user' : 'orb', item.content);
    });
    updateBadge();
  }
}
restoreHistory();

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  // Space bar toggles mic when not inside an active text input (with instant barge-in)
  if (e.code === 'Space' && document.activeElement !== userInput) {
    e.preventDefault();
    sound.playChime('tap');
    if (voiceManager.isSpeaking || voiceManager.isStreaming || statusBadge.dataset.state === 'speaking') {
      if (activeStreamAbortController) {
        activeStreamAbortController.abort();
        activeStreamAbortController = null;
      }
      voiceManager.cancelSpeech();
      voiceManager.startListening();
      return;
    }
    voiceManager.toggleListening();
  }
  // Escape stops speech synthesis or listening, or closes drawer
  if (e.key === 'Escape') {
    if (transcriptDrawer && !transcriptDrawer.classList.contains('collapsed')) {
      sound.playChime('tap');
      closeDrawer();
      return;
    }
    if (activeStreamAbortController) {
      activeStreamAbortController.abort();
      activeStreamAbortController = null;
    }
    voiceManager.stopListening();
    voiceManager.cancelSpeech();
  }
});
