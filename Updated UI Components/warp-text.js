// <warp-text> — a plain-custom-element port of the OGL-based WarpText effect
// (liquid/refraction warp over rasterized text). Ported to fit this project's
// <x-import component-from-global-scope="..."> pattern (see floating-lines.js,
// drift-wall.js) instead of a React component. Shader source is unchanged.
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uRipple;
uniform float uMotion;

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

vec4 sampleText(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }
  return texture(uTextTexture, uv);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float time = uTime * uSpeed;
  float scale = max(uWarpScale, 0.001);

  vec2 drift = vec2(time * 0.055, -time * 0.045);
  float n1 = fbm(uv * scale * 3.1 + drift);
  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
  vec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.045 * uMotion;

  vec2 pointerDelta = uv - uPointer;
  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
  float dist = length(aspectDelta);
  float radius = max(uPointerInfluence, 0.001);
  float t = clamp(dist / radius, 0.0, 1.0);
  float lens = smoothstep(radius, 0.0, dist) * uPointerActive;
  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);

  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
  float rippleRing = (rippleWave - 0.5) * uRipple;
  vec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;
  pointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;

  vec2 displaced = uv + ambient + pointerWarp;
  vec2 splitDir = ambient + pointerWarp;
  float splitLen = length(splitDir);
  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);

  vec4 base = sampleText(displaced);
  float r = sampleText(displaced + split).r;
  float g = base.g;
  float b = sampleText(displaced - split).b;
  float a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);

  vec3 color = vec3(r, g, b) + lens * base.a * 0.055;
  fragColor = vec4(color, a);
}
`;

const getFontValue = (value) => (typeof value === 'number' ? `${value}px` : value);

function measureLine(ctx, line, letterSpacing) {
  const chars = Array.from(line);
  const textWidth = chars.reduce((width, char) => width + ctx.measureText(char).width, 0);
  return textWidth + Math.max(0, chars.length - 1) * letterSpacing;
}

function drawLine(ctx, line, x, y, letterSpacing) {
  const chars = Array.from(line);
  let cursor = x - measureLine(ctx, line, letterSpacing) / 2;
  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + (index === chars.length - 1 ? 0 : letterSpacing);
  });
}

function buildTextCanvas({ container, width, height, dpr, props }) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const probe = document.createElement('span');
  probe.textContent = props.text;
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'pre',
    inset: '0 auto auto 0',
    fontFamily: props.fontFamily,
    fontSize: getFontValue(props.fontSize),
    fontWeight: String(props.fontWeight),
    letterSpacing: getFontValue(props.letterSpacing),
    lineHeight: typeof props.lineHeight === 'number' ? String(props.lineHeight) : props.lineHeight
  });
  container.appendChild(probe);
  const computed = window.getComputedStyle(probe);
  let fontSizePx = parseFloat(computed.fontSize) || 96;
  const fontFamily = computed.fontFamily || 'sans-serif';
  const fontWeight = computed.fontWeight || String(props.fontWeight);
  let letterSpacing = computed.letterSpacing === 'normal' ? 0 : parseFloat(computed.letterSpacing) || 0;
  let lineHeight = parseFloat(computed.lineHeight);
  if (!Number.isFinite(lineHeight)) {
    lineHeight = fontSizePx * (typeof props.lineHeight === 'number' ? props.lineHeight : 0.92);
  }
  probe.remove();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = props.color;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const lines = String(props.text || '').split('\n');
  const applyFont = () => { ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`; };
  applyFont();

  const maxWidth = width * 0.86;
  const maxHeight = height * 0.78;
  const widest = Math.max(...lines.map((line) => measureLine(ctx, line, letterSpacing)), 1);
  const blockHeight = Math.max(lineHeight * lines.length, 1);
  const fit = Math.min(1, maxWidth / widest, maxHeight / blockHeight);

  if (fit < 1) {
    fontSizePx *= fit;
    letterSpacing *= fit;
    lineHeight *= fit;
    applyFont();
  }

  const startY = height / 2 - (lineHeight * (lines.length - 1)) / 2;
  lines.forEach((line, index) => drawLine(ctx, line, width / 2, startY + index * lineHeight, letterSpacing));

  return canvas;
}

// Reads back a small grid of pixels from the just-rendered frame and checks
// whether anything non-transparent actually landed on screen. Cheap (25
// single-pixel reads) and only ever runs once per rasterize.
function hasPaintedPixels(gl) {
  try {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    if (w <= 0 || h <= 0) return false;
    const px = new Uint8Array(4);
    for (let gy = 1; gy <= 5; gy++) {
      for (let gx = 1; gx <= 5; gx++) {
        const x = Math.min(w - 1, Math.floor((w * gx) / 6));
        const y = Math.min(h - 1, Math.floor((h * gy) / 6));
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (px[3] > 8) return true;
      }
    }
    return false;
  } catch (_) {
    // If readback itself isn't supported/allowed, don't block the reveal on
    // it — fall back to trusting that render() succeeded.
    return true;
  }
}

function syncUniforms(program, props) {
  const uniforms = program.uniforms;
  uniforms.uWarpStrength.value = props.warpStrength;
  uniforms.uWarpScale.value = props.warpScale;
  uniforms.uSpeed.value = props.speed;
  uniforms.uPointerInfluence.value = props.pointerInfluence;
  uniforms.uPointerStrength.value = props.pointerStrength;
  uniforms.uRefraction.value = props.refraction;
  uniforms.uRipple.value = props.ripple ? 1 : 0;
}

class WarpText extends HTMLElement {
  static get observedAttributes() {
    return ['text', 'color'];
  }

  // Reads an attribute trying every casing a host runtime might have
  // normalized it to. This project's dc-runtime camelCases hyphenated
  // x-import attrs (e.g. font-size -> fontSize) and then setAttribute()
  // forces that to lowercase per the HTML spec, so "font-size" actually
  // lands on the element as "fontsize" — check both forms plus the
  // originally-authored one so this works either way.
  // This project's runtime replaces <x-import> with its own host wrapper
  // div around the actual custom element, so the intended "plain text right
  // before this" sibling usually isn't a direct sibling of <warp-text> —
  // it's a sibling of that wrapper. Walk up through zero-width/positioned
  // wrapper ancestors until a real previous sibling turns up.
  findFallbackSibling() {
    let node = this;
    for (let i = 0; i < 4 && node; i++) {
      if (node.previousElementSibling) return node.previousElementSibling;
      node = node.parentElement;
    }
    return null;
  }

  attr(name) {
    const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const squished = name.replace(/-/g, '');
    return this.getAttribute(name) ?? this.getAttribute(camel) ?? this.getAttribute(squished);
  }

  readProps() {
    const num = (a, d) => {
      const v = this.attr(a);
      return v != null && v !== '' ? parseFloat(v) : d;
    };
    return {
      text: this.attr('text') ?? 'Bend the moment',
      color: this.attr('color') || '#f8f5ff',
      warpStrength: num('warp-strength', 0.08),
      warpScale: num('warp-scale', 1.7),
      speed: num('speed', 0.55),
      pointerInfluence: num('pointer-influence', 0.42),
      pointerStrength: num('pointer-strength', 0.38),
      refraction: num('refraction', 0.018),
      ripple: this.attr('ripple') !== 'false',
      fontSize: this.attr('font-size') || 'clamp(2rem, 5vw, 3.4rem)',
      fontWeight: num('font-weight', 700),
      fontFamily: this.attr('font-family') || 'inherit',
      letterSpacing: this.attr('letter-spacing') || '-0.02em',
      lineHeight: num('line-height', 1.25)
    };
  }

  connectedCallback() {
    if (this._started) return;
    this._started = true;

    // The host runtime applies the style="..." given on the <x-import> tag
    // to a wrapper div it creates around this element, not to this element
    // itself — so this can't rely on an inherited inset:0/100% from the
    // template and must size itself to fill that wrapper unconditionally,
    // or it collapses to a 0-height box (position:relative with only an
    // absolutely-positioned canvas child contributes nothing to height).
    this.style.display = 'block';
    this.style.position = 'absolute';
    this.style.inset = '0';
    this.style.width = '100%';
    this.style.height = '100%';

    let disposed = false;
    let contextLost = false;
    let visible = true;
    let pageVisible = !document.hidden;
    let reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let rasterVersion = 0;
    let raf = 0;

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, activeTarget: 0 };
    const startTime = performance.now();

    let renderer, gl, program, geometry, mesh, texture;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
      gl = renderer.gl;
    } catch (error) {
      // No WebGL2 here — leave the plain-text sibling (rendered by the page
      // itself, right before this element) as the only visible copy.
      console.warn('warp-text: WebGL could not be initialized, falling back to plain text.', error);
      this.style.display = 'none';
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.setAttribute('aria-hidden', 'true');
    this.appendChild(canvas);

    texture = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTextTexture: { value: texture },
        uResolution: { value: new Float32Array([1, 1]) },
        uPointer: { value: new Float32Array([0.5, 0.5]) },
        uPointerActive: { value: 0 },
        uTime: { value: 0 },
        uWarpStrength: { value: 0.08 },
        uWarpScale: { value: 1.7 },
        uSpeed: { value: 0.55 },
        uPointerInfluence: { value: 0.42 },
        uPointerStrength: { value: 0.38 },
        uRefraction: { value: 0.018 },
        uRipple: { value: 1 },
        uMotion: { value: reduceMotion ? 0 : 1 }
      }
    });
    mesh = new Mesh(gl, { geometry, program });

    const renderOnce = () => {
      if (disposed || contextLost) return;
      renderer.render({ scene: mesh });
    };

    const rasterize = async () => {
      const version = ++rasterVersion;
      if (document.fonts?.ready) {
        try { await document.fonts.ready; } catch (_) {}
      }
      if (disposed || contextLost || version !== rasterVersion) return;

      const rect = this.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const textCanvas = buildTextCanvas({ container: this, width: rect.width, height: rect.height, dpr, props: this.readProps() });
      texture.image = textCanvas;
      texture.needsUpdate = true;
      renderOnce();

      // Only take over from the plain-text fallback once a frame has
      // ACTUALLY painted something visible — sample a handful of points off
      // the real framebuffer rather than trusting that render() not throwing
      // means the text is on screen (a silent all-transparent frame, e.g.
      // from a font/canvas edge case, would otherwise hide the real text
      // behind nothing). If nothing painted, the fallback stays up and
      // we'll simply try the check again on the next rasterize.
      if (!this._revealed && hasPaintedPixels(gl)) {
        this._revealed = true;
        const fallback = this.findFallbackSibling();
        if (fallback) fallback.style.visibility = 'hidden';
      }
    };

    const resize = () => {
      if (disposed || contextLost) return;
      const rect = this.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(rect.width, rect.height);
      program.uniforms.uResolution.value[0] = gl.drawingBufferWidth;
      program.uniforms.uResolution.value[1] = gl.drawingBufferHeight;
      rasterize();
    };

    const onPointerMove = (event) => {
      if (event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.tx = (event.clientX - rect.left) / rect.width;
      pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
      pointer.activeTarget = 1;
    };
    const onPointerLeave = () => { pointer.activeTarget = 0; };

    const onContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible && visible && !raf) raf = requestAnimationFrame(loop);
      if (!pageVisible && raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onReducedMotion = (event) => {
      reduceMotion = event.matches;
      program.uniforms.uMotion.value = reduceMotion ? 0 : 1;
      renderOnce();
    };

    const loop = (now) => {
      if (disposed || contextLost) return;
      const elapsed = (now - startTime) * 0.001;
      const idleX = 0.5 + Math.sin(elapsed * 0.33) * 0.12;
      const idleY = 0.5 + Math.cos(elapsed * 0.27) * 0.1;
      const targetX = pointer.activeTarget > 0 ? pointer.tx : idleX;
      const targetY = pointer.activeTarget > 0 ? pointer.ty : idleY;
      const damping = pointer.activeTarget > 0 ? 0.12 : 0.035;

      pointer.x += (targetX - pointer.x) * damping;
      pointer.y += (targetY - pointer.y) * damping;
      pointer.active += ((pointer.activeTarget > 0 ? 1 : 0.18) - pointer.active) * 0.06;

      program.uniforms.uPointer.value[0] = pointer.x;
      program.uniforms.uPointer.value[1] = pointer.y;
      program.uniforms.uPointerActive.value = reduceMotion ? pointer.active * 0.35 : pointer.active;
      program.uniforms.uTime.value = reduceMotion ? 0 : elapsed;

      renderOnce();
      raf = requestAnimationFrame(loop);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(this);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && pageVisible && !raf) raf = requestAnimationFrame(loop);
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 });
    intersectionObserver.observe(this);

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    document.addEventListener('visibilitychange', onVisibility);
    mediaQuery?.addEventListener('change', onReducedMotion);

    syncUniforms(program, this.readProps());
    this._rasterize = rasterize;
    this._program = program;
    resize();
    raf = requestAnimationFrame(loop);

    this._cleanup = () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      mediaQuery?.removeEventListener('change', onReducedMotion);
      if (!contextLost) {
        try {
          if (texture?.texture) gl.deleteTexture(texture.texture);
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        } catch (_) {}
      }
    };
  }

  attributeChangedCallback() {
    if (!this._started) return;
    if (this._program) syncUniforms(this._program, this.readProps());
    if (this._rasterize) this._rasterize();
  }

  disconnectedCallback() { if (this._cleanup) this._cleanup(); }
}

if (!customElements.get('warp-text')) customElements.define('warp-text', WarpText);
