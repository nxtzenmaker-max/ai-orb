// src/shaders.js
// Custom GPU Shaders for 3D Particle Wave AI Orb (Magnific / Freepik Starlight Particle Sphere)

// 3D Simplex Noise GLSL implementation (Stefan Gustavson / Ashima Arts)
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

attribute float aScale;
attribute float aRandom;

varying vec3 vColor;
varying float vAlpha;
varying float vRim;
varying float vDisp;

void main() {
  vec3 p = position;
  vec3 n = normalize(position);
  
  float t = uTime * uNoiseSpeed;
  
  // 3-octave harmonic fluid noise waves for liquid organic motion
  float w1 = snoise(p * uNoiseFreq + vec3(t * 0.7, t * 0.5, t * 0.8));
  float w2 = snoise(p * (uNoiseFreq * 2.3) - vec3(t * 0.9, -t * 0.7, t * 1.1)) * 0.45;
  float w3 = snoise(p * (uNoiseFreq * 4.2) + vec3(t * 1.4)) * 0.22;
  
  // Dynamic audio reactivity: bass inflates, mid/high frequencies create ripples
  float audioDisp = (uAudioBass * 0.65 + uAudioIntensity * 0.45) * snoise(p * 3.2 + vec3(uTime * 3.0));
  float audioRipples = sin(p.y * 14.0 + uTime * 6.0) * (uAudioTreble * 0.22);
  
  float disp = (w1 + w2 + w3) * uDisplacementAmp + audioDisp * 0.38 + audioRipples;
  disp += uStatePulse * 0.2 * sin(uTime * 4.0 + p.y * 5.0);
  
  // Displace along surface normal
  vec3 displaced = p + n * disp;
  
  // Organic tangential swirl around the polar axis
  float swirl = (w1 * 0.08 + audioDisp * 0.06);
  displaced.x += -p.z * swirl;
  displaced.z += p.x * swirl;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // View vector & normal for rim calculation
  vec3 viewDir = normalize(-mvPosition.xyz);
  vec3 transformedNormal = normalize(normalMatrix * n);
  float rim = 1.0 - abs(dot(transformedNormal, viewDir));
  rim = pow(clamp(rim, 0.0, 1.0), 1.3);
  
  // Distance-based particle size attenuation
  float viewDist = max(0.1, -mvPosition.z);
  float size = (uPointSize * uPixelRatio * 260.0) / viewDist;
  
  // Particles on the outer silhouette are denser and slightly larger, creating the distinctive wavy halo from the reference image
  gl_PointSize = clamp(size * (aScale * 0.82 + rim * 0.6 + disp * 0.35), 1.0, 22.0);
  
  // Reference Image Color Palette:
  // Predominantly luminous starlight white/platinum with subtle chromatic highlights
  vec3 starlight = vec3(0.96, 0.98, 1.0);
  
  // Chromatic accent sheen on wave crests and silhouette rim
  vec3 chromatic = mix(uColorA, uColorB, clamp(disp * 1.5 + 0.5, 0.0, 1.0));
  chromatic = mix(chromatic, uColorC, rim * 0.7);
  
  vec3 finalColor = mix(starlight, chromatic, 0.18 + rim * 0.32 + uAudioIntensity * 0.42);
  
  vColor = finalColor;
  vRim = rim;
  vDisp = disp;
  vAlpha = clamp(0.55 + rim * 0.45 + disp * 0.3 + uAudioIntensity * 0.35, 0.25, 1.0);
}
`;

// Primary Particle Wave Sphere Fragment Shader
export const particleWaveSphereFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
varying float vRim;
varying float vDisp;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  // Crisp starlight core with radiant falloff
  float core = smoothstep(0.18, 0.0, dist);
  float softGlow = smoothstep(0.5, 0.02, dist);
  
  float alpha = (core * 0.75 + softGlow * 0.35) * vAlpha;
  
  // Brilliant glowing center for each starlight dot
  vec3 col = vColor + vec3(core * 0.55);
  
  gl_FragColor = vec4(col, alpha);
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
  
  float t = uTime * 0.35;
  float wave = snoise(p * 1.8 + vec3(t));
  float bassPunch = uAudioBass * 0.35;
  
  vec3 displaced = p + n * (wave * 0.12 + bassPunch);
  
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  float viewDist = max(0.1, -mvPosition.z);
  gl_PointSize = clamp((uPointSize * uPixelRatio * 180.0) / viewDist * aScale, 1.0, 14.0);
  
  vec3 coreWhite = vec3(0.92, 0.96, 1.0);
  vColor = mix(coreWhite, uCoreColor, 0.4 + uAudioBass * 0.4);
  vAlpha = clamp(0.4 + 0.5 * abs(wave) + uAudioIntensity * 0.4, 0.2, 0.95);
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
  
  float glow = smoothstep(0.5, 0.05, dist);
  gl_FragColor = vec4(vColor, glow * vAlpha * 0.7);
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
  gl_PointSize = aSize * (260.0 / -mvPosition.z) * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;
  
  vAlpha = clamp(0.3 + 0.6 * sin(uTime * 1.8 + aPhase), 0.15, 0.9);
}
`;

export const outerDustFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float glow = smoothstep(0.5, 0.0, dist);
  gl_FragColor = vec4(vColor, glow * vAlpha * 0.8);
}
`;
