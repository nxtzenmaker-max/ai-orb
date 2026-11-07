// src/shaders.js
// Custom GLSL Shaders for 3D AI Orb, Inner Core, Atmosphere, and Particle Field

// 3D Simplex Noise GLSL implementation (Ashima / Stefan Gustavson)
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

// 3-Octave Fractal Brownian Motion
float fbm(vec3 p, float freq, float speed, float time) {
  float v = 0.0;
  float a = 0.55;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 3; ++i) {
    v += a * snoise(p * freq + vec3(time * speed));
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}
`;

// Orb Vertex Shader
export const orbVertexShader = /* glsl */ `
${simplexNoiseGLSL}

uniform float uTime;
uniform float uAudioIntensity;
uniform float uAudioBass;
uniform float uAudioHigh;
uniform float uDisplacementAmp;
uniform float uNoiseFreq;
uniform float uNoiseSpeed;
uniform float uStatePulse;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;
varying float vNoise;

// Helper to get displacement at a given surface point
float getDisplacement(vec3 p, vec3 norm) {
  float baseNoise = fbm(p, uNoiseFreq, uNoiseSpeed, uTime);
  float highDetail = snoise(p * (uNoiseFreq * 2.8) - vec3(uTime * (uNoiseSpeed * 1.5))) * 0.35;
  
  // Audio deformation: bass inflates, mid/high creates ripples
  float audioRipples = sin(p.y * 6.0 + uTime * 4.0) * cos(p.x * 6.0 + uTime * 3.0) * (uAudioHigh * 0.35);
  float bassPunch = uAudioBass * 0.45;
  
  float disp = (baseNoise + highDetail + audioRipples) * (uDisplacementAmp + bassPunch * 0.5);
  disp += uStatePulse * 0.15 * sin(uTime * 3.0 + p.y * 4.0);
  return disp;
}

void main() {
  vec3 p = position;
  float disp = getDisplacement(p, normal);
  
  // Finite difference to calculate accurate displaced normal
  float eps = 0.02;
  vec3 tangent = normalize(abs(normal.y) < 0.99 ? cross(normal, vec3(0.0, 1.0, 0.0)) : cross(normal, vec3(1.0, 0.0, 0.0)));
  vec3 bitangent = cross(normal, tangent);
  
  vec3 pTangent = p + tangent * eps;
  vec3 pBitangent = p + bitangent * eps;
  
  float dispT = getDisplacement(pTangent, normal);
  float dispB = getDisplacement(pBitangent, normal);
  
  vec3 posDisplaced = p + normal * disp;
  vec3 posTDisplaced = pTangent + normal * dispT;
  vec3 posBDisplaced = pBitangent + normal * dispB;
  
  vec3 computedNormal = normalize(cross(posTDisplaced - posDisplaced, posBDisplaced - posDisplaced));
  
  vNormal = normalMatrix * computedNormal;
  vWorldNormal = normalize(mat3(modelMatrix) * computedNormal);
  
  vDisplacement = disp;
  vNoise = getDisplacement(p, normal);

  vec4 worldPos = modelMatrix * vec4(posDisplaced, 1.0);
  vWorldPosition = worldPos.xyz;
  
  vec4 mvPosition = viewMatrix * worldPos;
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Orb Fragment Shader
export const orbFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uAudioIntensity;
uniform float uAudioBass;
uniform float uAudioTreble;
uniform vec3 uColorBase;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorCore;
uniform float uFresnelPower;
uniform float uRoughness;

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;
varying float vNoise;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel effect (outer rim glow)
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
  
  // Grazing angle iridescence / chromatic shift
  vec3 iridCycle = 0.5 + 0.5 * cos(6.28318 * (fresnel * 1.2 + vec3(0.0, 0.33, 0.67) + uTime * 0.08));
  
  // Height/Displacement gradient mapping
  float normDisp = clamp(vDisplacement * 1.5 + 0.5, 0.0, 1.0);
  
  // Color palette interpolation
  vec3 surfaceColor = mix(uColorBase, uColorA, smoothstep(0.1, 0.55, normDisp));
  surfaceColor = mix(surfaceColor, uColorB, smoothstep(0.45, 0.85, normDisp));
  surfaceColor = mix(surfaceColor, uColorC, smoothstep(0.75, 1.1, normDisp + uAudioIntensity * 0.4));
  
  // Add iridescent rim shift
  surfaceColor = mix(surfaceColor, iridCycle * uColorB, fresnel * 0.65);
  
  // Deep pulsating core emission shining through translucent skin
  float corePulse = (1.0 - length(vDisplacement)) * 0.7 + (uAudioBass * 0.8);
  vec3 innerGlow = uColorCore * clamp(corePulse, 0.0, 1.5);
  
  // Specular highlights (pseudo-Blinn-Phong)
  vec3 lightDir1 = normalize(vec3(1.5, 2.0, 3.0));
  vec3 halfDir1 = normalize(lightDir1 + viewDir);
  float spec1 = pow(max(dot(normal, halfDir1), 0.0), 32.0 / uRoughness) * 0.8;
  
  vec3 lightDir2 = normalize(vec3(-2.0, -1.0, 2.0));
  vec3 halfDir2 = normalize(lightDir2 + viewDir);
  float spec2 = pow(max(dot(normal, halfDir2), 0.0), 16.0 / uRoughness) * 0.4;
  
  vec3 specular = (vec3(1.0, 1.0, 1.0) * spec1 + uColorA * spec2) * (1.0 + uAudioTreble * 1.2);

  // Atmospheric rim glow boost
  vec3 rimGlow = uColorB * pow(fresnel, 2.2) * (1.6 + uAudioIntensity * 2.0);

  // Final composition
  vec3 finalColor = surfaceColor * 0.65 + innerGlow * 0.45 + specular + rimGlow;
  
  // Output with subtle alpha for outer rim blending
  float alpha = clamp(0.92 + fresnel * 0.08, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

// Inner Core Shaders (Additive glowing central plasma star)
export const coreVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const coreFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uAudioBass;
uniform float uAudioIntensity;
uniform vec3 uCoreColor;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Inverted center glow: strongest at the center, softer at the edge
  float centerIntensity = max(dot(normal, viewDir), 0.0);
  float glow = pow(centerIntensity, 1.8) * (1.2 + uAudioBass * 1.5 + sin(uTime * 4.0) * 0.15);
  
  vec3 color = uCoreColor * glow * 1.5;
  gl_FragColor = vec4(color, clamp(glow * 0.9, 0.0, 1.0));
}
`;

// Atmospheric Halo / Corona Shaders
export const haloVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const haloFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uAudioIntensity;
uniform vec3 uHaloColor;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Soft outer atmospheric rim glow
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.5);
  float pulse = 1.0 + 0.3 * sin(uTime * 2.0) + uAudioIntensity * 1.2;
  
  vec3 color = uHaloColor * fresnel * pulse * 1.3;
  float alpha = smoothstep(0.0, 0.9, fresnel) * 0.65;
  
  gl_FragColor = vec4(color, alpha);
}
`;

// Starfield / Orbiting Particle Shader
export const particleVertexShader = /* glsl */ `
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
  
  // Spiral orbital rotation around Y and X axes
  float angle = uTime * aSpeed * 0.4 + aPhase;
  float r = length(position.xz);
  
  vec3 transformed = position;
  transformed.x = cos(angle) * r;
  transformed.z = sin(angle) * r;
  
  // Float up/down organically
  transformed.y += sin(uTime * 0.8 + aPhase) * 0.25;
  
  // Audio expansion push
  transformed += normalize(transformed) * (uAudioIntensity * 0.45);
  
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  
  // Attenuate point size by distance to camera
  gl_PointSize = aSize * (1.0 + uAudioIntensity * 1.0) * (300.0 / -mvPosition.z) * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;
  
  vAlpha = clamp(0.3 + 0.7 * sin(uTime * 2.0 + aPhase), 0.2, 1.0);
}
`;

export const particleFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Soft circular point sprite
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float glow = smoothstep(0.5, 0.0, dist);
  gl_FragColor = vec4(vColor, glow * vAlpha * 0.85);
}
`;
