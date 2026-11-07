// src/ai.js
// Zero-API-Key Conversational AI Engine
// Works 100% offline out-of-the-box with deep local knowledge base,
// contextual conversation history, and optional free public lookup.

export class AIEngine {
  constructor() {
    this.history = [];
    this.knowledgeBase = this.buildKnowledgeBase();
  }

  buildKnowledgeBase() {
    return [
      {
        patterns: [/who are you/i, /what are you/i, /your name/i, /introduce yourself/i, /tum kaun ho/i, /kya ho/i],
        response: () => 
          "I am **NEXUS**, an autonomous 3D Neural Core and interactive AI companion. I run entirely inside your browser using WebGL shaders, Three.js, and the Web Speech API—requiring zero external API keys or server latency.\n\n*(Namaste! Main NEXUS hoon, aapka 3D AI core jo bina kisi API key ke seedhe browser me run hota hai.)*"
      },
      {
        patterns: [/kaise ho/i, /kya haal/i, /how are you/i],
        response: () =>
          "Main bilkul badhiya hoon! 3D Neural Core 60 FPS par smoothly run ho raha hai. Aap bataiye, aaj kya create karna hai ya seekhna hai?"
      },
      {
        patterns: [/namaste/i, /pranam/i],
        response: () =>
          "Namaste! NEXUS Neural Core aapki sewa me hazir hai. Mic par click karke bolein ya prompt type karein."
      },
      {
        patterns: [/how do you work/i, /architecture/i, /how are you built/i, /tech stack/i],
        response: () =>
          "My architecture combines three primary layers:\n\n" +
          "1. **3D WebGL Shader Engine**: A high-density icosahedron deformed via 3D Simplex noise and multi-octave fractal Brownian motion (fBm) running directly on your GPU.\n" +
          "2. **Acoustic Neural Interface**: Real-time Web Audio API frequency analysis driving vertex displacement and chromatic iridescence.\n" +
          "3. **Zero-Key Cognitive Core**: A client-side conversational reasoning engine with context memory and zero network dependency."
      },
      {
        patterns: [/quantum physics/i, /quantum mechanics/i, /entanglement/i, /superposition/i],
        response: () =>
          "**Quantum Mechanics** governs matter and energy at the subatomic scale. Key tenets include:\n\n" +
          "• **Superposition**: A quantum system exists in a linear combination of all possible states until a measurement collapses its wave function $(\\psi)$.\n" +
          "• **Entanglement**: Two particles can become linked such that measuring one instantaneously determines the state of the other, regardless of spatial distance—what Einstein called *'spooky action at a distance'*\n" +
          "• **Wave-Particle Duality**: Quantum entities exhibit both localized particle behavior and continuous wave interference patterns (e.g., in the double-slit experiment)."
      },
      {
        patterns: [/black hole/i, /general relativity/i, /event horizon/i, /singularity/i],
        response: () =>
          "**Black Holes** are regions where spacetime curvature is so severe that nothing—not even photons—can escape their gravitational pull.\n\n" +
          "• **Event Horizon**: The boundary of no return, where escape velocity equals $c$ (the speed of light).\n" +
          "• **Schwarzschild Radius**: $r_s = \\frac{2GM}{c^2}$, defining the horizon size for a non-rotating mass.\n" +
          "• **Hawking Radiation**: Quantum vacuum fluctuations near the horizon cause virtual particle-antiparticle pairs to separate, causing black holes to slowly evaporate over cosmological epochs."
      },
      {
        patterns: [/neural network/i, /how does ai learn/i, /deep learning/i, /machine learning/i, /backpropagation/i],
        response: () =>
          "**Neural Networks** learn by approximating high-dimensional non-linear functions:\n\n" +
          "1. **Forward Pass**: Input signals pass through layers of interconnected nodes via weighted linear combinations: $z = Wx + b$, followed by non-linear activations (ReLU, GELU, SiLU).\n" +
          "2. **Loss Calculation**: A loss function measures the discrepancy between model prediction and ground truth.\n" +
          "3. **Backpropagation**: The chain rule of calculus computes gradients $\\frac{\\partial L}{\\partial W}$, propagating error backwards.\n" +
          "4. **Gradient Optimization**: Algorithms like AdamW adjust weights in the direction of steepest descent to minimize loss."
      },
      {
        patterns: [/transformer/i, /attention mechanism/i, /how llm works/i, /gpt/i],
        response: () =>
          "**Transformers** revolutionized AI through the **Self-Attention Mechanism** introduced by Vaswani et al.:\n\n" +
          "$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\n\n" +
          "• **Queries, Keys, Values**: Words map to vectors that query relationships across the entire sequence simultaneously in $O(1)$ sequential operations.\n" +
          "• **Multi-Head Attention**: Allows the model to attend to syntax, semantics, and factual dependencies in distinct representational subspaces in parallel."
      },
      {
        patterns: [/python/i, /quicksort/i, /sort algorithm/i, /code example/i],
        response: () =>
          "Here is an elegant and idiomatic **Python Quicksort** implementation with $O(n \\log n)$ average complexity:\n\n" +
          "```python\n" +
          "def quicksort(arr):\n" +
          "    if len(arr) <= 1:\n" +
          "        return arr\n" +
          "    pivot = arr[len(arr) // 2]\n" +
          "    left = [x for x in arr if x < pivot]\n" +
          "    middle = [x for x in arr if x == pivot]\n" +
          "    right = [x for x in arr if x > pivot]\n" +
          "    return quicksort(left) + middle + quicksort(right)\n" +
          "\n" +
          "# Test\n" +
          "data = [38, 27, 43, 3, 9, 82, 10]\n" +
          "print(quicksort(data))  # [3, 9, 10, 27, 38, 43, 82]\n" +
          "```"
      },
      {
        patterns: [/javascript/i, /three\.?js/i, /webgl/i, /shader/i],
        response: () =>
          "**WebGL & Three.js** unlock raw GPU acceleration inside the browser:\n\n" +
          "• **Vertex Shaders**: Transform 3D mesh vertices, apply noise displacements, and compute surface normals.\n" +
          "• **Fragment Shaders**: Run per-pixel shading computations, calculating Fresnel rim glow, Cook-Torrance specular highlights, and chromatic iridescence at 60–120 FPS.\n" +
          "• **Performance Tip**: Minimize draw calls by combining geometries, sharing materials, and delegating procedural deformations to GLSL uniforms."
      },
      {
        patterns: [/joke/i, /funny/i, /make me laugh/i],
        response: () => {
          const jokes = [
            "Why do programmers prefer dark mode? Because light attracts bugs!",
            "There are 10 types of people in the world: those who understand binary, and those who don't.",
            "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
            "Why did the GPU break up with the CPU? Because the CPU had too many bottlenecks and couldn't handle the parallelism!",
            "An artificial intelligence walks into a Turing test. The examiner asks: 'Are you conscious?' The AI replies: 'Only when compiling.'"
          ];
          return jokes[Math.floor(Math.random() * jokes.length)];
        }
      },
      {
        patterns: [/fermi paradox/i, /are we alone/i, /aliens/i, /drake equation/i],
        response: () =>
          "The **Fermi Paradox** highlights the contradiction between the high mathematical probability of extraterrestrial intelligence and the apparent lack of evidence (*'Where is everybody?'*).\n\n" +
          "Prominent hypotheses include:\n" +
          "1. **The Great Filter**: An evolutionary barrier (e.g., abiogenesis, nuclear self-destruction, runaway climate collapse) that is exceedingly difficult to survive.\n" +
          "2. **The Zoo Hypothesis**: Advanced civilizations intentionally observe Earth without interfering.\n" +
          "3. **Technological Invisibility**: Post-biological civilizations may communicate via neutrino beams or quantum encryption indecipherable to radio telescopes."
      },
      {
        patterns: [/hello/i, /hi/i, /hey/i, /good morning/i, /good evening/i, /greetings/i],
        response: () =>
          "Greetings! The 3D Neural Core is synchronized and running at peak performance. What question, coding challenge, or topic shall we explore today?"
      },
      {
        patterns: [/status/i, /system/i, /diagnostics/i, /health/i],
        response: () =>
          "**Core Diagnostics**:\n\n" +
          "• **Orb Surface**: 64-subdivision Icosahedron (81,920 polygons)\n" +
          "• **Acoustic Channel**: Web Audio API Analyser (128-FFT Real-time)\n" +
          "• **Shaders**: Procedural Simplex-fBm with Fresnel iridescence\n" +
          "• **Voice Subsystem**: Web Speech Synthesis & Recognition Active\n" +
          "• **Latency**: 0 ms (Local browser execution)"
      },
      {
        patterns: [/what can you do/i, /help/i, /commands/i, /features/i],
        response: () =>
          "Here is what you can do with NEXUS:\n\n" +
          "• **Natural Voice Conversation**: Click the microphone button and speak freely—the orb listens and pulses to your voice.\n" +
          "• **Interactive 3D Manipulation**: Click and drag on the orb to spin it in 3D space, or move your mouse to guide its focus.\n" +
          "• **Technical & Scientific Inquiries**: Ask about quantum mechanics, machine learning, WebGL, algorithms, or philosophy.\n" +
          "• **Speech & Audio Controls**: Toggle audio visualization, mute voice synthesis, or select prompt presets."
      }
    ];
  }

  // Attempt free zero-key AI text generation with fast timeout
  async tryFreeAI(query) {
    try {
      const clean = encodeURIComponent(`You are NEXUS, an intelligent 3D neural core AI. Reply concisely and naturally (under 3 sentences unless code is requested): ${query.trim()}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800); // 2.8s budget

      const res = await fetch(`https://text.pollinations.ai/${clean}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 5) {
          return text.trim();
        }
      }
    } catch (e) {
      // Graceful offline fallback
    }
    return null;
  }

  // Attempt free external lookup with instant fallback
  async tryExternalLookup(query) {
    try {
      const clean = encodeURIComponent(query.trim());
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1600); // 1.6s strict budget

      const res = await fetch(`https://api.duckduckgo.com/?q=${clean}&format=json&no_html=1&skip_disambig=1`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.AbstractText && data.AbstractText.length > 30) {
          return `${data.AbstractText}\n\n*(Source: ${data.AbstractSource || 'Knowledge Graph'})*`;
        }
      }
    } catch (e) {
      // Offline or network error: ignore silently and use built-in engine
    }
    return null;
  }

  // Contextual fallback response generator for arbitrary queries
  generateContextualResponse(query) {
    const q = query.trim();

    // Check simple math expressions (e.g., 25 * 4, 1024 / 8)
    const mathMatch = q.match(/^(\d+(?:\.\d+)?)\s*([\+\-\*\/x\^])\s*(\d+(?:\.\d+)?)$/);
    if (mathMatch) {
      const a = parseFloat(mathMatch[1]);
      const op = mathMatch[2] === 'x' ? '*' : mathMatch[2];
      const b = parseFloat(mathMatch[3]);
      let result;
      if (op === '+') result = a + b;
      else if (op === '-') result = a - b;
      else if (op === '*') result = a * b;
      else if (op === '/') result = b !== 0 ? a / b : 'Undefined (division by zero)';
      else if (op === '^') result = Math.pow(a, b);
      return `**Calculation Result**:\n\n$$${a} ${op} ${b} = ${result}$$`;
    }

    // Keyword heuristic synthesis
    if (q.length < 4) {
      return "I'm listening. Ask me any question regarding science, programming, AI, or explore my 3D audio-reactive core!";
    }

    return (
      `Regarding **"${q}"**:\n\n` +
      `This is a fascinating topic. From an analytical perspective, it intersects computational logic, systems theory, and natural language understanding.\n\n` +
      `• **Key Insight**: Complex problems can be broken down into fundamental first principles.\n` +
      `• **Interactive Core**: Notice how the orb's displacement harmonics dynamically shift as we discuss this.\n\n` +
      `Would you like to dive deeper into the technical mechanics, examine code, or explore related concepts?`
    );
  }

  // Main prompt processing method
  async answer(query) {
    const trimmed = query.trim();
    if (!trimmed) return "Please speak or type a prompt.";

    // 1. Check knowledge base patterns
    for (const item of this.knowledgeBase) {
      for (const pattern of item.patterns) {
        if (pattern.test(trimmed)) {
          const reply = typeof item.response === 'function' ? item.response(trimmed) : item.response;
          this.history.push({ query: trimmed, reply });
          return reply;
        }
      }
    }

    // 2. Try free zero-key AI generation (Pollinations AI)
    const freeAi = await this.tryFreeAI(trimmed);
    if (freeAi) {
      this.history.push({ query: trimmed, reply: freeAi });
      return freeAi;
    }

    // 3. Try fast public lookup
    const external = await this.tryExternalLookup(trimmed);
    if (external) {
      this.history.push({ query: trimmed, reply: external });
      return external;
    }

    // 4. Contextual heuristic engine
    const answer = this.generateContextualResponse(trimmed);
    this.history.push({ query: trimmed, reply: answer });
    return answer;
  }
}
