// src/orb.js
import * as THREE from 'three';
import {
  orbVertexShader,
  orbFragmentShader,
  coreVertexShader,
  coreFragmentShader,
  haloVertexShader,
  haloFragmentShader,
  particleVertexShader,
  particleFragmentShader
} from './shaders.js';

// Color themes and animation profiles for each orb state
const STATE_PROFILES = {
  idle: {
    colorBase: new THREE.Color('#030614'),
    colorA: new THREE.Color('#00f0ff'), // Electric cyan
    colorB: new THREE.Color('#7928ca'), // Deep violet
    colorC: new THREE.Color('#0070f3'), // Sapphire blue
    colorCore: new THREE.Color('#38bdf8'),
    haloColor: new THREE.Color('#0ea5e9'),
    displacementAmp: 0.16,
    noiseFreq: 0.75,
    noiseSpeed: 0.35,
    fresnelPower: 2.2,
    pulseSpeed: 1.0,
    rotationSpeed: 0.25
  },
  listening: {
    colorBase: new THREE.Color('#02141e'),
    colorA: new THREE.Color('#00f5d4'), // Mint cyan
    colorB: new THREE.Color('#00bbf9'), // Vibrant azure
    colorC: new THREE.Color('#38bdf8'), // Sky blue
    colorCore: new THREE.Color('#22d3ee'),
    haloColor: new THREE.Color('#06b6d4'),
    displacementAmp: 0.28,
    noiseFreq: 1.35,
    noiseSpeed: 0.85,
    fresnelPower: 1.8,
    pulseSpeed: 2.2,
    rotationSpeed: 0.55
  },
  thinking: {
    colorBase: new THREE.Color('#10041d'),
    colorA: new THREE.Color('#a855f7'), // Electric purple
    colorB: new THREE.Color('#ec4899'), // Vivid magenta
    colorC: new THREE.Color('#f59e0b'), // Warm amber highlight
    colorCore: new THREE.Color('#d946ef'),
    haloColor: new THREE.Color('#c084fc'),
    displacementAmp: 0.32,
    noiseFreq: 1.9,
    noiseSpeed: 1.3,
    fresnelPower: 1.9,
    pulseSpeed: 2.8,
    rotationSpeed: 0.95
  },
  speaking: {
    colorBase: new THREE.Color('#08031a'),
    colorA: new THREE.Color('#06b6d4'), // Cyan
    colorB: new THREE.Color('#ec4899'), // Magenta
    colorC: new THREE.Color('#f59e0b'), // Gold
    colorCore: new THREE.Color('#fbbf24'), // Golden amber
    haloColor: new THREE.Color('#e879f9'),
    displacementAmp: 0.35,
    noiseFreq: 1.25,
    noiseSpeed: 0.75,
    fresnelPower: 1.6,
    pulseSpeed: 2.0,
    rotationSpeed: 0.45
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
      haloColor: STATE_PROFILES.idle.haloColor.clone(),
      displacementAmp: STATE_PROFILES.idle.displacementAmp,
      noiseFreq: STATE_PROFILES.idle.noiseFreq,
      noiseSpeed: STATE_PROFILES.idle.noiseSpeed,
      fresnelPower: STATE_PROFILES.idle.fresnelPower,
      pulseSpeed: STATE_PROFILES.idle.pulseSpeed,
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
    this.initOrb();
    this.initInnerCore();
    this.initAtmosphere();
    this.initParticleField();
    this.initEventListeners();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // Group for all orb elements to allow unified rotation/tilting
    this.orbGroup = new THREE.Group();
    this.scene.add(this.orbGroup);
  }

  initOrb() {
    // High-subdivision Icosahedron for smooth procedural noise deformations
    const geometry = new THREE.IcosahedronGeometry(2.0, 64);

    this.orbUniforms = {
      uTime: { value: 0.0 },
      uAudioIntensity: { value: 0.0 },
      uAudioBass: { value: 0.0 },
      uAudioTreble: { value: 0.0 },
      uAudioHigh: { value: 0.0 },
      uDisplacementAmp: { value: this.activeValues.displacementAmp },
      uNoiseFreq: { value: this.activeValues.noiseFreq },
      uNoiseSpeed: { value: this.activeValues.noiseSpeed },
      uStatePulse: { value: 0.0 },
      uFresnelPower: { value: this.activeValues.fresnelPower },
      uRoughness: { value: 0.35 },
      uColorBase: { value: this.activeValues.colorBase },
      uColorA: { value: this.activeValues.colorA },
      uColorB: { value: this.activeValues.colorB },
      uColorC: { value: this.activeValues.colorC },
      uColorCore: { value: this.activeValues.colorCore }
    };

    this.orbMaterial = new THREE.ShaderMaterial({
      vertexShader: orbVertexShader,
      fragmentShader: orbFragmentShader,
      uniforms: this.orbUniforms,
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide
    });

    this.orbMesh = new THREE.Mesh(geometry, this.orbMaterial);
    this.orbGroup.add(this.orbMesh);
  }

  initInnerCore() {
    const geometry = new THREE.IcosahedronGeometry(1.2, 32);

    this.coreUniforms = {
      uTime: { value: 0.0 },
      uAudioBass: { value: 0.0 },
      uAudioIntensity: { value: 0.0 },
      uCoreColor: { value: this.activeValues.colorCore }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: this.coreUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.coreMesh = new THREE.Mesh(geometry, material);
    this.orbGroup.add(this.coreMesh);
  }

  initAtmosphere() {
    const geometry = new THREE.IcosahedronGeometry(2.6, 32);

    this.haloUniforms = {
      uTime: { value: 0.0 },
      uAudioIntensity: { value: 0.0 },
      uHaloColor: { value: this.activeValues.haloColor }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      uniforms: this.haloUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.haloMesh = new THREE.Mesh(geometry, material);
    this.orbGroup.add(this.haloMesh);
  }

  initParticleField() {
    const count = 1400;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    const palette = [
      new THREE.Color('#00f0ff'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#f59e0b')
    ];

    for (let i = 0; i < count; i++) {
      // Distribute particles in a spherical shell around the orb (radius 2.3 - 5.5)
      const radius = 2.3 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 2.0 + Math.random() * 3.8;
      speeds[i] = 0.2 + Math.random() * 0.8;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.particleUniforms = {
      uTime: { value: 0.0 },
      uAudioIntensity: { value: 0.0 },
      uPixelRatio: { value: this.renderer.getPixelRatio() }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: this.particleUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particlePoints = new THREE.Points(geometry, material);
    this.orbGroup.add(this.particlePoints);
  }

  initEventListeners() {
    // Parallax mouse movement tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.dragRotation.y += deltaX * 0.006;
        this.dragRotation.x += deltaY * 0.006;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // Touch and mouse drag for 3D orb spinning
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Mobile touch interaction
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.dragRotation.y += deltaX * 0.008;
        this.dragRotation.x += deltaY * 0.008;

        this.previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Interactive Shockwave Pulse on Click
    this.container.addEventListener('click', (e) => {
      // Small pulse ripple
      this.triggerShockwave();
    });

    // Resize handling
    window.addEventListener('resize', () => this.onResize());
  }

  triggerShockwave() {
    this.shockwave = 1.0;
  }

  setState(state) {
    if (!STATE_PROFILES[state]) return;
    this.currentState = state;
    this.targetProfile = STATE_PROFILES[state];
  }

  setAudioData({ intensity = 0, bass = 0, treble = 0 }) {
    this.audioIntensity = intensity;
    this.audioBass = bass;
    this.audioTreble = treble;
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.particleUniforms) {
      this.particleUniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    }
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth lerp state transitions (colors & physics params)
    const lerpSpeed = 0.06;
    this.activeValues.colorBase.lerp(this.targetProfile.colorBase, lerpSpeed);
    this.activeValues.colorA.lerp(this.targetProfile.colorA, lerpSpeed);
    this.activeValues.colorB.lerp(this.targetProfile.colorB, lerpSpeed);
    this.activeValues.colorC.lerp(this.targetProfile.colorC, lerpSpeed);
    this.activeValues.colorCore.lerp(this.targetProfile.colorCore, lerpSpeed);
    this.activeValues.haloColor.lerp(this.targetProfile.haloColor, lerpSpeed);

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
    this.activeValues.fresnelPower = THREE.MathUtils.lerp(
      this.activeValues.fresnelPower,
      this.targetProfile.fresnelPower,
      lerpSpeed
    );
    this.activeValues.rotationSpeed = THREE.MathUtils.lerp(
      this.activeValues.rotationSpeed,
      this.targetProfile.rotationSpeed,
      lerpSpeed
    );

    // Smooth audio reactivity to prevent abrupt jumps
    const audioDamp = 0.14;
    this.smoothAudio.intensity = THREE.MathUtils.lerp(this.smoothAudio.intensity, this.audioIntensity, audioDamp);
    this.smoothAudio.bass = THREE.MathUtils.lerp(this.smoothAudio.bass, this.audioBass, audioDamp);
    this.smoothAudio.treble = THREE.MathUtils.lerp(this.smoothAudio.treble, this.audioTreble, audioDamp);

    // Shockwave attenuation
    if (this.shockwave > 0.001) {
      this.shockwave *= 0.93;
    } else {
      this.shockwave = 0.0;
    }

    // Gentle organic breathing wave when idle
    const breathing = Math.sin(elapsedTime * 1.8) * 0.04;
    const finalDisplacement = this.activeValues.displacementAmp + breathing + this.shockwave * 0.35;

    // Update orb uniforms
    this.orbUniforms.uTime.value = elapsedTime;
    this.orbUniforms.uAudioIntensity.value = this.smoothAudio.intensity;
    this.orbUniforms.uAudioBass.value = this.smoothAudio.bass;
    this.orbUniforms.uAudioTreble.value = this.smoothAudio.treble;
    this.orbUniforms.uAudioHigh.value = this.smoothAudio.treble;
    this.orbUniforms.uDisplacementAmp.value = finalDisplacement;
    this.orbUniforms.uNoiseFreq.value = this.activeValues.noiseFreq;
    this.orbUniforms.uNoiseSpeed.value = this.activeValues.noiseSpeed;
    this.orbUniforms.uFresnelPower.value = this.activeValues.fresnelPower;
    this.orbUniforms.uStatePulse.value = (this.currentState === 'listening' || this.currentState === 'thinking') ? 1.0 : 0.0;

    // Update core uniforms
    this.coreUniforms.uTime.value = elapsedTime;
    this.coreUniforms.uAudioBass.value = this.smoothAudio.bass;
    this.coreUniforms.uAudioIntensity.value = this.smoothAudio.intensity;

    // Update halo uniforms
    this.haloUniforms.uTime.value = elapsedTime;
    this.haloUniforms.uAudioIntensity.value = this.smoothAudio.intensity;

    // Update particle uniforms
    this.particleUniforms.uTime.value = elapsedTime;
    this.particleUniforms.uAudioIntensity.value = this.smoothAudio.intensity;

    // Mouse parallax tracking with spring damping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    // Autonomous slow rotation + drag inertia
    this.dragRotation.x *= 0.95;
    this.dragRotation.y *= 0.95;

    const baseRotation = this.activeValues.rotationSpeed * delta;
    this.orbMesh.rotation.y += baseRotation * 0.8 + this.dragRotation.y;
    this.orbMesh.rotation.x += baseRotation * 0.3 + this.dragRotation.x;

    this.coreMesh.rotation.y -= baseRotation * 1.2;
    this.coreMesh.rotation.z += baseRotation * 0.5;

    // Parallax tilt on the whole orb group
    this.orbGroup.rotation.y = this.mouse.x * 0.35;
    this.orbGroup.rotation.x = -this.mouse.y * 0.35;

    // Render frame
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
