// src/orb.js
// 3D Point-Cloud Particle Wave AI Orb (Magnific / Freepik Starlight Particle Sphere)
import * as THREE from 'three';
import {
  particleWaveSphereVertexShader,
  particleWaveSphereFragmentShader,
  innerPointCoreVertexShader,
  innerPointCoreFragmentShader,
  outerDustVertexShader,
  outerDustFragmentShader
} from './shaders.js';

// Color themes and animation profiles for each orb state
// Pristine starlight silver/white is the foundation, with subtle state-based chromatic luminescence
const STATE_PROFILES = {
  idle: {
    colorBase: new THREE.Color('#ffffff'), // Luminous starlight
    colorA: new THREE.Color('#00f0ff'),    // Electric cyan sheen
    colorB: new THREE.Color('#8b5cf6'),    // Celestial violet
    colorC: new THREE.Color('#38bdf8'),    // Sky blue rim
    colorCore: new THREE.Color('#e0f2fe'), // Radiant white-blue
    displacementAmp: 0.22,
    noiseFreq: 0.85,
    noiseSpeed: 0.40,
    pointSize: 1.75,
    rotationSpeed: 0.22
  },
  listening: {
    colorBase: new THREE.Color('#ffffff'),
    colorA: new THREE.Color('#00f5d4'),    // Mint cyan
    colorB: new THREE.Color('#00bbf9'),    // Vibrant azure
    colorC: new THREE.Color('#38bdf8'),
    colorCore: new THREE.Color('#22d3ee'),
    displacementAmp: 0.36,
    noiseFreq: 1.45,
    noiseSpeed: 0.95,
    pointSize: 2.1,
    rotationSpeed: 0.55
  },
  thinking: {
    colorBase: new THREE.Color('#ffffff'),
    colorA: new THREE.Color('#a855f7'),    // Electric purple
    colorB: new THREE.Color('#ec4899'),    // Vivid magenta
    colorC: new THREE.Color('#f59e0b'),    // Amber gold
    colorCore: new THREE.Color('#d946ef'),
    displacementAmp: 0.42,
    noiseFreq: 2.1,
    noiseSpeed: 1.45,
    pointSize: 2.3,
    rotationSpeed: 1.05
  },
  speaking: {
    colorBase: new THREE.Color('#ffffff'),
    colorA: new THREE.Color('#06b6d4'),    // Cyan
    colorB: new THREE.Color('#ec4899'),    // Magenta flare
    colorC: new THREE.Color('#fbbf24'),    // Golden amber
    colorCore: new THREE.Color('#fde047'),
    displacementAmp: 0.44,
    noiseFreq: 1.35,
    noiseSpeed: 0.85,
    pointSize: 2.4,
    rotationSpeed: 0.42
  }
};

export class AIOrb {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentState = 'idle';
    this.targetProfile = { ...STATE_PROFILES.idle };

    // Active interpolated values
    this.activeValues = {
      colorBase: STATE_PROFILES.idle.colorBase.clone(),
      colorA: STATE_PROFILES.idle.colorA.clone(),
      colorB: STATE_PROFILES.idle.colorB.clone(),
      colorC: STATE_PROFILES.idle.colorC.clone(),
      colorCore: STATE_PROFILES.idle.colorCore.clone(),
      displacementAmp: STATE_PROFILES.idle.displacementAmp,
      noiseFreq: STATE_PROFILES.idle.noiseFreq,
      noiseSpeed: STATE_PROFILES.idle.noiseSpeed,
      pointSize: STATE_PROFILES.idle.pointSize,
      rotationSpeed: STATE_PROFILES.idle.rotationSpeed
    };

    // Audio reactivity metrics
    this.audioIntensity = 0.0;
    this.audioBass = 0.0;
    this.audioTreble = 0.0;
    this.smoothAudio = { intensity: 0, bass: 0, treble: 0 };

    // Mouse / Interaction controls
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.dragRotation = { x: 0, y: 0 };
    this.shockwave = 0.0;

    this.clock = new THREE.Clock();

    this.initScene();
    this.initParticleWaveSphere();
    this.initInnerPointCore();
    this.initOuterDust();
    this.initEventListeners();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.appendChild(this.renderer.domElement);

    // Group for combined rotations & parallax
    this.orbGroup = new THREE.Group();
    this.scene.add(this.orbGroup);
  }

  // 1. Primary Particle Wave Sphere (35,000+ concentric starlight points)
  initParticleWaveSphere() {
    const radius = 2.15;
    const rings = 190;
    const maxPointsPerRing = 270;

    const positions = [];
    const scales = [];
    const randoms = [];

    // Distribute points in concentric latitude rings with organic micro-jitter
    for (let r = 0; r <= rings; r++) {
      const v = r / rings;
      const phi = v * Math.PI; // 0 to PI
      const ringRadius = Math.sin(phi);
      const yBase = Math.cos(phi) * radius;

      // Density scales with perimeter of latitude circle
      const pointsInRing = Math.max(1, Math.round(ringRadius * maxPointsPerRing));

      for (let p = 0; p < pointsInRing; p++) {
        const u = p / pointsInRing;
        // Small organic angular jitter to avoid rigid computer lines
        const thetaJitter = (Math.random() - 0.5) * (0.015);
        const theta = u * Math.PI * 2 + thetaJitter;

        const radialJitter = (Math.random() - 0.5) * 0.035;
        const curRadius = radius * (1.0 + radialJitter);

        const x = Math.sin(phi) * Math.cos(theta) * curRadius;
        const y = Math.cos(phi) * curRadius;
        const z = Math.sin(phi) * Math.sin(theta) * curRadius;

        positions.push(x, y, z);

        // Dot size variation: mixture of small stars and brighter focal dots
        const isBrightStar = Math.random() < 0.08;
        const scale = isBrightStar ? (1.3 + Math.random() * 0.7) : (0.75 + Math.random() * 0.45);
        scales.push(scale);

        randoms.push(Math.random());
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.Float32BufferAttribute(scales, 1));
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));

    this.waveSphereUniforms = {
      uTime: { value: 0.0 },
      uAudioIntensity: { value: 0.0 },
      uAudioBass: { value: 0.0 },
      uAudioTreble: { value: 0.0 },
      uDisplacementAmp: { value: this.activeValues.displacementAmp },
      uNoiseFreq: { value: this.activeValues.noiseFreq },
      uNoiseSpeed: { value: this.activeValues.noiseSpeed },
      uPointSize: { value: this.activeValues.pointSize },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColorBase: { value: this.activeValues.colorBase },
      uColorA: { value: this.activeValues.colorA },
      uColorB: { value: this.activeValues.colorB },
      uColorC: { value: this.activeValues.colorC },
      uStatePulse: { value: 0.0 }
    };

    this.waveSphereMaterial = new THREE.ShaderMaterial({
      vertexShader: particleWaveSphereVertexShader,
      fragmentShader: particleWaveSphereFragmentShader,
      uniforms: this.waveSphereUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.waveSphereMesh = new THREE.Points(geometry, this.waveSphereMaterial);
    this.orbGroup.add(this.waveSphereMesh);
  }

  // 2. Inner Point Core (~6,000 dense points at radius ~1.2)
  initInnerPointCore() {
    const count = 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.1 + Math.random() * 0.25;

      const i3 = i * 3;
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi);
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      scales[i] = 0.6 + Math.random() * 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    this.innerCoreUniforms = {
      uTime: { value: 0.0 },
      uAudioBass: { value: 0.0 },
      uAudioIntensity: { value: 0.0 },
      uPointSize: { value: 1.3 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uCoreColor: { value: this.activeValues.colorCore }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: innerPointCoreVertexShader,
      fragmentShader: innerPointCoreFragmentShader,
      uniforms: this.innerCoreUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.innerCoreMesh = new THREE.Points(geometry, material);
    this.orbGroup.add(this.innerCoreMesh);
  }

  // 3. Ambient Outer Stardust (~1,800 orbiting motes)
  initOuterDust() {
    const count = 1800;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    const dustColors = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0f2fe'),
      new THREE.Color('#00f0ff'),
      new THREE.Color('#c084fc'),
      new THREE.Color('#38bdf8')
    ];

    for (let i = 0; i < count; i++) {
      const radius = 2.4 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const i3 = i * 3;
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const col = dustColors[Math.floor(Math.random() * dustColors.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      sizes[i] = 1.0 + Math.random() * 1.8;
      speeds[i] = 0.2 + Math.random() * 0.8;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.dustUniforms = {
      uTime: { value: 0.0 },
      uAudioIntensity: { value: 0.0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: outerDustVertexShader,
      fragmentShader: outerDustFragmentShader,
      uniforms: this.dustUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustMesh = new THREE.Points(geometry, material);
    this.orbGroup.add(this.dustMesh);
  }

  // Interactive mouse/touch tracking and dragging
  initEventListeners() {
    this.onResize = () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      const pr = Math.min(window.devicePixelRatio, 2);
      this.renderer.setPixelRatio(pr);
      if (this.waveSphereUniforms) this.waveSphereUniforms.uPixelRatio.value = pr;
      if (this.innerCoreUniforms) this.innerCoreUniforms.uPixelRatio.value = pr;
      if (this.dustUniforms) this.dustUniforms.uPixelRatio.value = pr;
    };
    window.addEventListener('resize', this.onResize);

    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      this.mouse.targetX = (clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(clientY / window.innerHeight) * 2 + 1;

      if (this.isDragging) {
        const deltaX = clientX - this.previousMousePosition.x;
        const deltaY = clientY - this.previousMousePosition.y;

        this.dragRotation.y += deltaX * 0.005;
        this.dragRotation.x += deltaY * 0.005;

        this.previousMousePosition = { x: clientX, y: clientY };
      }
    };

    const onPointerDown = (e) => {
      if (e.target.closest('#app-overlay') && !e.target.closest('#canvas-container')) {
        return;
      }
      this.isDragging = true;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      this.previousMousePosition = { x: clientX, y: clientY };
      this.triggerShockwave();
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
  }

  // Trigger an acoustic shockwave ripple through the particle lattice
  triggerShockwave() {
    this.shockwave = 1.0;
  }

  // State transitions: idle, listening, thinking, speaking
  setState(stateName) {
    if (!STATE_PROFILES[stateName]) return;
    this.currentState = stateName;
    this.targetProfile = { ...STATE_PROFILES[stateName] };
    this.triggerShockwave();
  }

  // Ingest real-time audio metrics from Web Audio API Analyser
  setAudioData({ intensity = 0, bass = 0, treble = 0 }) {
    this.audioIntensity = intensity;
    this.audioBass = bass;
    this.audioTreble = treble;
  }

  // Animation Loop
  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth profile interpolation
    const lerpSpeed = 0.06;
    this.activeValues.colorBase.lerp(this.targetProfile.colorBase, lerpSpeed);
    this.activeValues.colorA.lerp(this.targetProfile.colorA, lerpSpeed);
    this.activeValues.colorB.lerp(this.targetProfile.colorB, lerpSpeed);
    this.activeValues.colorC.lerp(this.targetProfile.colorC, lerpSpeed);
    this.activeValues.colorCore.lerp(this.targetProfile.colorCore, lerpSpeed);

    this.activeValues.displacementAmp = THREE.MathUtils.lerp(
      this.activeValues.displacementAmp,
      this.targetProfile.displacementAmp,
      lerpSpeed
    );
    this.activeValues.noiseFreq = THREE.MathUtils.lerp(
      this.activeValues.noiseFreq,
      this.targetProfile.noiseFreq,
      lerpSpeed
    );
    this.activeValues.noiseSpeed = THREE.MathUtils.lerp(
      this.activeValues.noiseSpeed,
      this.targetProfile.noiseSpeed,
      lerpSpeed
    );
    this.activeValues.pointSize = THREE.MathUtils.lerp(
      this.activeValues.pointSize,
      this.targetProfile.pointSize,
      lerpSpeed
    );
    this.activeValues.rotationSpeed = THREE.MathUtils.lerp(
      this.activeValues.rotationSpeed,
      this.targetProfile.rotationSpeed,
      lerpSpeed
    );

    // Smooth audio reactivity to prevent visual jitter
    const audioDamp = 0.15;
    this.smoothAudio.intensity = THREE.MathUtils.lerp(this.smoothAudio.intensity, this.audioIntensity, audioDamp);
    this.smoothAudio.bass = THREE.MathUtils.lerp(this.smoothAudio.bass, this.audioBass, audioDamp);
    this.smoothAudio.treble = THREE.MathUtils.lerp(this.smoothAudio.treble, this.audioTreble, audioDamp);

    // Shockwave decay
    if (this.shockwave > 0.001) {
      this.shockwave *= 0.92;
    } else {
      this.shockwave = 0.0;
    }

    // Breathing motion when idle
    const breathing = Math.sin(elapsedTime * 1.6) * 0.035;
    const finalDisplacement = this.activeValues.displacementAmp + breathing + this.shockwave * 0.35;

    // Update Primary Wave Sphere Uniforms
    this.waveSphereUniforms.uTime.value = elapsedTime;
    this.waveSphereUniforms.uAudioIntensity.value = this.smoothAudio.intensity;
    this.waveSphereUniforms.uAudioBass.value = this.smoothAudio.bass;
    this.waveSphereUniforms.uAudioTreble.value = this.smoothAudio.treble;
    this.waveSphereUniforms.uDisplacementAmp.value = finalDisplacement;
    this.waveSphereUniforms.uNoiseFreq.value = this.activeValues.noiseFreq;
    this.waveSphereUniforms.uNoiseSpeed.value = this.activeValues.noiseSpeed;
    this.waveSphereUniforms.uPointSize.value = this.activeValues.pointSize;
    this.waveSphereUniforms.uStatePulse.value = (this.currentState === 'listening' || this.currentState === 'thinking') ? 1.0 : 0.0;

    // Update Inner Core Uniforms
    this.innerCoreUniforms.uTime.value = elapsedTime;
    this.innerCoreUniforms.uAudioBass.value = this.smoothAudio.bass;
    this.innerCoreUniforms.uAudioIntensity.value = this.smoothAudio.intensity;

    // Update Dust Uniforms
    this.dustUniforms.uTime.value = elapsedTime;
    this.dustUniforms.uAudioIntensity.value = this.smoothAudio.intensity;

    // Mouse parallax tracking
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    // Autonomous organic rotation + user drag inertia
    this.dragRotation.x *= 0.94;
    this.dragRotation.y *= 0.94;

    const baseRotation = this.activeValues.rotationSpeed * delta;
    this.waveSphereMesh.rotation.y += baseRotation * 0.7 + this.dragRotation.y;
    this.waveSphereMesh.rotation.x += baseRotation * 0.25 + this.dragRotation.x;

    this.innerCoreMesh.rotation.y -= baseRotation * 1.1;
    this.innerCoreMesh.rotation.z += baseRotation * 0.4;

    // Parallax tilt on the group
    this.orbGroup.rotation.y = this.mouse.x * 0.32;
    this.orbGroup.rotation.x = -this.mouse.y * 0.32;

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
