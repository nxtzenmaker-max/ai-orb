# NEXUS // 3D Interactive AI Orb

A photorealistic, audio-reactive 3D AI Orb web application inspired by Gemini Live, Siri, and sci-fi AI cores. Built with Three.js, custom GLSL noise displacement shaders, Web Audio API, and the Web Speech API.

![NEXUS Core Preview](/favicon.svg)

---

## ✨ Features

- **Mesmerizing 3D AI Orb**:
  - High-polygon icosahedron mesh dynamically deformed via 3D Simplex noise and multi-octave fractal Brownian motion (fBm) running entirely on the GPU.
  - Multi-layered visual depth: Outer atmospheric corona/aura, iridescent surface shell, and a deep pulsating additive plasma core.
  - State-responsive visual profiles (`Idle`, `Listening`, `Thinking`, `Speaking`) with smooth organic color and frequency transitions.
  - Outer particle aura of 1,400+ motes orbiting in a 3D vortex field.
  - Full 3D interactivity: Click & drag to rotate the orb freely, mouse parallax orientation, and touch-screen support.
- **Audio-Reactive Dynamics**:
  - Real-time Web Audio API (`AudioContext` and `AnalyserNode`) analyzing bass, mid, and treble frequencies to drive vertex displacement ripples and chromatic iridescence.
  - Circular waveform visualizer ring overlay surrounding the orb.
  - Procedural synthetic modulation fallback so the orb pulses dynamically even if mic permissions are unavailable.
- **Minimalist Dark Luxury UI ("No Extra Sajawat")**:
  - Deep black/graphite background (`#08080a`) with subtle glassmorphic controls (`backdrop-filter: blur(24px)`).
  - Status pill indicator with pulsing neon dots: `[ • IDLE ]`, `[ • LISTENING ]`, `[ • THINKING ]`, `[ • SPEAKING ]`.
  - Sleek circular mic button with expanding soundwave rings.
  - Minimizable floating transcript card with typewriter streaming effect and syntax code highlighting.
  - Sound mute toggle, visualizer toggle, and quick prompt chips.
- **Zero API Key Required ("No Key Req")**:
  - **Speech-to-Text**: Built-in browser `SpeechRecognition` / `webkitSpeechRecognition`.
  - **Text-to-Speech**: Built-in `speechSynthesis` with natural voice selection.
  - **Instant Conversational AI Engine**: Local knowledge base answering questions on physics, machine learning, Three.js shaders, algorithms, code generation, and science—works 100% offline out-of-the-box!
- **Cloudflare Deployment Ready**:
  - Configured for Cloudflare Pages with `wrangler.toml` and `pages_build_output_dir = "dist"`.
  - Production `_headers` file for caching and HTTP security.

---

## 🚀 Quick Start

### 1. Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build
```bash
npm run build
```
Generates optimized static assets in `dist/`.

### 3. Deploy to Cloudflare Pages
Deploy using Wrangler CLI or connect the repository to Cloudflare Pages:
```bash
npx wrangler pages deploy dist
```
Or with `wrangler.toml`:
```bash
npx wrangler pages deploy
```

---

## ⌨️ Keyboard Shortcuts
- <kbd>Space</kbd>: Toggle microphone (when not typing in the text input).
- <kbd>Enter</kbd>: Send prompt.
- <kbd>Escape</kbd>: Stop listening / silence speech synthesis.

---

## 📂 Project Structure

```
ai-orb/
├── public/
│   ├── _headers         # Cloudflare Pages security & caching headers
│   └── favicon.svg      # Vector glowing orb favicon
├── src/
│   ├── ai.js            # Zero-key offline conversational intelligence engine
│   ├── main.js          # App orchestrator, UI interactions & waveform ring
│   ├── orb.js           # Three.js 3D Orb, core, halo & particle system
│   ├── shaders.js       # Custom GLSL Simplex/fBm vertex & fragment shaders
│   ├── style.css        # Minimalist dark luxury glassmorphism UI
│   └── voice.js         # Web Speech API & Web Audio API analyzer
├── index.html           # Main application entry point
├── package.json         # Scripts and dependencies
├── vite.config.js       # Vite build configuration
└── wrangler.toml        # Cloudflare Pages configuration
```
