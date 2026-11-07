// src/main.js
import { AIOrb } from './orb.js';
import { VoiceManager } from './voice.js';
import { AIEngine } from './ai.js';

// DOM Elements
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
const transcriptPanel = document.getElementById('transcript-panel');
const btnMinimizePanel = document.getElementById('btn-minimize-panel');
const btnToggleVisualizer = document.getElementById('btn-toggle-visualizer');
const btnToggleMute = document.getElementById('btn-toggle-mute');
const iconVolumeOn = document.getElementById('icon-volume-on');
const iconVolumeOff = document.getElementById('icon-volume-off');
const btnClearChat = document.getElementById('btn-clear-chat');
const btnToggleLang = document.getElementById('btn-toggle-lang');
const promptChips = document.querySelectorAll('.chip-btn');

// Instantiate Core Engines
const orb = new AIOrb(canvasContainer);
const ai = new AIEngine();

let currentInterimBubble = null;
let isVisualizerActive = true;
let isMuted = false;

// 2D Audio Waveform Ring Visualizer
const vCtx = visualizerCanvas.getContext('2d');
let lastAudioMetrics = { intensity: 0, bass: 0, treble: 0 };

function resizeVisualizer() {
  const size = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.85, 460);
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

// Simple Markdown Formatter for Assistant Responses
function formatMarkdown(text) {
  let html = text
    // Code blocks with syntax container
    .replace(/```([a-z0-9]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre><code>${escaped}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Bullet points
    .replace(/^[•\-\*]\s+(.*)$/gim, '<p>• $1</p>')
    // Line breaks
    .replace(/\n\n+/g, '</p><p>');

  return `<p>${html}</p>`;
}

// Append message to transcript container with auto-scroll
function appendMessage(sender, content, isInterim = false) {
  if (isInterim && currentInterimBubble) {
    currentInterimBubble.querySelector('.msg-bubble').innerHTML = `<p class="live-interim">${content}...</p>`;
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
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
  } else {
    bubble.innerHTML = formatMarkdown(content);
    currentInterimBubble = null;
  }

  msgEl.appendChild(senderLabel);
  msgEl.appendChild(bubble);
  transcriptBody.appendChild(msgEl);

  transcriptBody.scrollTop = transcriptBody.scrollHeight;
  return bubble;
}

// Typewriter effect for streaming assistant text
async function streamMessage(fullText, onProgress) {
  const bubble = appendMessage('orb', '');
  let currentText = '';
  const words = fullText.split(' ');

  for (let i = 0; i < words.length; i++) {
    currentText += (i === 0 ? '' : ' ') + words[i];
    bubble.innerHTML = formatMarkdown(currentText);
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
    if (onProgress) onProgress();
    // Rapid typewriter pace (18-28ms per word)
    await new Promise(r => setTimeout(r, 22));
  }
}

// Update UI Status Badge
function setStatus(state) {
  const stateLabels = {
    idle: 'Idle',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking'
  };

  statusBadge.dataset.state = state;
  statusText.textContent = stateLabels[state] || state;
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

// Voice Manager Setup
const voiceManager = new VoiceManager({
  onTranscript: ({ interim, final }) => {
    if (interim) {
      appendMessage('user', interim, true);
    }
    if (final) {
      if (currentInterimBubble) {
        currentInterimBubble.remove();
        currentInterimBubble = null;
      }
      handleUserPrompt(final);
    }
  },
  onStateChange: (state) => {
    setStatus(state);
  },
  onAudioData: (data) => {
    lastAudioMetrics = data;
    orb.setAudioData(data);
  },
  onError: (msg) => {
    appendMessage('orb', `*Notice:* ${msg}`);
  }
});

// Process User Query
async function handleUserPrompt(promptText) {
  const query = promptText.trim();
  if (!query) return;

  // Append user message
  appendMessage('user', query);
  userInput.value = '';

  // Trigger Thinking State
  setStatus('thinking');
  orb.triggerShockwave();

  try {
    // Generate AI Response
    const response = await ai.answer(query);

    // Speak response + Stream text
    voiceManager.speak(response, () => {
      setStatus('idle');
    });

    await streamMessage(response);
  } catch (err) {
    console.error('Error generating answer:', err);
    appendMessage('orb', 'An error occurred while synthesizing a neural response.');
    setStatus('idle');
  }
}

// Event Listeners: Input & Send
btnSend.addEventListener('click', () => {
  handleUserPrompt(userInput.value);
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleUserPrompt(userInput.value);
  }
});

// Mic Toggle
btnMic.addEventListener('click', () => {
  voiceManager.toggleListening();
});

// Suggestion Chips
promptChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    if (prompt) {
      handleUserPrompt(prompt);
    }
  });
});

// Panel Minimize / Expand
let isPanelMinimized = false;
btnMinimizePanel.addEventListener('click', () => {
  isPanelMinimized = !isPanelMinimized;
  if (isPanelMinimized) {
    transcriptPanel.classList.add('minimized');
    btnMinimizePanel.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
  } else {
    transcriptPanel.classList.remove('minimized');
    btnMinimizePanel.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
  }
});

// Toggle Visualizer
btnToggleVisualizer.addEventListener('click', () => {
  isVisualizerActive = !isVisualizerActive;
  btnToggleVisualizer.classList.toggle('active', isVisualizerActive);
  visualizerCanvas.classList.toggle('hidden', !isVisualizerActive);
});

// Toggle Mute
btnToggleMute.addEventListener('click', () => {
  isMuted = !isMuted;
  voiceManager.setMute(isMuted);
  btnToggleMute.classList.toggle('active', isMuted);
  iconVolumeOn.style.display = isMuted ? 'none' : 'block';
  iconVolumeOff.style.display = isMuted ? 'block' : 'none';
});

// Language Toggle (English / Hindi)
let currentLang = 'en';
if (btnToggleLang) {
  btnToggleLang.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    const langCode = currentLang === 'hi' ? 'hi-IN' : 'en-US';
    voiceManager.setLanguage(langCode);
    const span = btnToggleLang.querySelector('span');
    if (span) span.textContent = currentLang.toUpperCase();
    btnToggleLang.title = currentLang === 'hi' ? 'Language: Hindi / Hinglish (Click for English)' : 'Language: English (Click for Hindi)';
  });
}

// Clear Chat History
btnClearChat.addEventListener('click', () => {
  transcriptBody.innerHTML = `
    <div class="message-item orb-msg">
      <span class="msg-sender">NEXUS Core</span>
      <div class="msg-bubble">
        <p>Memory stream refreshed. Ready for commands.</p>
      </div>
    </div>
  `;
});

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  // Space bar toggles mic when not inside an active text input
  if (e.code === 'Space' && document.activeElement !== userInput) {
    e.preventDefault();
    voiceManager.toggleListening();
  }
  // Escape stops speech synthesis or listening
  if (e.key === 'Escape') {
    voiceManager.stopListening();
    voiceManager.stopSpeaking();
  }
});
