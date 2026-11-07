// src/orb.js
// 3D Point-Cloud Particle Wave AI Orb (Magnific / Freepik Starlight Particle Sphere)
import * as THREE from 'three';
import {
  particleWaveSphereVertexShader,
  particleWaveSphereFragmentShader,
  innerPointCoreVertexShader,
  innerPointCoreFragmentShader,
  outerDustVertexShader,
  outerDustFragmentShader,
  shockwaveRingVertexShader,
  shockwaveRingFragmentShader
} from './shaders.js';

// Color themes and animation profiles for each orb state
// Pristine starlight platinum/silver is the foundation, with rich state-based chromatic luminescence
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

    // Mobile Performance & Adaptive Resolution (Cap pixel ratio at 2.0)
    this.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2.0);
    this.currentPixelRatio = this.maxPixelRatio;
    this.fpsFrameCount = 0;
    this.lastFpsTimestamp = performance.now();

    // Camera & Zoom Control
    this.targetCameraDistance = 7.0;
    this.minCameraDist = 4.2;
    this.maxCameraDist = 10.5;

    // Device Orientation (Gyroscope / Tilt)
    this.gyro = {
      available: false,
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      permissionRequested: false
    };

    // Mouse / Touch Interaction & Momentum Physics
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isDragging = false;
    this.previousPointerPos = { x: 0, y: 0 };
    this.pointerVelocity = { x: 0, y: 0 };
    this.inertiaVelocity = { x: 0, y: 0 };
    this.lastPointerMoveTime = 0;
    this.lastTapTime = 0;
    this.shockwave = 0.0;

    // Luminous 3D Expanding Shockwave Rings & Physical Surface Ripple
    this.shockwaveRings = [];
    this.shockwaveProgress = 0.0;
    this.shockwaveIntensity = 0.0;
    this.shockwaveOrigin = new THREE.Vector3(0, 0, 1);

    // Multi-touch Pinch Tracking
    this.pinch = {
      active: false,
      lastDist: 0
    };

    this.clock = new THREE.Clock();

    this.initScene();
    this.initParticleWaveSphere();
    this.initInnerPointCore();
    this.initOuterDust();
    this.initShockwaveRings();
    this.initGyroscope();
    this.initEventListeners();
    this.animate();
  }

  // Haptic Feedback Tactile Engine
  triggerHaptic(pattern = 12) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Safe fallback for browsers/environments that restrict vibration
      }
    }
  }

  initScene() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, this.targetCameraDistance);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    this.container.appendChild(this.renderer.domElement);

    // Group for combined rotations, gyroscope tilt & parallax
    this.orbGroup = new THREE.Group();
    this.scene.add(this.orbGroup);
  }

  // 1. Primary Particle Wave Sphere (~35,000+ concentric starlight points)
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

      // Density scales with perimeter of latitude circle
      const pointsInRing = Math.max(1, Math.round(ringRadius * maxPointsPerRing));

      for (let p = 0; p < pointsInRing; p++) {
        const u = p / pointsInRing;
        // Small organic angular jitter to avoid rigid computer lines
        const thetaJitter = (Math.random() - 0.5) * 0.015;
        const theta = u * Math.PI * 2 + thetaJitter;

        const radialJitter = (Math.random() - 0.5) * 0.035;
        const curRadius = radius * (1.0 + radialJitter);

        const x = Math.sin(phi) * Math.cos(theta) * curRadius;
        const y = Math.cos(phi) * curRadius;
        const z = Math.sin(phi) * Math.sin(theta) * curRadius;

        positions.push(x, y, z);

        // Dot size variation: mixture of small stars and brighter crystalline focal stars
        const isBrightStar = Math.random() < 0.09;
        const scale = isBrightStar ? (1.35 + Math.random() * 0.75) : (0.75 + Math.random() * 0.45);
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
      uPixelRatio: { value: this.currentPixelRatio },
      uColorBase: { value: this.activeValues.colorBase },
      uColorA: { value: this.activeValues.colorA },
      uColorB: { value: this.activeValues.colorB },
      uColorC: { value: this.activeValues.colorC },
      uStatePulse: { value: 0.0 },
      uShockwaveProgress: { value: 0.0 },
      uShockwaveIntensity: { value: 0.0 },
      uShockwaveOrigin: { value: this.shockwaveOrigin }
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
      uPointSize: { value: 1.35 },
      uPixelRatio: { value: this.currentPixelRatio },
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
      uPixelRatio: { value: this.currentPixelRatio }
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

  // 4. Luminous Expanding 3D Shockwave Rings (Annular wavefront ripples)
  initShockwaveRings() {
    this.shockwaveGroup = new THREE.Group();
    this.scene.add(this.shockwaveGroup);

    const quadGeom = new THREE.PlaneGeometry(1.0, 1.0);

    for (let i = 0; i < 6; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: shockwaveRingVertexShader,
        fragmentShader: shockwaveRingFragmentShader,
        uniforms: {
          uRadius: { value: 0.1 },
          uOpacity: { value: 0.0 },
          uColor: { value: new THREE.Color('#00f0ff') }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(quadGeom, mat);
      mesh.visible = false;
      this.shockwaveGroup.add(mesh);

      this.shockwaveRings.push({
        mesh,
        material: mat,
        active: false,
        progress: 0.0,
        speed: 1.35,
        maxRadius: 8.8
      });
    }
  }

  // Spawn an expanding 3D Shockwave Ring wavefront
  spawnShockwaveRing(position, color) {
    const ring = this.shockwaveRings.find(r => !r.active) || this.shockwaveRings[0];
    ring.active = true;
    ring.progress = 0.0;
    ring.speed = 1.35;
    ring.mesh.visible = true;

    if (position) {
      ring.mesh.position.copy(position);
    } else {
      ring.mesh.position.set(0, 0, 0);
    }

    // Always orient ring plane parallel to camera viewport for cinematic projection
    ring.mesh.quaternion.copy(this.camera.quaternion);

    const ringColor = color || this.activeValues.colorA;
    ring.material.uniforms.uColor.value.copy(ringColor);
    ring.material.uniforms.uRadius.value = 0.2;
    ring.material.uniforms.uOpacity.value = 0.95;
  }

  // Screen-space pointer click burst ripple VFX
  spawnClickBurstRipple(clientX, clientY) {
    if (!clientX && !clientY) return;
    const ripple = document.createElement('div');
    ripple.className = 'click-shockwave-ring';
    ripple.style.left = `${clientX}px`;
    ripple.style.top = `${clientY}px`;

    const stateColors = {
      idle: '#00f0ff',
      listening: '#00f5d4',
      thinking: '#a855f7',
      speaking: '#f59e0b'
    };
    const col = stateColors[this.currentState] || '#00f0ff';
    ripple.style.setProperty('--shock-color', col);

    document.body.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 720);
  }

  // Update uniform pixel ratios across all particle shaders
  updateUniformPixelRatios(pr) {
    if (this.waveSphereUniforms) this.waveSphereUniforms.uPixelRatio.value = pr;
    if (this.innerCoreUniforms) this.innerCoreUniforms.uPixelRatio.value = pr;
    if (this.dustUniforms) this.dustUniforms.uPixelRatio.value = pr;
  }

  // Device Orientation (Gyroscope / Tilt)
  initGyroscope() {
    this.onDeviceOrientation = (e) => {
      if (e.beta === null || e.gamma === null) return;
      this.gyro.available = true;

      // gamma: left-to-right tilt in [-90, 90]
      // beta: front-to-back tilt in [-180, 180] (typical handheld phone angle is ~45-50 degrees)
      const gammaClamped = THREE.MathUtils.clamp(e.gamma, -45, 45);
      const betaClamped = THREE.MathUtils.clamp(e.beta - 45, -45, 45);

      this.gyro.targetX = (gammaClamped / 45) * 0.45;
      this.gyro.targetY = (betaClamped / 45) * 0.45;
    };

    if (typeof window !== 'undefined' && 'ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', this.onDeviceOrientation, { passive: true });
    }
  }

  // Request Gyroscope Permission (Required by iOS 13+ Safari on first interaction)
  requestGyroPermission() {
    if (this.gyro.permissionRequested) return;
    this.gyro.permissionRequested = true;

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', this.onDeviceOrientation, { passive: true });
          }
        })
        .catch(() => {});
    }
  }

  // Interactive mouse/touch tracking, pinch-to-zoom, and inertia flick physics
  initEventListeners() {
    this.onResize = () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2.0);
      this.currentPixelRatio = this.maxPixelRatio;
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(this.currentPixelRatio);
      this.updateUniformPixelRatios(this.currentPixelRatio);
    };
    window.addEventListener('resize', this.onResize);

    // Wheel zoom on desktop trackpad / mouse wheel
    this.onWheel = (e) => {
      const zoomDelta = e.deltaY * 0.004;
      this.targetCameraDistance = THREE.MathUtils.clamp(
        this.targetCameraDistance + zoomDelta,
        this.minCameraDist,
        this.maxCameraDist
      );
    };
    this.container.addEventListener('wheel', this.onWheel, { passive: true });

    // Pointer move handler (mouse & touch)
    const onPointerMove = (e) => {
      const isTouch = e.touches && e.touches.length > 0;

      // Handle multi-touch pinch-to-zoom
      if (isTouch && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        if (this.pinch.active) {
          const deltaDist = dist - this.pinch.lastDist;
          this.targetCameraDistance = THREE.MathUtils.clamp(
            this.targetCameraDistance - deltaDist * 0.015,
            this.minCameraDist,
            this.maxCameraDist
          );
        } else {
          this.pinch.active = true;
        }
        this.pinch.lastDist = dist;
        return;
      }

      this.pinch.active = false;

      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      this.mouse.targetX = (clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(clientY / window.innerHeight) * 2 + 1;

      if (this.isDragging) {
        const now = performance.now();
        const dt = Math.max(1, now - this.lastPointerMoveTime);

        const deltaX = clientX - this.previousPointerPos.x;
        const deltaY = clientY - this.previousPointerPos.y;

        // Direct 1:1 rotation tracking
        this.waveSphereMesh.rotation.y += deltaX * 0.005;
        this.waveSphereMesh.rotation.x += deltaY * 0.005;

        // Calculate velocity for silky inertia release flick
        this.pointerVelocity.x = (deltaX / dt) * 16.0;
        this.pointerVelocity.y = (deltaY / dt) * 16.0;

        this.previousPointerPos = { x: clientX, y: clientY };
        this.lastPointerMoveTime = now;
      }
    };

    // Pointer down handler
    const onPointerDown = (e) => {
      if (e.target.closest('#app-overlay') && !e.target.closest('#canvas-container')) {
        return;
      }

      // Request Gyroscope permission on mobile interaction
      this.requestGyroPermission();

      // Tactile click haptic feedback on touch
      this.triggerHaptic(12);

      const isTouch = e.touches && e.touches.length > 0;
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      // Project pointer to 3D sphere surface normal for spherical shockwave ripple
      const ndcX = (clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(clientY / window.innerHeight) * 2 + 1;
      const radSq = ndcX * ndcX + ndcY * ndcY;
      const contactZ = radSq < 1.0 ? Math.sqrt(1.0 - radSq) : 0.0;
      const contactNormal = new THREE.Vector3(ndcX, ndcY, contactZ).normalize();

      // Trigger 3D expanding shockwave ring & screen ripple burst
      this.triggerShockwave(contactNormal, 1.0, clientX, clientY);

      // Double tap detection for supercharged dual shockwave ripple
      const now = Date.now();
      if (now - this.lastTapTime < 320) {
        this.triggerShockwave(contactNormal, 1.5, clientX, clientY);
        this.triggerHaptic([15, 30, 20]);
      }
      this.lastTapTime = now;

      this.isDragging = true;
      this.inertiaVelocity = { x: 0, y: 0 };

      this.previousPointerPos = { x: clientX, y: clientY };
      this.pointerVelocity = { x: 0, y: 0 };
      this.lastPointerMoveTime = performance.now();

      if (isTouch && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        this.pinch.active = true;
        this.pinch.lastDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      }
    };

    // Pointer up handler (transfers velocity into celestial inertia flick)
    const onPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        // Transfer release flick momentum into inertia velocity
        const flickX = THREE.MathUtils.clamp(this.pointerVelocity.y * 0.0028, -0.15, 0.15);
        const flickY = THREE.MathUtils.clamp(this.pointerVelocity.x * 0.0028, -0.15, 0.15);
        this.inertiaVelocity = { x: flickX, y: flickY };
      }
      this.pinch.active = false;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);
  }

  // Trigger an acoustic shockwave ripple through particle lattice + 3D luminous rings + tactile thump
  triggerShockwave(originVec = null, intensity = 1.0, clientX = null, clientY = null) {
    this.shockwave = intensity;
    this.shockwaveProgress = 0.0;
    this.shockwaveIntensity = intensity;

    if (originVec) {
      this.shockwaveOrigin.copy(originVec);
    } else {
      this.shockwaveOrigin.set(0, 0, 1);
    }

    // Spawn 3D expanding luminous shockwave ring
    const spawnPos = originVec ? originVec.clone().multiplyScalar(2.15) : new THREE.Vector3(0, 0, 0);
    this.spawnShockwaveRing(spawnPos, this.activeValues.colorA);

    // Spawn screen click burst ripple if pointer coordinates provided
    if (clientX !== null && clientY !== null) {
      this.spawnClickBurstRipple(clientX, clientY);
    }

    this.triggerHaptic([20, 40]);
  }

  // Rhythmic starlight particle displacement pulse triggered synchronously on each uttered word
  pulseWord(word = '') {
    const len = word ? word.trim().length : 4;
    const intensity = Math.min(0.85, 0.32 + Math.min(len, 10) * 0.04);

    // Bump audio reactivity metrics for instantaneous visual response
    this.audioIntensity = Math.max(this.audioIntensity, intensity);
    this.audioBass = Math.max(this.audioBass, intensity * 0.95);
    this.audioTreble = Math.max(this.audioTreble, intensity * 0.75);

    // Light acoustic displacement ripple through the starlight particle wave
    this.shockwave = Math.max(this.shockwave, 0.28);

    // Subtle micro-haptic tick on mobile devices if supported
    if (intensity > 0.6) {
      this.triggerHaptic(8);
    }
  }

  // State transitions: idle, listening, thinking, speaking
  setState(stateName) {
    if (!STATE_PROFILES[stateName]) return;
    if (this.currentState !== stateName) {
      this.triggerHaptic([20, 40]);
    }
    this.currentState = stateName;
    this.targetProfile = { ...STATE_PROFILES[stateName] };
    this.shockwave = 0.85;
  }

  // Ingest real-time audio metrics from Web Audio API Analyser
  setAudioData({ intensity = 0, bass = 0, treble = 0 }) {
    this.audioIntensity = intensity;
    this.audioBass = bass;
    this.audioTreble = treble;
  }

  // Animation Loop & Real-Time Physics Integrator
  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    const now = performance.now();

    // 1. Dynamic FPS & Adaptive Resolution Check (Runs every 60 frames)
    this.fpsFrameCount++;
    if (this.fpsFrameCount % 60 === 0) {
      const elapsedSec = (now - this.lastFpsTimestamp) / 1000;
      const currentFps = 60 / Math.max(0.001, elapsedSec);
      this.lastFpsTimestamp = now;

      // Adaptively step down resolution if FPS dips under 42 (e.g. thermal throttling)
      if (currentFps < 42 && this.currentPixelRatio > 1.0) {
        this.currentPixelRatio = Math.max(1.0, this.currentPixelRatio - 0.25);
        this.renderer.setPixelRatio(this.currentPixelRatio);
        this.updateUniformPixelRatios(this.currentPixelRatio);
      } else if (currentFps > 58 && this.currentPixelRatio < this.maxPixelRatio) {
        this.currentPixelRatio = Math.min(this.maxPixelRatio, this.currentPixelRatio + 0.25);
        this.renderer.setPixelRatio(this.currentPixelRatio);
        this.updateUniformPixelRatios(this.currentPixelRatio);
      }
    }

    // 2. Camera Distance Smooth Lerping (Pinch / Wheel Zoom)
    this.camera.position.z += (this.targetCameraDistance - this.camera.position.z) * 0.08;

    // 3. Smooth Profile Interpolation
    const lerpSpeed = 0.065;
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

    // 4. Smooth Audio Reactivity
    const audioDamp = 0.16;
    this.smoothAudio.intensity = THREE.MathUtils.lerp(this.smoothAudio.intensity, this.audioIntensity, audioDamp);
    this.smoothAudio.bass = THREE.MathUtils.lerp(this.smoothAudio.bass, this.audioBass, audioDamp);
    this.smoothAudio.treble = THREE.MathUtils.lerp(this.smoothAudio.treble, this.audioTreble, audioDamp);

    // 5. Shockwave Propagation & Decay
    if (this.shockwave > 0.001) {
      this.shockwave *= 0.93;
    } else {
      this.shockwave = 0.0;
    }

    if (this.shockwaveIntensity > 0.005) {
      this.shockwaveProgress += delta * 1.85;
      this.shockwaveIntensity *= 0.94;
    } else {
      this.shockwaveIntensity = 0.0;
    }

    // Update 3D Expanding Shockwave Rings
    for (const ring of this.shockwaveRings) {
      if (!ring.active) continue;
      ring.progress += delta * ring.speed;
      if (ring.progress >= 1.0) {
        ring.active = false;
        ring.mesh.visible = false;
        continue;
      }
      const easedProgress = Math.pow(ring.progress, 0.72);
      const rad = THREE.MathUtils.lerp(0.8, ring.maxRadius, easedProgress);
      ring.material.uniforms.uRadius.value = rad;
      ring.material.uniforms.uOpacity.value = Math.pow(1.0 - ring.progress, 1.5) * 0.92;
    }

    // Organic breathing motion when idle
    const breathing = Math.sin(elapsedTime * 1.6) * 0.035;
    const finalDisplacement = this.activeValues.displacementAmp + breathing + this.shockwave * 0.35;

    // 6. Update Primary Wave Sphere Uniforms
    this.waveSphereUniforms.uTime.value = elapsedTime;
    this.waveSphereUniforms.uAudioIntensity.value = this.smoothAudio.intensity;
    this.waveSphereUniforms.uAudioBass.value = this.smoothAudio.bass;
    this.waveSphereUniforms.uAudioTreble.value = this.smoothAudio.treble;
    this.waveSphereUniforms.uDisplacementAmp.value = finalDisplacement;
    this.waveSphereUniforms.uNoiseFreq.value = this.activeValues.noiseFreq;
    this.waveSphereUniforms.uNoiseSpeed.value = this.activeValues.noiseSpeed;
    this.waveSphereUniforms.uPointSize.value = this.activeValues.pointSize;
    this.waveSphereUniforms.uStatePulse.value =
      (this.currentState === 'listening' || this.currentState === 'thinking') ? 1.0 : 0.0;
    this.waveSphereUniforms.uShockwaveProgress.value = this.shockwaveProgress;
    this.waveSphereUniforms.uShockwaveIntensity.value = this.shockwaveIntensity;
    this.waveSphereUniforms.uShockwaveOrigin.value.copy(this.shockwaveOrigin);

    // 7. Update Inner Core Uniforms
    this.innerCoreUniforms.uTime.value = elapsedTime;
    this.innerCoreUniforms.uAudioBass.value = this.smoothAudio.bass;
    this.innerCoreUniforms.uAudioIntensity.value = this.smoothAudio.intensity;

    // 8. Update Dust Uniforms
    this.dustUniforms.uTime.value = elapsedTime;
    this.dustUniforms.uAudioIntensity.value = this.smoothAudio.intensity;

    // 9. Mouse Parallax & Gyroscope Inertia Damping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.045;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.045;

    const gyroDamp = 0.05;
    this.gyro.currentX += (this.gyro.targetX - this.gyro.currentX) * gyroDamp;
    this.gyro.currentY += (this.gyro.targetY - this.gyro.currentY) * gyroDamp;

    // Combine Mouse Parallax and Gyroscope tilt on orb group
    this.orbGroup.rotation.y = this.mouse.x * 0.28 + this.gyro.currentX;
    this.orbGroup.rotation.x = -this.mouse.y * 0.28 + this.gyro.currentY;

    // 10. Autonomous Rotation + Friction-Damped Momentum Flick
    this.inertiaVelocity.x *= 0.94;
    this.inertiaVelocity.y *= 0.94;

    const baseRotation = this.activeValues.rotationSpeed * delta;
    this.waveSphereMesh.rotation.y += baseRotation * 0.7 + this.inertiaVelocity.y;
    this.waveSphereMesh.rotation.x += baseRotation * 0.25 + this.inertiaVelocity.x;

    this.innerCoreMesh.rotation.y -= baseRotation * 1.1;
    this.innerCoreMesh.rotation.z += baseRotation * 0.4;

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    window.removeEventListener('resize', this.onResize);
    if (this.onDeviceOrientation) {
      window.removeEventListener('deviceorientation', this.onDeviceOrientation);
    }
    if (this.onWheel) {
      this.container.removeEventListener('wheel', this.onWheel);
    }
    this.renderer.dispose();
  }
}
