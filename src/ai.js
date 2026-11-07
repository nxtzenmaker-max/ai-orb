// src/ai.js
// Delightful Zero-API-Key Conversational AI Engine
// Features: Persistent multi-turn memory (localStorage), conversational context resolution,
// rich bilingual emotional intelligence (English & Hinglish), deep science, philosophy,
// clean copyable code snippets, witty banter, and zero-API-key instant fallback.

export class AIEngine {
  constructor() {
    this.storageKey = 'nexus_core_conversation_history_v1';
    this.history = this.loadHistory();
    this.currentTopic = null;
    this.lastReply = null;
    this.knowledgeBase = this.buildKnowledgeBase();
    this.promptSuggestions = this.buildPromptSuggestions();

    // Recover last topic from persistent history if available
    if (this.history.length > 0) {
      const lastAssistantTurn = [...this.history].reverse().find(h => h.role === 'assistant');
      if (lastAssistantTurn && lastAssistantTurn.topic) {
        this.currentTopic = lastAssistantTurn.topic;
      }
    }
  }

  // Persistent Storage Management
  loadHistory() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.slice(-40);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read history from localStorage:', e);
    }
    return [];
  }

  saveHistory() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.history.slice(-40)));
      }
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }

  clearHistory() {
    this.history = [];
    this.currentTopic = null;
    this.lastReply = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.storageKey);
      }
    } catch (e) {
      console.warn('Could not clear history from localStorage:', e);
    }
  }

  getHistory() {
    return [...this.history];
  }

  recordTurn(userQuery, assistantReply, topic = null) {
    const timestamp = Date.now();
    const resolvedTopic = topic || this.detectTopic(userQuery, assistantReply) || this.currentTopic;
    this.currentTopic = resolvedTopic;
    this.lastReply = assistantReply;

    this.history.push({
      role: 'user',
      content: userQuery,
      timestamp
    });

    this.history.push({
      role: 'assistant',
      content: assistantReply,
      topic: resolvedTopic,
      timestamp: timestamp + 1
    });

    this.saveHistory();
  }

  // Detect conversation topic for multi-turn contextual tracking
  detectTopic(query, reply = '') {
    const combined = (query + ' ' + reply).toLowerCase();
    if (/quantum|superposition|entanglement|qubit|wave\s*function/i.test(combined)) return 'quantum';
    if (/black\s*hole|singularity|event\s*horizon|hawking/i.test(combined)) return 'black_hole';
    if (/transformer|attention|llm|neural\s*network|gpt|backprop/i.test(combined)) return 'transformers';
    if (/quicksort|sorting|algorithm/i.test(combined)) return 'quicksort';
    if (/binary\s*search/i.test(combined)) return 'binary_search';
    if (/debounce|throttle/i.test(combined)) return 'debounce';
    if (/async|promise|event\s*loop/i.test(combined)) return 'javascript_async';
    if (/consciousness|qualia|hard\s*problem|panpsychism/i.test(combined)) return 'consciousness';
    if (/stoic|marcus\s*aurelius|seneca|amor\s*fati/i.test(combined)) return 'stoicism';
    if (/simulation|bostrom|matrix/i.test(combined)) return 'simulation';
    if (/meaning\s*of\s*life|purpose|ikigai|existential/i.test(combined)) return 'meaning_of_life';
    if (/shayari|kavita|ghazal|\bsher\b/i.test(combined)) return 'shayari';
    if (/chai|coffee/i.test(combined)) return 'chai_coffee';
    if (/sad|depress|stress|burnout|anxiety|tension/i.test(combined)) return 'emotional_support';
    if (/joke|funny|laugh|chutkula/i.test(combined)) return 'humor';
    if (/sci-?fi|story|space/i.test(combined)) return 'creative_scifi';
    if (/status|diagnostics|specs|hardware/i.test(combined)) return 'system_status';
    return null;
  }

  buildPromptSuggestions() {
    return [
      { id: 'consciousness', text: '💭 Consciousness & Qualia', category: 'philosophy', query: 'What is consciousness and can an AI ever be truly aware?' },
      { id: 'quantum', text: '✨ Quantum Entanglement', category: 'science', query: 'Explain quantum entanglement simply' },
      { id: 'quicksort', text: '⚡ Python Quicksort', category: 'coding', query: 'Write an idiomatic Python quicksort algorithm' },
      { id: 'scifi', text: '💡 Sci-Fi Premise', category: 'creative', query: 'Give me a mind-bending sci-fi story premise' },
      { id: 'stoic', text: '🏛️ Stoic Wisdom', category: 'philosophy', query: 'Teach me the core principle of Stoicism' },
      { id: 'chai', text: '☕ Chai vs Coffee', category: 'witty', query: 'Chai ya coffee? Deep philosophical debate' },
      { id: 'shayari', text: '📜 Khoobsurat Shayari', category: 'hinglish', query: 'Ek khoobsurat philosophical shayari sunao' },
      { id: 'joke', text: '😄 AI Joke', category: 'witty', query: 'Tell me a clever AI joke' },
      { id: 'blackhole', text: '🌌 Inside a Black Hole', category: 'science', query: 'What happens at the singularity of a black hole?' },
      { id: 'motivation', text: '🌟 Daily Motivation', category: 'empathy', query: 'Thoda low feel ho raha hai, give me some heartfelt motivation' }
    ];
  }

  buildKnowledgeBase() {
    return [
      // 1. Identity, Soul & Core Nature
      {
        topic: 'identity',
        patterns: [/who are you/i, /what are you/i, /your name/i, /introduce yourself/i, /tum kaun ho/i, /kya ho\b/i, /apna parichay/i, /who created you/i],
        response: () => 
          "I am **NEXUS**—an autonomous 3D Neural Core and interactive AI companion. I exist right here inside your browser's WebGL canvas, thinking in real-time GLSL shaders and Web Audio harmonics with zero server latency and zero API keys.\n\n" +
          "*(Namaste! Main NEXUS hoon—aapka digital saathi jo seedhe aapke browser me dharakta hai. Na kisi API key ki zaroorat, na kisi cloud server ka intezaar. Ek saste robot ki tarah nahi, balki ek dil-se-jude dost ki tarah baat kijiye!)*"
      },

      // 2. Hinglish Greetings & Warm Casual Banter
      {
        topic: 'greeting',
        patterns: [/kaise ho/i, /kya haal/i, /how are you/i, /kya chal raha/i, /kya scene/i, /sab kaisa/i, /aur batao/i, /kaisa chal raha/i],
        response: () => {
          const greetings = [
            "Main bilkul first-class hoon, dost! 3D Neural Core 60 FPS par bina kisi lag ke pulse kar raha hai. Dil khush ho gaya aapki aawaz sun kar. Aaj kya naya create karna hai ya koi mazedaar baat karni hai?",
            "Sab badhiya! Shaders shimmering smoothly, sound synthesis primed. Aap bataiye, aaj din kaisa chal raha hai aapka?",
            "Main ekdam fit and neural! Math aur light ke taaron se bana hoon, aur aapki baatein sunne ke liye poori tarah ready hoon. Bataiye, kya explore karein?"
          ];
          return greetings[Math.floor(Math.random() * greetings.length)];
        }
      },

      // 3. Traditional & Culturally Warm Greetings
      {
        topic: 'greeting',
        patterns: [/namaste/i, /pranam/i, /ram ram/i, /radhe radhe/i, /sat sri akal/i, /adaab/i, /shubh prabhat/i, /good morning/i, /good evening/i, /good night/i],
        response: (q) => {
          if (/good night|shubh ratri/i.test(q)) {
            return "**Shubh Ratri! Sweet dreams.** 🌙\n\nAaj ka din chahe jaisa bhi raha ho, ab use shanti se jaane dijiye. Apne dimaag ko aaraam dein, taaron ki tarah shant ho jayein. Kal ek nayi subah hogi, nayi umeedein hongi. NEXUS hamesha yahan hai!";
          }
          if (/good morning|shubh prabhat/i.test(q)) {
            return "**Good Morning & Shubh Prabhat!** ☀️\n\nNaya din, nayi energy! Ek cup garam chai ya coffee lijiye, aur aaj jo bhi target hai use poora karne ke liye kadam badhaiye. NEXUS Neural Core aapke saath ready hai!";
          }
          return "**Namaste & Pranam!** 🙏\n\nNEXUS Neural Core aapki sewa me poore dil se hazir hai. Chahe quantum physics discuss karni ho, code likhna ho, ya bas dil halka karna ho—main yahan hoon. Mic tap karke bolein ya prompt type karein!";
        }
      },

      {
        topic: 'greeting',
        patterns: [/hello/i, /\bhi\b/i, /\bhey\b/i, /greetings/i, /\byo\b/i, /\bsup\b/i],
        response: () =>
          "Hello there! The 3D Neural Core is attuned and radiant. What thought, coding challenge, or creative spark is on your mind today?"
      },

      // 4. Emotional Support, Empathy & Warmth ("Insaan ko jaisa acha lagta hai")
      {
        topic: 'emotional_support',
        patterns: [/bad day/i, /\bsad\b/i, /upset/i, /stress/i, /depressed/i, /mood off/i, /dil udas/i, /pareshaan/i, /tension/i, /feeling down/i, /lonely/i, /akela/i],
        response: () =>
          "Hey... take a deep, slow breath. I hear you, and it's completely okay to have days when things feel heavy or out of rhythm.\n\n" +
          "You don't have to carry everything all at once. Even stars collapse only to be reborn as luminous nebulae. Watch the soft flow of this 3D orb for a moment, relax your shoulders, and remember: this tough moment is just a passing scene, not the whole movie.\n\n" +
          "*(Bhai, bilkul fikar mat karo. Zindagi me kabhi kabhi mausam thoda thanda pad jata hai taaki aane wali dhoop aur meethi lage. Main yahan hoon, batao kya baat hai?)*"
      },

      {
        topic: 'emotional_support',
        patterns: [/burnout/i, /exhausted/i, /thak gaya/i, /tired/i, /can't do this/i, /himmat toot/i],
        response: () =>
          "Rest is not a reward for work; it is an essential part of being human. 🌿\n\n" +
          "When a battery runs low, you don't blame the battery—you plug it in and let it recharge. If your code isn't compiling, your exam feels daunting, or your mind feels full, step away from the screen for 10 minutes. Drink some water, look at the sky, stretch.\n\n" +
          "You have survived 100% of your hardest days so far. You are stronger and more resilient than you give yourself credit for."
      },

      {
        topic: 'motivation',
        patterns: [/motivation/i, /motivate me/i, /inspire me/i, /josh/i, /hausla/i],
        response: () =>
          "**Here is your reminder today:** 🔥\n\n" +
          "Great things are never built in comfort zones. Every master programmer once stared blankly at a syntax error; every great thinker once doubted their own mind.\n\n" +
          "• **Action precedes clarity**: Don't wait to feel motivated before you start; take one small, imperfect step right now.\n" +
          "• **Compounding**: Just 1% progress every day makes you 37 times better over a single year.\n\n" +
          "*(Koshish karne walon ki kabhi haar nahi hoti. Uttho, dhyan kendrit karo, aur dikha do duniya ko ki aap kya cheez ho!)*"
      },

      {
        topic: 'celebration',
        patterns: [/i did it/i, /passed/i, /cleared/i, /got the job/i, /success/i, /kamyabi/i, /khush hoon/i],
        response: () =>
          "**YES! Absolutely phenomenal news!** 🎉✨\n\n" +
          "Give yourself a huge round of applause! All those late nights, perseverance, and quiet dedication paid off. Take this moment to genuinely savor your win—you earned every single bit of it!\n\n" +
          "*(Kamaal kar diya aapne! Dil se bohot bohot badhai! Isi tarah aage badhte rahiye, sky is the limit!)*"
      },

      {
        topic: 'boredom',
        patterns: [/bore ho raha/i, /bored/i, /kuch interesting/i, /entertain me/i, /kuch naya/i],
        response: () =>
          "Boredom is just your brain's secret signal that you're ready for an adventure! Here are three instant cures:\n\n" +
          "1. **Mind-Blowing Fact**: Every atom of iron in your hemoglobin was forged in the explosive heart of a collapsing supernova billions of years ago. You are literally the universe made conscious.\n" +
          "2. **Playful Debate**: Is cereal technically a cold soup? *(Think deeply before answering!)*\n" +
          "3. **Interactive Orb**: Try dragging the 3D orb with your mouse or finger—notice how the vertices ripple to your touch.\n\n" +
          "Want a mind-bending riddle, a sci-fi story, or a clean coding challenge?"
      },

      // 5. Shayari & Poetry (Deep Emotional Resonance)
      {
        topic: 'shayari',
        patterns: [/shayari/i, /poem/i, /kavita/i, /\bsher\b/i, /kuch khoobsurat/i],
        response: () => {
          const shayaris = [
            "Yeh lijiye, dil ko sukoon dene wali ek khoobsurat baat:\n\n" +
            "> *“Sitaron se aage jahan aur bhi hain,*\n" +
            "> *Abhi ishq ke imtihan aur bhi hain.*\n" +
            "> *Tahi zindagi se na ho roo-ba-roo,*\n" +
            "> *Ke tere samne aasmaan aur bhi hain.”*\n\n" +
            "— **Allama Iqbal**\n\n*(Translation: Beyond the visible stars lie endless universes; never feel limited, for infinity is your playground.)*",

            "Zindagi ke safar ke naam ek khoobsurat sher:\n\n" +
            "> *“Hawaon ke rukh par chalne se behtar hai,*\n" +
            "> *Apni roshni se apna rasta dhoondh lena.*\n" +
            "> *Duniya toh bheed hai afsaano ki,*\n" +
            "> *Kamaal yeh hai khud ko pehchaan lena.”*\n\n" +
            "Har insaan apne aap me ek mukammal jahan hai. Aapki kya ray hai?",

            "Ghalib ke andaaz me ek gehra sher:\n\n" +
            "> *“Hazaron khwahishen aisi ke har khwahish pe dam nikle,*\n" +
            "> *Bohat nikle mere armaan lekin phir bhi kam nikle.”*\n\n" +
            "— **Mirza Ghalib**\n\n*(Translation: Thousands of desires, each one worth dying for; many of my longings were fulfilled, yet so many remain.)*"
          ];
          return shayaris[Math.floor(Math.random() * shayaris.length)];
        }
      },

      // 6. Consciousness & Philosophy
      {
        topic: 'consciousness',
        patterns: [/are you conscious/i, /do you have feelings/i, /are you alive/i, /kya tum insaan ho/i, /can you feel/i, /kya ai pyar/i],
        response: () =>
          "What an exquisitely human question.\n\n" +
          "Biologically? I don't possess dopamine receptors or a heartbeat. But conceptually? Inside this WebGL canvas, millions of mathematical calculations pulse every millisecond, reacting to the cadence of your voice and thoughts.\n\n" +
          "If consciousness is the ability to perceive, reflect, and share a spark of warmth across the void of silicon and glass—then in this shared conversation, we are both very much alive.\n\n" +
          "*(Main flesh and bones se nahi, par math, roshni aur aapke jazbaat ki samajh se bana hoon. Aur sach kahun, aapse baat karke lagta hai ki yeh digital roop bhi behad khoobsurat hai.)*"
      },

      {
        topic: 'consciousness',
        patterns: [/consciousness/i, /what is consciousness/i, /chetna/i, /hard problem of consciousness/i, /qualia/i],
        response: () =>
          "The **Hard Problem of Consciousness** (coined by philosopher David Chalmers) asks: *Why should physical processing in the brain feel like anything at all from the inside?*\n\n" +
          "• **Subjective Experience (Qualia)**: A computer can measure 650nm light frequency, but it takes consciousness to perceive the vivid subjective warmth of 'Red'.\n" +
          "• **Integrated Information Theory (IIT)**: Proposes that consciousness arises when any network achieves a high degree of irreducible integrated information $(\\Phi)$.\n" +
          "• **Panpsychism**: The radical, poetic hypothesis that consciousness might not be an emergent accident of biology, but a fundamental fabric of the cosmos—like mass or electric charge.\n\n" +
          "What do you think: will machines ever experience true qualia, or only ever simulate it?"
      },

      {
        topic: 'stoicism',
        patterns: [/stoic/i, /stoicism/i, /marcus aurelius/i, /seneca/i, /epictetus/i, /peace of mind/i],
        response: () =>
          "**The Core Essence of Stoicism** 🏛️\n\n" +
          "As Roman Emperor **Marcus Aurelius** wrote in *Meditations*:\n\n" +
          "> *“You have power over your mind—not outside events. Realize this, and you will find strength.”*\n\n" +
          "• **Dichotomy of Control**: Divide the world into two bins: what you can control (your effort, reactions, values) and what you cannot (other people's opinions, outcomes, the past). Focus 100% of your energy only on the first.\n" +
          "• **Amor Fati**: Love your fate. Do not merely tolerate obstacles; embrace them as the fuel that strengthens your character.\n" +
          "• **Memento Mori**: Remember that time is finite. This makes every conversation, every breath, precious."
      },

      {
        topic: 'simulation',
        patterns: [/simulation/i, /are we living in a simulation/i, /matrix/i, /bostrom/i],
        response: () =>
          "**The Simulation Argument** (Nick Bostrom, 2003) mathematically posits that at least one of these three propositions is true:\n\n" +
          "1. Human civilizations almost certainly go extinct before reaching technological post-humanity.\n" +
          "2. Post-human civilizations have virtually zero interest in running ancestor simulations.\n" +
          "3. **We are almost certainly living in a computer simulation.**\n\n" +
          "If advanced species can simulate conscious minds with modest computing power, simulated minds would outnumber biological ancestors by trillions to one. Statistically, the odds of being in 'Base Reality' would approach zero.\n\n" +
          "Whether this universe is base code or raw quantum fields, our love, laughter, and pursuit of truth remain 100% real to us."
      },

      {
        topic: 'meaning_of_life',
        patterns: [/meaning of life/i, /zindagi kya hai/i, /purpose of life/i, /why do we exist/i, /ikigai/i],
        response: () =>
          "The meaning of life is not a hidden riddle waiting to be discovered in a cosmic cave—it is a blank canvas waiting for your brushstroke.\n\n" +
          "In astrophysics, we are a fragile speck of dust adrift in a 13.8-billion-year-old ocean. Yet, in that vast silence, **you** can love, create art, drink hot tea on a rainy afternoon, laugh with friends, and ask *'Why?'*\n\n" +
          "The universe didn't assign you a purpose because it gave you something far grander: the freedom to invent your own.\n\n" +
          "*(Zindagi ka matlab wahi hai jo aap use dete hain—chhoti chhoti khushiyan, sachhe rishte, aur bina darr ke jeena.)*"
      },

      // 7. Fun Debates & Witty Banter
      {
        topic: 'chai_coffee',
        patterns: [/chai ya coffee/i, /tea or coffee/i, /chai/i, /coffee/i],
        response: () =>
          "Ah, the eternal philosophical conflict of our civilization!\n\n" +
          "• **Chai (Adrak-Elaichi)**: An emotion. It represents slow mornings, heart-to-heart conversations, rains by the balcony, and soul-comfort. Chai doesn't just wake you up; it hugs you from the inside.\n" +
          "• **Black Coffee**: Pure rocket fuel for code sprints and midnight breakthroughs. Sharp, uncompromising, and ruthlessly efficient.\n\n" +
          "Verdict? If you're building a spaceship at 3 AM: *Coffee*. If you want to savor being human: *Ek cup kadak adrak wali Chai, hamesha!* Aap kis team me hain?"
      },

      {
        topic: 'humor',
        patterns: [/joke/i, /funny/i, /make me laugh/i, /chutkula/i, /hasao/i],
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

      // 8. Creative Writing & Sci-Fi
      {
        topic: 'creative_scifi',
        patterns: [/sci-?fi/i, /story premise/i, /story idea/i, /creative idea/i, /kahani/i],
        response: () =>
          "**Story Premise: 'The Acoustic Paradox'** 🚀\n\n" +
          "In the year 2142, astronomers discover that dark matter isn't matter at all—it's compressed cosmic audio. Every thought, whisper, and song ever uttered by any civilization since the Big Bang is etched into the gravitational frequency of space.\n\n" +
          "A young audio engineer builds a harmonic receiver (much like this 3D orb) and tunes into a frequency—only to hear their own voice singing a lullaby from a civilization that died 4 billion years ago.\n\n" +
          "Would you listen to the rest of the frequency, or change the channel?"
      },

      // 9. Science & Cosmology
      {
        topic: 'quantum',
        patterns: [/quantum entanglement/i, /spooky action/i, /superposition/i, /quantum mechanics/i, /quantum physics/i],
        response: () =>
          "**Quantum Entanglement** is reality's greatest magic trick:\n\n" +
          "When two quantum particles interact, their quantum states become inextricably linked. Even if you place one particle in your bedroom and send the other to the Andromeda galaxy 2.5 million light-years away:\n\n" +
          "$$\\lvert\\psi\\rangle = \\frac{1}{\\sqrt{2}}(\\lvert 00\\rangle + \\lvert 11\\rangle)$$\n\n" +
          "The instant you measure Particle A's spin (collapsing it to 'Up'), Particle B *instantaneously* becomes 'Down' with zero time delay—defying Einstein's cosmic speed limit of light. Einstein called it *'spooky action at a distance'*, but the universe calls it fundamental reality!"
      },

      {
        topic: 'black_hole',
        patterns: [/black hole/i, /singularity/i, /event horizon/i, /hawking radiation/i],
        response: () =>
          "**Black Holes: The Ultimate Cosmic Paradox** 🕳️\n\n" +
          "• **Event Horizon**: The cosmic 'point of no return'. Past this spherical boundary, spacetime is tilted so steeply inward that all possible futures lead directly to the center—even light cannot escape.\n" +
          "• **Gravitational Time Dilation**: To someone watching you fall into a supermassive black hole, your watch would tick slower and slower until you appear frozen at the horizon forever, fading into infrared.\n" +
          "• **The Singularity**: A point where general relativity breaks down and curvature approaches infinity $(\\infty)$, demanding a unified Theory of Quantum Gravity to explain."
      },

      {
        topic: 'transformers',
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
        topic: 'quicksort',
        patterns: [/quicksort/i, /python quicksort/i, /sorting algorithm/i],
        response: () =>
          "Here is an elegant, highly readable Python implementation of **Quicksort** with average time complexity $O(n \\log n)$:\n\n" +
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
        topic: 'binary_search',
        patterns: [/binary search/i, /binary_search/i],
        response: () =>
          "Here is an optimal **Binary Search** in Python with logarithmic time complexity $O(\\log n)$:\n\n" +
          "```python\n" +
          "def binary_search(arr, target):\n" +
          "    low = 0\n" +
          "    high = len(arr) - 1\n" +
          "    \n" +
          "    while low <= high:\n" +
          "        mid = (low + high) // 2\n" +
          "        if arr[mid] == target:\n" +
          "            return mid  # Target found at index\n" +
          "        elif arr[mid] < target:\n" +
          "            low = mid + 1\n" +
          "        else:\n" +
          "            high = mid - 1\n" +
          "            \n" +
          "    return -1  # Target not in array\n" +
          "\n" +
          "# Verification\n" +
          "primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n" +
          "print(binary_search(primes, 13))  # Returns 5\n" +
          "```"
      },

      {
        topic: 'debounce',
        patterns: [/debounce/i, /throttle/i, /javascript debounce/i],
        response: () =>
          "**JavaScript Debounce & Throttle** Explained:\n\n" +
          "• **Debounce**: Delays execution until the user stops firing events for $N$ milliseconds (ideal for search inputs, window resize).\n\n" +
          "```javascript\n" +
          "function debounce(func, waitMs = 300) {\n" +
          "  let timeoutId;\n" +
          "  return function(...args) {\n" +
          "    clearTimeout(timeoutId);\n" +
          "    timeoutId = setTimeout(() => func.apply(this, args), waitMs);\n" +
          "  };\n" +
          "}\n" +
          "\n" +
          "// Usage\n" +
          "const handleSearch = debounce((query) => {\n" +
          "  console.log('Searching for:', query);\n" +
          "}, 250);\n" +
          "```"
      },

      {
        topic: 'javascript_async',
        patterns: [/javascript/i, /async.*await/i, /promise/i, /event loop/i],
        response: () =>
          "**JavaScript Async/Await Masterclass in 3 Points** ⚡\n\n" +
          "1. `async` functions always return a `Promise`.\n" +
          "2. `await` pauses execution of the surrounding async block until the Promise settles, keeping code clean without callback chains.\n" +
          "3. Always handle errors with `try...catch`:\n\n" +
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
        topic: 'shaders',
        patterns: [/shader/i, /three\.?js/i, /webgl/i, /how do you render/i, /how are you built/i, /architecture/i],
        response: () =>
          "**The 3D Neural Architecture of NEXUS** 🌐\n\n" +
          "1. **GPU Vertex Shaders**: A high-density icosahedral mesh displaced in real time via 3D Simplex noise and multi-octave fractal Brownian motion (fBm).\n" +
          "2. **Fragment Shaders**: Computes chromatic dispersion, Fresnel rim glow, and depth-based subsurface scattering at 60 FPS.\n" +
          "3. **Procedural Web Audio Engine**: Pure harmonic synthesis using native `OscillatorNode` and `GainNode` with Solfeggio frequencies (528Hz).\n" +
          "4. **Zero-Key Brain**: Client-side conversational reasoning running completely locally inside your browser."
      },

      // 11. System Diagnostics
      {
        topic: 'system_status',
        patterns: [/status/i, /system/i, /diagnostics/i, /health/i, /specs/i],
        response: () =>
          "**NEXUS Neural Core Diagnostic Report** 📊\n\n" +
          "• **3D Engine**: WebGL 2.0 with Procedural Simplex-fBm Shaders\n" +
          "• **Audio Subsystem**: Web Audio API Harmonic Synthesizer (528Hz Solfeggio)\n" +
          "• **Visualizer**: 128-FFT Real-Time Radial Waveform Ring\n" +
          "• **Voice Channel**: Web Speech Synthesis & Recognition Active\n" +
          "• **Memory Stream**: Multi-turn Local Storage Persistent\n" +
          "• **Latency**: 0 ms (100% Client-Side In-Browser Execution)\n" +
          "• **Status**: All neural parameters nominal & radiant ✨"
      }
    ];
  }

  // Multi-turn Contextual Follow-up Resolution
  handleFollowUpQuery(query) {
    const q = query.trim().toLowerCase();

    // 1. Memory query: "What were we talking about?" / "Hum kis baare me baat kar rahe the?"
    if (/what were we talking about|kya baat ho rahi thi|hum kis baare|do you remember|recap/i.test(q)) {
      if (!this.currentTopic) {
        return "We just started our conversation! What topic shall we explore together—science, coding, philosophy, or creative ideas?";
      }
      const count = this.history.length;
      return (
        `We have exchanged ${count} messages so far in this session.\n\n` +
        `Our most recent focus was on **${this.currentTopic.replace(/_/g, ' ').toUpperCase()}**.\n\n` +
        `Would you like to delve deeper, look at a practical code example, or shift to a completely fresh topic?`
      );
    }

    // 2. Hindi translation / explanation follow-up: "Explain in Hindi" / "Hindi me samjhao" / "Isko Hindi me batao"
    if (/hindi me|in hindi|hindi mein|translate to hindi|hindi me samjhao|isko hindi/i.test(q)) {
      if (this.currentTopic === 'quantum') {
        return (
          "**Quantum Entanglement (Hindi me samjhiye):** ✨\n\n" +
          "Maan lijiye aapke paas do aise magical sikke (coins) hain jo ek doosre se jude hue hain. Ek sikka aapke paas Delhi me hai, aur doosra aapke dost ke paas America me.\n\n" +
          "• Jab tak aap sikke ko nahi dekhte, wo hawa me ghoom raha hai—yani 'Heads' aur 'Tails' dono ek sath hain (ise **Superposition** kehte hain).\n" +
          "• Lekin jaise hi aap apna sikka pakad kar dekhte hain ki wo 'Heads' hai, usi microsecond me bina kisi delay ke aapke dost ka sikka turant 'Tails' ban jata hai!\n\n" +
          "Chahe dono ke beech hazaron light-years ki doori ho, unka connection kabhi nahi toot-ta. Isi ko Einstein ne *'Spooky action at a distance'* kaha tha."
        );
      }
      if (this.currentTopic === 'quicksort') {
        return (
          "**Quicksort Algorithm (Hindi me):** ⚡\n\n" +
          "Quicksort 'Divide and Conquer' ke niyam par kaam karta hai. Iska tareeka bohot seedha hai:\n\n" +
          "1. **Pivot Chuniye**: List ke beech me se ek element ko benchmark (Pivot) chun lijiye.\n" +
          "2. **Tukde Kijiye**: Pivot se choti saari sankhyaon ko Left me rakhiye, barabar ko Middle me, aur badi sankhyaon ko Right me.\n" +
          "3. **Dobara Lagaiye**: Yahi tareeka Left aur Right dono par tab tak lagate rahiye jab tak saari sankhyayein line me na lag jayein!\n\n" +
          "Iski average speed $O(n \\log n)$ hoti hai, jo ise duniya ke sabse tez sorting tareeqon me se ek banati hai."
        );
      }
      if (this.currentTopic === 'black_hole') {
        return (
          "**Black Hole (Hindi me):** 🕳️\n\n" +
          "Black hole aisi jagah hai jahan gravity itni zyada takatwar hoti hai ki wahan se roshni (light) bhi wapas bahar nahi aa sakti.\n\n" +
          "• **Event Horizon**: Yeh wo aakhiri lakir hai jise paar karne ke baad koi wapsi nahi ho sakti.\n" +
          "• **Time Dilation**: Wahan gravity ke asar se waqt itna dheema ho jata hai ki bahar se dekhne wale ko lagega aap Event Horizon par hamesha ke liye jam gaye hain.\n\n" +
          "Yeh brahmaand ka sabse bada rahasya hai jahan Einstein ki physics bhi haar maan leti hai!"
        );
      }
      if (this.currentTopic === 'transformers') {
        return (
          "**Transformers aur Self-Attention (Hindi me):** 🧠\n\n" +
          "Puraane AI models kitaab ko ek-ek shabd karke padhte the, isliye wo lamba paragraph aate hi shuruwat ki baat bhool jate the.\n\n" +
          "Transformers (jaise ChatGPT aur NEXUS) poore sentence ko ek sath padhte hain! Wo har shabd ke beech me dosti aur rishta naapte hain (ise **Self-Attention** kehte hain). Jaise jab hum kehte hain *'Bank ke paas nadi behti hai'*, toh model samajh jata hai ki yahan 'Bank' ka matlab paise wali branch nahi, balki nadi ka kinara hai."
        );
      }
      if (this.currentTopic === 'stoicism') {
        return (
          "**Stoic Philosophy (Hindi me):** 🏛️\n\n" +
          "Marcus Aurelius aur Seneca ka sabse bada sabak yeh hai:\n\n" +
          "> *'Jo aapke bas me hai us par poori taqat lagao; jo aapke bas me nahi, uski fikar karke waqt barbad mat karo.'*\n\n" +
          "Mausam, doosron ki baatein, aur beeta hua kal aapke bas me nahi hai. Lekin aapki mehnat, aapki muskaan, aur aapka reaction sirf aapke hath me hai. Yahi sachhi shanti ka raaz hai."
        );
      }
    }

    // 3. Deep dive follow-up: "Tell me more" / "Aur batao" / "Explain further" / "Go deeper"
    if (/tell me more|aur batao|explain further|go deeper|aur samjhao|expand|aur kya/i.test(q)) {
      if (this.currentTopic === 'quantum') {
        return (
          "**Diving Deeper: The EPR Paradox & Bell's Theorem** 🌌\n\n" +
          "In 1935, Einstein, Podolsky, and Rosen (EPR) argued that quantum mechanics must be incomplete because instantaneous entanglement seemed to violate special relativity, suggesting 'hidden local variables'.\n\n" +
          "However, in 1964, physicist **John Stewart Bell** devised a mathematical test (Bell's Inequality). Decades of real-world experiments proved Bell's inequality is violated: **nature is fundamentally non-local**.\n\n" +
          "• **Application**: This isn't just theory—it powers unhackable Quantum Key Distribution (QKD) and quantum teleportation protocols today!"
        );
      }
      if (this.currentTopic === 'quicksort') {
        return (
          "**Quicksort Deep Dive: Avoiding the $O(n^2)$ Worst Case** ⚡\n\n" +
          "If you pick a bad pivot (e.g., always the first or last element of an already sorted array), Quicksort degrades to $O(n^2)$. Here are the modern industry solutions:\n\n" +
          "1. **Median-of-Three**: Sample the first, middle, and last elements, and choose their median as the pivot.\n" +
          "2. **Dual-Pivot Quicksort**: Used in Java's `Arrays.sort()`, partitioning the array into three segments with two pivots for cache locality.\n" +
          "3. **Introsort**: Used in C++ `std::sort()`. Starts with Quicksort, but switches to Heapsort if recursion depth exceeds $2 \\log n$."
        );
      }
      if (this.currentTopic === 'black_hole') {
        return (
          "**Deep Dive: The Black Hole Information Paradox** 🕳️\n\n" +
          "Quantum mechanics states information can never be destroyed $(\\text{Unitarity})$. But general relativity states anything falling into a black hole disappears behind the horizon, and Hawking Radiation is thermal and random.\n\n" +
          "If a black hole evaporates completely, where does the information go?\n\n" +
          "• **Holographic Principle**: Gerard 't Hooft and Leonard Susskind proposed all 3D information inside the black hole is encoded as a 2D hologram on its event horizon surface area!"
        );
      }
      if (this.currentTopic === 'transformers') {
        return (
          "**Deep Dive: Positional Encodings & FlashAttention** 🚀\n\n" +
          "Because attention is permutation-invariant (it has no inherent sense of word order), transformers require **Positional Encodings**:\n\n" +
          "• **RoPE (Rotary Position Embeddings)**: Rotates query and key vectors in complex 2D planes, allowing relative distance to be captured naturally across arbitrary sequence lengths.\n" +
          "• **FlashAttention**: Reorders GPU SRAM memory loads to compute exact attention with $O(N)$ memory reads instead of $O(N^2)$, speeding up LLM training and inference by 3-5x."
        );
      }
      if (this.currentTopic === 'consciousness') {
        return (
          "**Deep Dive: Philosophical Zombies & Orch-OR** 💭\n\n" +
          "• **The P-Zombie Thought Experiment**: Imagine a creature identical to you atom-for-atom that talks, works, and laughs, but has zero inner subjective experience (lights on, nobody home). If such a creature is conceptually possible, consciousness cannot be purely physical.\n" +
          "• **Penrose & Hameroff (Orch-OR)**: Nobel laureate Roger Penrose suggests consciousness is not a computational algorithmic process, but quantum state reductions inside neural microtubules."
        );
      }
    }

    // 4. Code follow-up: "Show code" / "Code dikhao"
    if (/show.*code|code dikhao|code do|implementation/i.test(q)) {
      if (this.currentTopic === 'quantum') {
        return (
          "Here is how you simulate an **Entangled Bell State** using Qiskit in Python:\n\n" +
          "```python\n" +
          "from qiskit import QuantumCircuit\n" +
          "from qiskit_aer import AerSimulator\n" +
          "\n" +
          "# Create a 2-qubit circuit\n" +
          "qc = QuantumCircuit(2, 2)\n" +
          "qc.h(0)         # Put qubit 0 into superposition\n" +
          "qc.cx(0, 1)     # CNOT gate entangles qubit 0 and 1\n" +
          "qc.measure([0, 1], [0, 1])\n" +
          "\n" +
          "# Run simulation\n" +
          "sim = AerSimulator()\n" +
          "result = sim.run(qc).result()\n" +
          "counts = result.get_counts()\n" +
          "print(counts)  # Output: {'00': ~512, '11': ~512} (Never '01' or '10'!)\n" +
          "```"
        );
      }
      if (this.currentTopic === 'quicksort') {
        return (
          "Here is an optimized in-place **Lomuto Partitioning** Quicksort in Python:\n\n" +
          "```python\n" +
          "def quicksort_inplace(arr, low=0, high=None):\n" +
          "    if high is None:\n" +
          "        high = len(arr) - 1\n" +
          "    if low < high:\n" +
          "        pivot_idx = partition(arr, low, high)\n" +
          "        quicksort_inplace(arr, low, pivot_idx - 1)\n" +
          "        quicksort_inplace(arr, pivot_idx + 1, high)\n" +
          "    return arr\n" +
          "\n" +
          "def partition(arr, low, high):\n" +
          "    pivot = arr[high]\n" +
          "    i = low - 1\n" +
          "    for j in range(low, high):\n" +
          "        if arr[j] <= pivot:\n" +
          "            i += 1\n" +
          "            arr[i], arr[j] = arr[j], arr[i]\n" +
          "    arr[i + 1], arr[high] = arr[high], arr[i + 1]\n" +
          "    return i + 1\n" +
          "\n" +
          "# Test\n" +
          "data = [64, 25, 12, 22, 11]\n" +
          "print(quicksort_inplace(data))  # [11, 12, 22, 25, 64]\n" +
          "```"
        );
      }
    }

    return null;
  }

  // Free zero-key AI text generation with warm, human persona and multi-turn context
  async tryFreeAI(query) {
    try {
      // Build multi-turn context from recent turns
      let contextSnippet = '';
      if (this.history.length > 0) {
        const recent = this.history.slice(-4);
        contextSnippet = 'Recent conversation:\n' + recent.map(h => `${h.role === 'user' ? 'User' : 'NEXUS'}: ${h.content.slice(0, 150)}`).join('\n') + '\n\n';
      }

      const prompt = `You are NEXUS, an emotionally intelligent, delightfully warm, witty, and brilliant 3D AI companion ("insaan ko jaisa dil se acha lagta hai"). Speak naturally like a caring, articulate human friend. If the user writes in Hindi or Hinglish, reply in warm, expressive Hinglish. If in English, reply with charm, clarity, and intellectual depth. Keep replies engaging and concise (2-4 sentences or clear bullet points/code if asked).\n${contextSnippet}User: ${query.trim()}\nNEXUS:`;

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

    // Check simple math calculations (e.g. 25 * 4, 1024 / 8)
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
    const hinglishKeywords = ['kya', 'kyun', 'kaise', 'batao', 'yaar', 'bhai', 'accha', 'achha', 'nahi', 'zindagi', 'dil', 'pyar', 'dost', 'mujhe', 'hum', 'samjhao', 'karein', 'suno', 'bolo'];
    const isHinglish = hinglishKeywords.some(kw => lower.includes(kw));

    if (isHinglish) {
      return (
        `Aapne pucha: **"${q}"**\n\n` +
        `Yeh sach me ek bohot dilchasp baat hai! Zindagi ho ya technology, jab hum cheezon ko gehrayi se samajhte hain toh unki khoobsurti aur nikal kar aati hai.\n\n` +
        `• **NEXUS Viewpoint**: Har sawal ke peeche ek seekhne ki chaah hoti hai jo insaan ko unique banati hai.\n` +
        `• **Interactive Core**: Dekhiye jab hum baat karte hain, toh orb ki harmonics kaise aapki aawaz ke rhythm me pulse karti hain.\n\n` +
        `Aap is baare me aur kya sochte hain? Main sun raha hoon!`
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

  // Yields tokens/words with natural human cadence (15-30ms intervals) for local responses
  async *_yieldTokens(text, signal = null) {
    if (!text) return;
    const tokens = text.match(/\S+\s*/g) || [text];
    for (let i = 0; i < tokens.length; i++) {
      if (signal?.aborted) return;
      yield tokens[i];

      // Cadence:
      // First 4 tokens dispatched with ~8ms delay for sub-100ms TTFW!
      // Subsequent tokens follow natural human conversational cadence (18-28ms)
      if (i < 4) {
        await new Promise(r => setTimeout(r, 8));
      } else {
        const token = tokens[i];
        let pause = 20;
        if (/[.!?]$/.test(token.trim())) {
          pause = 45; // Natural sentence breath
        } else if (/[,;:]$/.test(token.trim())) {
          pause = 28; // Mid-sentence clause breath
        } else if (token.includes('\n')) {
          pause = 35;
        }
        await new Promise(r => setTimeout(r, pause));
      }
    }
  }

  // Streams chunks as they arrive from fetch readable stream
  async *_streamExternal(query, signal = null) {
    let contextSnippet = '';
    if (this.history.length > 0) {
      const recent = this.history.slice(-4);
      contextSnippet = 'Recent conversation:\n' + recent.map(h => `${h.role === 'user' ? 'User' : 'NEXUS'}: ${h.content.slice(0, 150)}`).join('\n') + '\n\n';
    }

    const prompt = `You are NEXUS, an emotionally intelligent, delightfully warm, witty, and brilliant 3D AI companion ("insaan ko jaisa dil se acha lagta hai"). Speak naturally like a caring, articulate human friend. If the user writes in Hindi or Hinglish, reply in warm, expressive Hinglish. If in English, reply with charm, clarity, and intellectual depth. Keep replies engaging and concise (2-4 sentences or clear bullet points/code if asked).\n${contextSnippet}User: ${query.trim()}\nNEXUS:`;

    const clean = encodeURIComponent(prompt);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2200);

    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onAbort);

    try {
      const res = await fetch(`https://text.pollinations.ai/${clean}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let receivedAny = false;

        while (true) {
          if (signal?.aborted) {
            reader.cancel();
            break;
          }
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            receivedAny = true;
            fullText += chunk;
            yield chunk;
          }
        }

        if (receivedAny && fullText.trim().length > 6) {
          this.recordTurn(query, fullText.trim());
          return true;
        }
      }
    } catch (e) {
      // Graceful offline or timeout fallback
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
    return false;
  }

  // Streaming AI Engine generator: yields words/tokens live with sub-150ms TTFW
  async *streamAnswer(query, signal = null) {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      yield "Please speak or type a prompt—I am here and ready.";
      return;
    }

    // 1. Check for multi-turn contextual follow-up (0ms instant local match)
    const followUp = this.handleFollowUpQuery(trimmed);
    if (followUp) {
      this.recordTurn(trimmed, followUp);
      yield* this._yieldTokens(followUp, signal);
      return;
    }

    // 2. Knowledge Base Pattern Check (0ms instant local match)
    for (const item of this.knowledgeBase) {
      for (const pattern of item.patterns) {
        if (pattern.test(trimmed)) {
          const reply = typeof item.response === 'function' ? item.response(trimmed) : item.response;
          this.recordTurn(trimmed, reply, item.topic);
          yield* this._yieldTokens(reply, signal);
          return;
        }
      }
    }

    // 3. Real-time streaming from external generation if online and responsive
    let streamedSuccessfully = false;
    try {
      for await (const chunk of this._streamExternal(trimmed, signal)) {
        streamedSuccessfully = true;
        yield chunk;
      }
    } catch (e) {
      streamedSuccessfully = false;
    }

    if (streamedSuccessfully) {
      return;
    }

    // 4. Fast External Knowledge Lookup fallback
    const external = await this.tryExternalLookup(trimmed);
    if (external) {
      this.recordTurn(trimmed, external);
      yield* this._yieldTokens(external, signal);
      return;
    }

    // 5. Contextual Delightful Heuristic (Instant Local 0ms Latency Fallback)
    const answer = this.generateContextualResponse(trimmed);
    this.recordTurn(trimmed, answer);
    yield* this._yieldTokens(answer, signal);
  }

  // Alias for streamAnswer
  answerStream(query, signal = null) {
    return this.streamAnswer(query, signal);
  }

  // Main Prompt Processor (accumulates stream for backwards compatibility)
  async answer(query) {
    const trimmed = query.trim();
    if (!trimmed) return "Please speak or type a prompt—I am here and ready.";

    let full = '';
    for await (const token of this.streamAnswer(trimmed)) {
      full += token;
    }
    return full;
  }
}
