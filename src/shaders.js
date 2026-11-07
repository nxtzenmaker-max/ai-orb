// src/shaders.js
// Custom GPU Shaders for 3D Particle Wave AI Orb (Magnific / Freepik Starlight Particle Sphere)

// 3D Simplex Noise & Divergence-Free Curl Noise GLSL implementation
export const simplexNoiseGLSL = /* glsl */ `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Incompressible Divergence-Free 3D Curl Noise Vector Field
// Evaluates the curl of a smooth potential vector field using finite differences
vec3 curlNoise(vec3 p) {
  const float e = 0.04;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  // Field phase offsets to avoid axial correlation
  vec3 o1 = vec3(12.34, 45.67, 78.91);
  vec3 o2 = vec3(31.41, 62.83, 15.72);
  vec3 o3 = vec3(98.76, 65.43, 32.19);

  float dFz_dy = snoise(p + dy + o3) - snoise(p - dy + o3);
  float dFy_dz = snoise(p + dz + o2) - snoise(p - dz + o2);

  float dFx_dz = snoise(p + dz + o1) - snoise(p - dz + o1);
  float dFz_dx = snoise(p + dx + o3) - snoise(p - dx + o3);

  float dFy_dx = snoise(p + dx + o2) - snoise(p - dx + o2);
  float dFx_dy = snoise(p + dy + o1) - snoise(p - dy + o1);

  return vec3(
    dFz_dy - dFy_dz,
    dFx_dz - dFz_dx,
    dFy_dx - dFx_dy
  ) / (2.0 * e);
}
`;

// Primary Particle Wave Sphere Vertex Shader
export const particleWaveSphereVertexShader = /* glsl */ `
${simplexNoiseGLSL}

uniform float uTime;
uniform float uAudioIntensity;
uniform float uAudioBass;
uniform float uAudioTreble;
uniform float uDisplacementAmp;
uniform float uNoiseFreq;
uniform float uNoiseSpeed;
uniform float uPointSize;
uniform float uPixelRatio;

uniform vec3 uColorBase;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uStatePulse;

// Dynamic Physical Shockwave Ripple Uniforms
uniform float uShockwaveProgress;
uniform float uShockwaveIntensity;
uniform vec3 uShockwaveOrigin;

attribute float aScale;
attribute float aRandom;

varying vec3 vColor;
varying vec3 vPrismColor;
varying float vDispersion;
varying float vAlpha;
varying float vRim;
varying float vDisp;

void main() {
  vec3 p = position;
  vec3 n = normalize(position);
  
  float t = uTime * uNoiseSpeed;
  
  // 1. Multi-frequency Harmonic Standing Waves & Fluid Resonances
  // Octave 1: Fundamental fluid wave
  float w1 = snoise(p * uNoiseFreq + vec3(t * 0.65, t * 0.45, t * 0.75));
  // Octave 2: Secondary harmonic resonance
  float w2 = snoise(p * (uNoiseFreq * 2.24) - vec3(t * 0.85, -t * 0.65, t * 1.05)) * 0.48;
  // Octave 3: High-frequency micro-undulation
  float w3 = snoise(p * (uNoiseFreq * 4.62) + vec3(t * 1.35)) * 0.24;
  // Octave 4: Ultra-fine crystalline ripple
  float w4 = snoise(p * (uNoiseFreq * 9.15) - vec3(t * 2.1)) * 0.11;

  // Spherical harmonic standing resonance modes (quantum orbital pulse)
  float phi = atan(p.z, p.x);
  float theta = acos(clamp(p.y / max(0.001, length(p)), -1.0, 1.0));
  float standingHarmonic = sin(phi * 4.0 + t * 1.8) * cos(theta * 5.0 - t * 1.2) * 0.14;
  float standingOvertone = cos(phi * 7.0 - t * 2.6) * sin(theta * 8.0 + t * 1.9) * 0.07;
  
  // Dynamic audio reactivity coupling
  float audioDisp = (uAudioBass * 0.75 + uAudioIntensity * 0.5) * snoise(p * 2.8 + vec3(uTime * 2.8));
  float audioRipples = sin(p.y * 16.0 + uTime * 7.0) * (uAudioTreble * 0.28);
  float stateShockPulse = uStatePulse * 0.25 * sin(uTime * 5.0 + p.y * 6.0);
  
  // Physical spherical shockwave ripple propagating across surface from contact point
  vec3 shockOrigin = length(uShockwaveOrigin) > 0.01 ? normalize(uShockwaveOrigin) : vec3(0.0, 0.0, 1.0);
  float distFromImpact = distance(n, shockOrigin);
  float waveFront = abs(distFromImpact - uShockwaveProgress * 2.3);
  float shockRipple = exp(-waveFront * waveFront * 28.0) * uShockwaveIntensity;

  // Combined radial scalar displacement
  float disp = (w1 + w2 + w3 + w4 + standingHarmonic + standingOvertone) * uDisplacementAmp 
             + audioDisp * 0.42 + audioRipples + stateShockPulse + shockRipple * 0.45;
  
  // 2. Incompressible Curl-Noise Vector Field Turbulence
  vec3 curlCoord = p * (uNoiseFreq * 0.95) + vec3(t * 0.35, t * 0.25, t * 0.4);
  vec3 curlVec = curlNoise(curlCoord);

  // Project curl vector onto the sphere tangent plane: C_tangent = C - n * dot(n, C)
  vec3 curlTangent = curlVec - n * dot(n, curlVec);

  // Tangential plasma vortex swirl driven by curl noise + audio
  float curlIntensity = (0.12 + uAudioIntensity * 0.18 + uAudioBass * 0.15) * uDisplacementAmp;
  vec3 displaced = p + n * disp + curlTangent * curlIntensity;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // View vector & normal for silhouette rim & volumetric depth falloff calculation
  vec3 viewDir = normalize(-mvPosition.xyz);
  vec3 transformedNormal = normalize(normalMatrix * n);
  float normalDotView = dot(transformedNormal, viewDir);
  
  float rim = 1.0 - abs(normalDotView);
  rim = pow(clamp(rim, 0.0, 1.0), 1.25);

  // Volumetric Stereoscopic Depth Falloff:
  // Front hemisphere faces camera with pristine crystalline brilliance.
  // Back hemisphere recedes gently into cosmic velvet darkness, creating breathtaking 3D volume.
  float depthFalloff = smoothstep(-0.35, 0.45, normalDotView);
  
  // Distance-based particle size attenuation
  float viewDist = max(0.1, -mvPosition.z);
  float size = (uPointSize * uPixelRatio * 270.0) / viewDist;
  
  // Outer silhouette, wave crests, and shockwave pulses expand particle sizes
  float crestBoost = smoothstep(0.0, 0.4, disp) * 0.5;
  float shockScale = shockRipple * 0.6;
  gl_PointSize = clamp(size * (aScale * 0.85 + rim * 0.65 + crestBoost * 0.45 + shockScale), 1.0, 28.0);
  
  // 3. Chromatic Starlight Dispersion:
  // At wave crests & shockwave wavefronts, refractive starlight splits into a crisp prism spectrum
  float dispNormalized = clamp((disp / max(0.01, uDisplacementAmp * 1.5)) * 0.5 + 0.5, 0.0, 1.0);
  float crest = pow(dispNormalized, 2.2);

  // Spectral dispersion colors (Prism spectrum)
  vec3 spectralViolet = vec3(0.68, 0.38, 1.0);
  vec3 spectralCyan   = vec3(0.05, 0.92, 1.0);
  vec3 spectralEmerald= vec3(0.12, 1.0, 0.78);
  vec3 spectralAmber  = vec3(1.0, 0.76, 0.28);
  vec3 spectralRose   = vec3(1.0, 0.28, 0.62);

  // Multi-band chromatic dispersion across wave gradient
  vec3 prismA = mix(spectralCyan, spectralViolet, smoothstep(0.2, 0.6, dispNormalized));
  vec3 prismB = mix(spectralEmerald, spectralRose, smoothstep(0.5, 0.9, crest));
  vec3 prismFinal = mix(prismA, prismB, rim * 0.6 + uAudioTreble * 0.4 + shockRipple * 0.4);

  // Theme chromatic accents
  vec3 themeSheen = mix(uColorA, uColorB, dispNormalized);
  themeSheen = mix(themeSheen, uColorC, rim * 0.75);

  // Purest luminous starlight platinum core
  vec3 starlightBase = vec3(0.97, 0.985, 1.0);

  // Blend starlight platinum core with chromatic prism dispersion
  float dispersionAmount = 0.20 + crest * 0.45 + rim * 0.35 + shockRipple * 0.65 + uAudioIntensity * 0.35;
  vec3 finalColor = mix(starlightBase, mix(themeSheen, prismFinal, 0.45), clamp(dispersionAmount, 0.0, 0.95));

  // Front particles are bright; back particles softly attenuated for deep stereoscopic 3D volume
  float alphaAtten = 0.38 + depthFalloff * 0.62;
  vColor = finalColor;
  vPrismColor = prismFinal;
  vDispersion = crest + shockRipple * 0.6;
  vRim = rim;
  vDisp = disp;
  vAlpha = clamp((0.55 + rim * 0.45 + crest * 0.3 + shockRipple * 0.45 + uAudioIntensity * 0.35) * alphaAtten, 0.14, 1.0);
}
`;

// Primary Particle Wave Sphere Fragment Shader
export const particleWaveSphereFragmentShader = /* glsl */ `
varying vec3 vColor;
varying vec3 vPrismColor;
varying float vDispersion;
varying float vAlpha;
varying float vRim;
varying float vDisp;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  // Crisp sub-pixel anti-aliasing via analytical screen-space derivatives
  float delta = fwidth(dist);
  float circleAlpha = 1.0 - smoothstep(0.5 - max(0.015, delta * 1.5), 0.5, dist);

  // 1. Ultra-sharp Crystalline Diamond Core
  float sharpCore = exp(-dist * 16.0) * 1.5;
  float diamond = max(0.0, 1.0 - (abs(coord.x) + abs(coord.y)) * 2.8);
  float crystallineCore = sharpCore + diamond * 0.45;

  // 2. Optical 4-point Micro Diffraction Spikes on luminous stars
  float spikeX = exp(-abs(coord.x) * 38.0) * exp(-abs(coord.y) * 4.5);
  float spikeY = exp(-abs(coord.y) * 38.0) * exp(-abs(coord.x) * 4.5);
  float diffraction = (spikeX + spikeY) * (0.35 + vDispersion * 0.35);

  // 3. Multi-tier Radiant Halo
  float innerGlow = smoothstep(0.42, 0.06, dist);
  float outerHalo = exp(-dist * 4.2) * (1.0 - smoothstep(0.40, 0.50, dist));

  // Chromatic dispersion fringe at outer halo periphery
  float haloWeight = innerGlow * 0.65 + outerHalo * 0.5;
  vec3 haloColor = mix(vColor, vPrismColor, smoothstep(0.15, 0.45, dist) * vDispersion * 0.85);

  // Composite starlight color: crystalline core is blazing platinum-white, halo glows with chromatic dispersion
  vec3 col = haloColor * haloWeight + vec3(1.0, 1.0, 1.0) * (crystallineCore + diffraction * 0.8);

  // Final smoothed alpha with crisp sub-pixel anti-aliasing
  float alpha = (crystallineCore * 0.85 + haloWeight * 0.55 + diffraction * 0.3) * vAlpha * circleAlpha;

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

// Inner Dense Point Core Vertex Shader
export const innerPointCoreVertexShader = /* glsl */ `
${simplexNoiseGLSL}

uniform float uTime;
uniform float uAudioBass;
uniform float uAudioIntensity;
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCoreColor;

attribute float aScale;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  vec3 n = normalize(position);
  
  float t = uTime * 0.45;
  float wave = snoise(p * 2.2 + vec3(t * 0.8, -t * 0.6, t));
  float wave2 = snoise(p * 4.4 - vec3(t * 1.2)) * 0.35;
  float bassPunch = uAudioBass * 0.45;
  
  // Dense core breathing and expansion
  vec3 displaced = p + n * ((wave + wave2) * 0.14 + bassPunch);
  
  // Tangential vortex rotation in core
  float vortex = (wave * 0.08 + uAudioBass * 0.12);
  displaced.x += -p.z * vortex;
  displaced.z += p.x * vortex;
  
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  float viewDist = max(0.1, -mvPosition.z);
  gl_PointSize = clamp((uPointSize * uPixelRatio * 200.0) / viewDist * aScale, 1.0, 16.0);
  
  vec3 coreWhite = vec3(0.96, 0.98, 1.0);
  vColor = mix(coreWhite, uCoreColor, 0.35 + uAudioBass * 0.45);
  vAlpha = clamp(0.45 + 0.5 * abs(wave) + uAudioIntensity * 0.45, 0.25, 0.98);
}
`;

// Inner Dense Point Core Fragment Shader
export const innerPointCoreFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float circleAlpha = 1.0 - smoothstep(0.44, 0.50, dist);
  float core = exp(-dist * 14.0) * 1.4;
  float glow = smoothstep(0.48, 0.05, dist);
  
  vec3 col = vColor + vec3(core * 0.6);
  float alpha = (core * 0.7 + glow * 0.4) * vAlpha * circleAlpha;
  
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

// Ambient Star Dust / Orbiting Motes Vertex Shader
export const outerDustVertexShader = /* glsl */ `
uniform float uTime;
uniform float uAudioIntensity;
uniform float uPixelRatio;

attribute float aSize;
attribute float aSpeed;
attribute float aPhase;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;
  
  float angle = uTime * aSpeed * 0.3 + aPhase;
  float r = length(position.xz);
  
  vec3 transformed = position;
  transformed.x = cos(angle) * r;
  transformed.z = sin(angle) * r;
  transformed.y += sin(uTime * 0.6 + aPhase) * 0.22;
  
  transformed += normalize(transformed) * (uAudioIntensity * 0.35);
  
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_PointSize = aSize * (270.0 / -mvPosition.z) * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;
  
  vAlpha = clamp(0.35 + 0.6 * sin(uTime * 1.8 + aPhase), 0.15, 0.95);
}
`;

export const outerDustFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float circleAlpha = 1.0 - smoothstep(0.44, 0.50, dist);
  float core = exp(-dist * 12.0) * 1.2;
  float glow = smoothstep(0.5, 0.0, dist);
  
  vec3 col = vColor + vec3(core * 0.5);
  float alpha = (core * 0.6 + glow * 0.5) * vAlpha * circleAlpha;
  
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

// Expanding Luminous 3D Shockwave Ring Shader
export const shockwaveRingVertexShader = /* glsl */ `
uniform float uRadius;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vec3 displaced = position * uRadius;
  vPosition = displaced;
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const shockwaveRingFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  // Compute distance from center of annular ring quad
  float dist = length(vUv - vec2(0.5));
  float ringCenter = 0.40;
  float ringWidth = 0.085;
  float ringDist = abs(dist - ringCenter);
  
  if (ringDist > ringWidth) discard;

  // Luminous Gaussian profile across shockwave ring thickness
  float crest = 1.0 - smoothstep(0.0, ringWidth, ringDist);
  crest = pow(crest, 2.0);

  // Intense starlight platinum core with chromatic rainbow fringe
  vec3 starlightCore = vec3(0.98, 0.99, 1.0);
  vec3 finalColor = mix(uColor, starlightCore, crest * 0.75);

  float alpha = crest * uOpacity;
  gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
}
`;
