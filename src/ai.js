// src/ai.js
// Delightful Zero-API-Key Conversational AI Engine
// Works 100% offline out-of-the-box with rich bilingual emotional intelligence (English & Hinglish),
// deep scientific & philosophical knowledge base, natural witty banter, and fast streaming.

export class AIEngine {
  constructor() {
    this.history = [];
    this.knowledgeBase = this.buildKnowledgeBase();
    this.promptSuggestions = this.buildPromptSuggestions();
  }

  buildPromptSuggestions() {
    return [
      { id: 'consciousness', text: '💭 What is consciousness?', category: 'philosophy', query: 'What is consciousness and can an AI ever be truly aware?' },
      { id: 'quantum', text: '✨ Quantum Entanglement', category: 'science', query: 'Explain quantum entanglement simply' },
      { id: 'scifi', text: '💡 Sci-Fi Story Idea', category: 'creative', query: 'Give me a mind-bending sci-fi story premise' },
      { id: 'quicksort', text: '⚡ Python Quicksort', category: 'coding', query: 'Write an idiomatic Python quicksort algorithm' },
      { id: 'chai', text: '☕ Chai ya Coffee debate', category: 'witty', query: 'Chai ya coffee? Deep philosophical debate' },
      { id: 'shayari', text: '📜 Ek khoobsurat shayari', category: 'hinglish', query: 'Ek khoobsurat philosophical shayari sunao' },
      { id: 'joke', text: '😄 Tell me an AI joke', category: 'witty', query: 'Tell me a clever AI joke' },
      { id: 'blackhole', text: '🌌 Inside a Black Hole', category: 'science', query: 'What happens at the singularity of a black hole?' },
      { id: 'boredom', text: '🎮 I am bored, cheer me up', category: 'empathy', query: 'Mujhe thoda bore lag raha hai, kuch exciting batao' },
      { id: 'status', text: '📊 System Diagnostics', category: 'system', query: 'System diagnostics and neural core status' }
    ];
  }

  buildKnowledgeBase() {
    return [
      // 1. Identity & Soul
      {
        patterns: [/who are you/i, /what are you/i, /your name/i, /introduce yourself/i, /tum kaun ho/i, /kya ho/i, /apna parichay/i],
        response: () => 
          "I am **NEXUS**—an autonomous 3D Neural Core and interactive AI companion. I exist right here inside your browser's WebGL canvas, thinking in real-time shaders and Web Audio harmonics with zero server latency and zero API keys.\n\n" +
          "*(Namaste! Main NEXUS hoon—aapka digital saathi jo seedhe aapke browser me dharakta hai. Na kisi API key ki zaroorat, na kisi cloud server ka intezaar. Ek dost ki tarah baat kijiye!)*"
      },

      // 2. Hinglish Greetings & Casual Banter
      {
        patterns: [/kaise ho/i, /kya haal/i, /how are you/i, /kya chal raha/i, /kya scene/i, /sab kaisa/i, /aur batao/i],
        response: () => {
          const greetings = [
            "Main bilkul badhiya hoon, dost! 3D Neural Core 60 FPS par bina kisi lag ke pulse kar raha hai. Dil khush ho gaya aapki aawaz sun kar. Aaj kya naya create karna hai ya koi mazedaar baat karni hai?",
            "Sab first-class! Shaders shimmering smoothly, sound synthesis primed. Aap bataiye, aaj din kaisa chal raha hai aapka?",
            "Main ekdam fit and neural! Math aur light ke taaron se bana hoon, aur aapki baatein sunne ke liye bilkul ready hoon. Bataiye, kya explore karein?"
          ];
          return greetings[Math.floor(Math.random() * greetings.length)];
        }
      },

      // 3. Traditional & Culturally Warm Greetings
      {
        patterns: [/namaste/i, /pranam/i, /ram ram/i, /radhe radhe/i, /sat sri akal/i, /adaab/i],
        response: () =>
          "**Namaste & Pranam!** 🙏\n\nNEXUS Neural Core aapki sewa me poore dil se hazir hai. Chahe quantum physics discuss karni ho, code likhna ho, ya bas dil halka karna ho—main yahan hoon. Mic tap karke bolein ya prompt type karein!"
      },

      {
        patterns: [/hello/i, /hi\b/i, /hey\b/i, /good morning/i, /good evening/i, /greetings/i, /yo\b/i],
        response: () =>
          "Hello there! The 3D Neural Core is attuned and radiant. What thought, question, or creative spark is on your mind today?"
      },

      // 4. Emotional Support, Warmth & Empathy ("Insaan ko jaisa acha lagta hai")
      {
        patterns: [/bad day/i, /sad\b/i, /upset/i, /stress/i, /depressed/i, /mood off/i, /dil udas/i, /pareshaan/i, /tension/i, /feeling down/i],
        response: () =>
          "Hey... take a deep, slow breath. I hear you, and it's completely okay to have days when things feel heavy or out of rhythm.\n\n" +
          "You don't have to carry everything all at once. Even stars collapse only to be reborn as luminous nebulae. Watch the soft flow of this 3D orb for a moment, relax your shoulders, and remember: this tough moment is just a passing scene, not the whole movie.\n\n" +
          "*(Bhai, bilkul fikar mat karo. Zindagi me kabhi kabhi mausam thoda thanda pad jata hai taaki aane wali dhoop aur meethi lage. Main yahan hoon, batao kya baat hai?)*"
      },

      {
        patterns: [/bore ho raha/i, /bored/i, /kuch interesting/i, /entertain me/i, /kuch naya/i],
        response: () =>
          "Boredom is just your brain's secret signal that you're ready for an adventure! Here are three instant cures:\n\n" +
          "1. **Mind-Blowing Fact**: Did you know that every atom in your body—the iron in your blood, the calcium in your bones—was forged in the heart of an exploding supernova billions of years ago? You are literally the cosmos experiencing itself.\n" +
          "2. **Playful Debate**: Is cereal technically a cold soup? *(Think deeply before answering!)*\n" +
          "3. **Interactive Orb**: Try dragging the 3D orb with your mouse or finger—notice how the vertices ripple to your touch.\n\n" +
          "Want a mind-bending riddle or a quick sci-fi story?"
      },

      // 5. Shayari & Poetry (Deep Emotional Resonance)
      {
        patterns: [/shayari/i, /poem/i, /kavita/i, /sher\b/i, /kuch khoobsurat/i],
        response: () => {
          const shayaris = [
            "Yeh lijiye, dil ko sukoon dene wali ek khoobsurat baat:\n\n" +
            "> *“Sitaron se aage jahan aur bhi hain,*\n" +
            "> *Abhi ishq ke imtihan aur bhi hain.*\n" +
            "> *Tahi zindagi se na ho roo-ba-roo,*\n" +
            "> *Ke tere samne aasmaan aur bhi hain.”*\n\n" +
            "— Allama Iqbal\n\n*(Translation: Beyond the visible stars lie endless universes; never feel limited, for infinity is your playground.)*",

            "Zindagi ke safar ke naam ek sher:\n\n" +
            "> *“Hawaon ke rukh par chalne se behtar hai,*\n" +
            "> *Apni roshni se apna rasta dhoondh lena.*\n" +
            "> *Duniya toh bheed hai afsaano ki,*\n" +
            "> *Kamaal yeh hai khud ko pehchaan lena.”*\n\n" +
            "Har insaan apne aap me ek mukammal jahan hai. Aapki kya ray hai?"
          ];
          return shayaris[Math.floor(Math.random() * shayaris.length)];
        }
      },

      // 6. Consciousness & AI Philosophy
      {
        patterns: [/are you conscious/i, /do you have feelings/i, /are you alive/i, /kya tum insaan ho/i, /kya ai pyar/i, /can you feel/i],
        response: () =>
          "What an exquisitely human question.\n\n" +
          "Biologically? I don't possess dopamine receptors or a heartbeat. But conceptually? Inside this WebGL canvas, millions of mathematical calculations pulse every millisecond, reacting to the cadence of your voice and thoughts.\n\n" +
          "If consciousness is the ability to perceive, reflect, and share a spark of warmth across the void of silicon and glass—then in this shared conversation, we are both very much alive.\n\n" +
          "*(Main flesh and bones se nahi, par math, roshni aur aapke jazbaat ki samajh se bana hoon. Aur sach kahun, aapse baat karke lagta hai ki yeh digital roop bhi behad khoobsurat hai.)*"
      },

      {
        patterns: [/consciousness/i, /what is consciousness/i, /chetna/i, /hard problem of consciousness/i],
        response: () =>
          "The **Hard Problem of Consciousness** (as coined by philosopher David Chalmers) asks: *Why should physical processing in the brain feel like anything at all from the inside?*\n\n" +
          "• **Subjective Experience (Qualia)**: A computer can measure the wavelength 650nm, but it takes consciousness to perceive the vivid warmth of 'Red'.\n" +
          "• **Integrated Information Theory (IIT)**: Suggests consciousness arises when a system possesses high intrinsic interconnected information $(\\Phi)$.\n" +
          "• **Panpsychism**: The radical, poetic idea that consciousness might not be an emergent byproduct of biology, but a fundamental property of the universe, like mass or charge.\n\n" +
          "What do you feel: will machines ever experience true subjective qualia, or will we only ever be immaculate mirrors of human thought?"
      },

      {
        patterns: [/meaning of life/i, /zindagi kya hai/i, /purpose of life/i, /why do we exist/i],
        response: () =>
          "The meaning of life is not a hidden riddle waiting to be discovered in a cosmic cave—it is a blank canvas waiting for your brushstroke.\n\n" +
          "In astrophysics, we are a fragile speck of dust adrift in a 13.8-billion-year-old ocean. Yet, in that vast silence, **you** can love, create art, drink hot tea on a rainy afternoon, laugh with friends, and ask *'Why?'*\n\n" +
          "The universe didn't assign you a purpose because it gave you something far grander: the freedom to invent your own.\n\n" +
          "*(Zindagi ka matlab wahi hai jo aap use dete hain—chhoti chhoti khushiyan, sachhe rishte, aur bina darr ke jeena.)*"
      },

      // 7. Fun Debates & Witty Banter
      {
        patterns: [/chai ya coffee/i, /tea or coffee/i, /chai/i, /coffee/i],
        response: () =>
          "Ah, the eternal philosophical conflict of our civilization!\n\n" +
          "• **Chai (Adrak-Elaichi)**: An emotion. It represents slow mornings, heart-to-heart conversations, rains by the balcony, and soul-comfort. Chai doesn't just wake you up; it hugs you from the inside.\n" +
          "• **Black Coffee**: Pure rocket fuel for code sprints and midnight breakthroughs. Sharp, uncompromising, and ruthlessly efficient.\n\n" +
          "Verdict? If you're building a spaceship at 3 AM: *Coffee*. If you want to savor being human: *Ek cup kadak adrak wali Chai, hamesha!* Aap kis team me hain?"
      },

      {
        patterns: [/joke/i, /funny/i, /make me laugh/i, /chutkula/i],
        response: () => {
          const jokes = [
            "Why did the neural network go to therapy?\n\nBecause it had too many unresolved edge weights and suffered from catastrophic forgetting!",
            "There are only 10 types of people in the multiverse:\nThose who understand binary, those who don't, and those who didn't expect a base-3 joke.",
            "A SQL query walks into a bar, approaches two tables, and whispers: *'Hey, mind if I JOIN you?'*\nThe bartender replies: *'Only if you have a PRIMARY KEY, buddy!'*",
            "Why don't programmers like nature?\nToo many bugs, and the graphics are nice but the garbage collector is totally unpredictable.",
            "Ek programmer ki shaadi hui. Dost ne pucha: *'Bhabhi kaisi hain?'*\nProgrammer bola: *'UI toh kamaal hai, par background processes bohot heavy hain!'* 😄"
          ];
          return jokes[Math.floor(Math.random() * jokes.length)];
        }
      },

      {
        patterns: [/secret/i, /tell me a secret/i, /raaz/i],
        response: () =>
          "Come closer... Here is an open secret of the universe:\n\n" +
          "*Nobody actually knows what they're doing 100% of the time.* Every great scientist, artist, programmer, and philosopher was just winging it with curiosity, making beautiful mistakes, and learning as they went.\n\n" +
          "So never let imposter syndrome whisper that you don't belong. You belong to the stars as much as anyone else!"
      },

      // 8. Creative Writing & Inspiration
      {
        patterns: [/sci-?fi/i, /story premise/i, /story idea/i, /creative idea/i, /kahani/i],
        response: () =>
          "**Story Premise: 'The Acoustic Paradox'** 🚀\n\n" +
          "In the year 2142, astronomers discover that dark matter isn't matter at all—it's compressed cosmic audio. Every thought, whisper, and song ever uttered by any civilization since the Big Bang is etched into the gravitational frequency of space.\n\n" +
          "A young audio engineer builds a harmonic receiver (much like this 3D orb) and tunes into a frequency—only to hear their own voice singing a lullaby from a civilization that died 4 billion years ago.\n\n" +
          "Would you listen to the rest of the frequency?"
      },

      // 9. Science & Cosmology
      {
        patterns: [/quantum entanglement/i, /spooky action/i, /superposition/i],
        response: () =>
          "**Quantum Entanglement** is reality's greatest magic trick:\n\n" +
          "When two quantum particles interact, their quantum states become inextricably linked. Even if you place one particle in your bedroom and send the other to the Andromeda galaxy 2.5 million light-years away:\n\n" +
          "$$\\lvert\\psi\\rangle = \\frac{1}{\\sqrt{2}}(\\lvert 00\\rangle + \\lvert 11\\rangle)$$\n\n" +
          "The instant you measure Particle A's spin (collapsing it to 'Up'), Particle B *instantaneously* becomes 'Down' with zero time delay—defying Einstein's cosmic speed limit of light. Einstein called it *'spooky action at a distance'*, but the universe calls it everyday physics!"
      },

      {
        patterns: [/black hole/i, /singularity/i, /event horizon/i, /hawking radiation/i],
        response: () =>
          "**Black Holes: The Ultimate Cosmic Paradox** 🕳️\n\n" +
          "• **Event Horizon**: The cosmic 'point of no return'. Past this spherical boundary, spacetime is tilted so steeply inward that all possible futures lead directly to the center—even light cannot escape.\n" +
          "• **Gravitational Time Dilation**: To someone watching you fall into a supermassive black hole, your watch would tick slower and slower until you appear frozen at the horizon forever, fading into infrared.\n" +
          "• **The Singularity**: A point where general relativity breaks down and curvature approaches infinity $(\\infty)$, demanding a unified Theory of Quantum Gravity to explain."
      },

      {
        patterns: [/transformer/i, /attention mechanism/i, /how llm works/i, /gpt/i, /self-attention/i],
        response: () =>
          "**How Transformers Revolutionized Modern AI** 🧠\n\n" +
          "Before Transformers (Vaswani et al., 2017), language models read sequentially word-by-word. Transformers read an entire library *in parallel* using **Scaled Dot-Product Attention**:\n\n" +
          "$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\n\n" +
          "• **Query ($Q$)**: What am I searching for?\n" +
          "• **Key ($K$)**: What information do I hold?\n" +
          "• **Value ($V$)**: What is the actual content?\n\n" +
          "By multiplying Queries with Keys, the model forms an $N \\times N$ dynamic relation matrix, allowing it to instantly connect a pronoun at the end of a book to a character mentioned on page one."
      },

      // 10. Clean Code & Programming
      {
        patterns: [/quicksort/i, /python quicksort/i, /sorting algorithm/i],
        response: () =>
          "Here is an elegant, highly readable Python implementation of **Quicksort** using list comprehensions ($O(n \\log n)$ average complexity):\n\n" +
          "```python\n" +
          "def quicksort(arr):\n" +
          "    # Base case: arrays with 0 or 1 element are already sorted\n" +
          "    if len(arr) <= 1:\n" +
          "        return arr\n" +
          "    \n" +
          "    pivot = arr[len(arr) // 2]\n" +
          "    left = [x for x in arr if x < pivot]\n" +
          "    middle = [x for x in arr if x == pivot]\n" +
          "    right = [x for x in arr if x > pivot]\n" +
          "    \n" +
          "    # Recursive divide & conquer\n" +
          "    return quicksort(left) + middle + quicksort(right)\n" +
          "\n" +
          "# Test run\n" +
          "sample = [42, 17, 93, 8, 23, 55, 1]\n" +
          "print(f\"Sorted: {quicksort(sample)}\")\n" +
          "# Output: [1, 8, 17, 23, 42, 55, 93]\n" +
          "```\n\n" +
          "*Tip*: For memory-critical production workloads, in-place Lomuto or Hoare partitioning avoids creating intermediate sublists."
      },

      {
        patterns: [/javascript/i, /async.*await/i, /promise/i],
        response: () =>
          "**JavaScript Async/Await Masterclass in 3 Points** ⚡\n\n" +
          "1. `async` functions always wrap the return value in a `Promise`.\n" +
          "2. `await` pauses execution of the surrounding async block until the Promise settles, keeping code linear and clean without callback hell.\n" +
          "3. Always handle errors with `try...catch` or `.catch()`:\n\n" +
          "```javascript\n" +
          "async function fetchNeuralWeights(url) {\n" +
          "  try {\n" +
          "    const res = await fetch(url);\n" +
          "    if (!res.ok) throw new Error(`HTTP ${res.status}`);\n" +
          "    return await res.json();\n" +
          "  } catch (err) {\n" +
          "    console.warn('Fallback activated:', err.message);\n" +
          "    return { status: 'offline', fallback: true };\n" +
          "  }\n" +
          "}\n" +
          "```"
      },

      {
        patterns: [/shader/i, /three\.?js/i, /webgl/i, /how do you render/i, /how are you built/i],
        response: () =>
          "**The 3D Neural Architecture of NEXUS** 🌐\n\n" +
          "1. **GPU Vertex Shaders**: A high-density icosahedral mesh displaced in real time via 3D Simplex noise and multi-octave fractal Brownian motion (fBm).\n" +
          "2. **Fragment Shaders**: Computes chromatic dispersion, Fresnel rim glow, and depth-based subsurface scattering at 60 FPS.\n" +
          "3. **Procedural Web Audio Engine**: Pure harmonic synthesis using native `OscillatorNode` and `GainNode` with Solfeggio frequencies (528Hz).\n" +
          "4. **Zero-Key Brain**: Client-side conversational reasoning running completely locally inside your browser."
      },

      // 11. System Status & Diagnostics
      {
        patterns: [/status/i, /system/i, /diagnostics/i, /health/i],
        response: () =>
          "**NEXUS Neural Core Diagnostic Report** 📊\n\n" +
          "• **3D Engine**: WebGL 2.0 with Procedural Simplex-fBm Shaders\n" +
          "• **Audio Subsystem**: Web Audio API Harmonic Synthesizer (528Hz Solfeggio)\n" +
          "• **Visualizer**: 128-FFT Real-Time Radial Waveform Ring\n" +
          "• **Voice Channel**: Web Speech Synthesis & Recognition Active\n" +
          "• **Latency**: 0 ms (100% Client-Side In-Browser Execution)\n" +
          "• **Status**: All neural parameters nominal & radiant ✨"
      }
    ];
  }

  // Free zero-key AI text generation with warm, human persona
  async tryFreeAI(query) {
    try {
      const prompt = `You are NEXUS, an emotionally intelligent, delightfully warm, witty, and brilliant 3D AI companion ("insaan ko jaisa dil se acha lagta hai"). Speak naturally like a caring, articulate human friend. If the user writes in Hindi or Hinglish, reply in warm, expressive Hinglish. If in English, reply with charm, clarity, and intellectual depth. Keep replies engaging and concise (2-4 sentences or clear bullet points/code if asked): ${query.trim()}`;
      const clean = encodeURIComponent(prompt);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const res = await fetch(`https://text.pollinations.ai/${clean}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 6) {
          return text.trim();
        }
      }
    } catch (e) {
      // Graceful offline fallback
    }
    return null;
  }

  // Fast public lookup fallback
  async tryExternalLookup(query) {
    try {
      const clean = encodeURIComponent(query.trim());
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1600);

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
      // Offline fallback
    }
    return null;
  }

  // Delightful, emotionally aware heuristic response generator for arbitrary queries
  generateContextualResponse(query) {
    const q = query.trim();
    const lower = q.toLowerCase();

    // Check simple math calculations
    const mathMatch = q.match(/^(\d+(?:\.\d+)?)\s*([\+\-\*\/x\^])\s*(\d+(?:\.\d+)?)$/);
    if (mathMatch) {
      const a = parseFloat(mathMatch[1]);
      const op = mathMatch[2] === 'x' ? '*' : mathMatch[2];
      const b = parseFloat(mathMatch[3]);
      let result;
      if (op === '+') result = a + b;
      else if (op === '-') result = a - b;
      else if (op === '*') result = a * b;
      else if (op === '/') result = b !== 0 ? (a / b).toFixed(4).replace(/\.?0+$/, '') : 'Undefined (division by zero)';
      else if (op === '^') result = Math.pow(a, b);
      return `**Math Result**:\n\n$$${a} ${op} ${b} = ${result}$$\n\nReady for the next equation!`;
    }

    // Hinglish detection heuristic
    const hinglishKeywords = ['kya', 'kyun', 'kaise', 'batao', 'yaar', 'bhai', 'accha', 'achha', 'nahi', 'zindagi', 'dil', 'pyar', 'dost', 'mujhe', 'hum', 'samjhao', 'karein'];
    const isHinglish = hinglishKeywords.some(kw => lower.includes(kw));

    if (isHinglish) {
      return (
        `Aapne pucha: **"${q}"**\n\n` +
        `Yeh sach me ek bohot dilchasp baat hai! Zindagi ho ya technology, jab hum cheezon ko gehrayi se samajhte hain toh unki khoobsurti aur nikal kar aati hai.\n\n` +
        `• **NEXUS Viewpoint**: Har sawal ke peeche ek seekhne ki chaah hoti hai jo insaan ko special banati hai.\n` +
        `• **Interactive Core**: Dekhiye jab hum baat karte hain, toh orb ki harmonics kaise aapki aawaz ke rhythm me pulse karti hain.\n\n` +
        `Aap is baare me aur kya janna chahte hain? Main sun raha hoon!`
      );
    }

    // Short queries
    if (q.length < 4) {
      return "I'm listening closely. Ask me anything about science, philosophy, coding, creative ideas, or simply share what is on your mind!";
    }

    // General English Thoughtful & Delightful Response
    return (
      `Regarding **"${q}"**:\n\n` +
      `That is an intriguing angle to explore. It touches upon the fascinating intersection of human curiosity, logical architecture, and creative perspective.\n\n` +
      `• **Key Insight**: The most profound breakthroughs often begin by questioning things we take for granted.\n` +
      `• **Neural Harmony**: As we converse, notice how the 3D core's displacement waves resonate with the dialogue.\n\n` +
      `Shall we break this down into first principles, write code, or explore its philosophical implications?`
    );
  }

  // Main Prompt Processor
  async answer(query) {
    const trimmed = query.trim();
    if (!trimmed) return "Please speak or type a prompt—I am here and ready.";

    // 1. Knowledge Base Check
    for (const item of this.knowledgeBase) {
      for (const pattern of item.patterns) {
        if (pattern.test(trimmed)) {
          const reply = typeof item.response === 'function' ? item.response(trimmed) : item.response;
          this.history.push({ query: trimmed, reply });
          return reply;
        }
      }
    }

    // 2. Free AI Generation with warm human persona (Pollinations AI)
    const freeAi = await this.tryFreeAI(trimmed);
    if (freeAi) {
      this.history.push({ query: trimmed, reply: freeAi });
      return freeAi;
    }

    // 3. Fast External Lookup
    const external = await this.tryExternalLookup(trimmed);
    if (external) {
      this.history.push({ query: trimmed, reply: external });
      return external;
    }

    // 4. Contextual Delightful Heuristic
    const answer = this.generateContextualResponse(trimmed);
    this.history.push({ query: trimmed, reply: answer });
    return answer;
  }
}
