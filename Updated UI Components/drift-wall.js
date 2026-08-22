(function () {
// <drift-wall> — react-bits DriftWall (Backgrounds/DriftWall) ported to a plain
// custom element, with video tiles added. Geometry, column factors, infinite
// track wrap, damped pointer parallax, hover lift and mask are the component's
// own logic, unchanged in behaviour.
//
// Items arrive as JSON on the `items-json` attribute:
//   [{ src, kind: 'image'|'video', title }]
// Changing the attribute rebuilds the wall in place.

const DW_CSS = `
:host { position:relative; display:block; width:100%; height:100%; overflow:hidden;
  perspective:var(--dw-perspective,1200px); perspective-origin:50% 50%;
  -webkit-mask-image:radial-gradient(ellipse 78% 82% at 50% 46%, #000 var(--dw-edge), transparent 100%), linear-gradient(to top, #000 var(--dw-edge), transparent 100%);
  -webkit-mask-composite:source-in;
  mask-image:radial-gradient(ellipse 78% 82% at 50% 46%, #000 var(--dw-edge), transparent 100%), linear-gradient(to top, #000 var(--dw-edge), transparent 100%);
  mask-composite:intersect; }
.plane { position:absolute; top:50%; left:50%; display:flex; flex-direction:row;
  transform-style:preserve-3d; cursor:pointer; transform-origin:50% 50%; will-change:transform; }
.col { position:relative; width:calc(var(--dw-tile-w) + var(--dw-gap)); transform-style:preserve-3d; }
.track { display:flex; flex-direction:column; will-change:transform; transform-style:preserve-3d; }
.tile { position:relative; display:block; width:100%; height:calc(var(--dw-tile-h) + var(--dw-gap));
  flex:0 0 auto; outline:none; transform-style:preserve-3d; border:none; padding:0; background:none; }
.inner { position:absolute; inset:calc(var(--dw-gap) / 2); display:block; border-radius:var(--dw-radius);
  overflow:hidden; background:#0b0b12; opacity:var(--dw-dim); transform:translateZ(0); pointer-events:none;
  transition:transform .42s cubic-bezier(.22,1,.36,1), opacity .42s cubic-bezier(.22,1,.36,1), box-shadow .42s cubic-bezier(.22,1,.36,1); }
.tile img, .tile video { width:100%; height:100%; object-fit:cover; display:block;
  filter:grayscale(var(--dw-gray)) saturate(.92); transition:filter .42s cubic-bezier(.22,1,.36,1);
  user-select:none; -webkit-user-drag:none; }
.overlay { position:absolute; inset:0; background:var(--dw-overlay); opacity:.42; pointer-events:none;
  transition:opacity .42s cubic-bezier(.22,1,.36,1); }
.badge { position:absolute; left:8px; bottom:8px; width:20px; height:20px; border-radius:99px;
  display:grid; place-items:center; color:#e8e6ee; background:rgba(0,0,0,.55);
  backdrop-filter:blur(4px); pointer-events:none; opacity:.85; }
.badge svg { width:11px; height:11px; }
.tile.is-active .inner, .tile:focus-visible .inner { opacity:1; transform:translateZ(var(--dw-lift));
  box-shadow:0 24px 60px -18px rgba(0,0,0,.7); }
.tile.is-active img, .tile.is-active video, .tile:focus-visible img, .tile:focus-visible video {
  filter:grayscale(0) saturate(1.05); }
.tile.is-active .overlay, .tile:focus-visible .overlay { opacity:0; }
.tile:focus-visible .inner { box-shadow:0 24px 60px -18px rgba(0,0,0,.7), 0 0 0 2px rgba(255,255,255,.9); }
`;

const PLAY = '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M228,128a12,12,0,0,1-5.86,10.31L84.14,222a12,12,0,0,1-18.14-10.3V44.32A12,12,0,0,1,84.14,34l138,83.66A12,12,0,0,1,228,128Z"/></svg>';

const columnFactor = (index, variance) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

class DriftWall extends HTMLElement {
  // Hosts that pass props through JSX lowercase attribute names and strip the
  // hyphens (`items-json` arrives as `itemsjson`), so every lookup checks both.
  static get observedAttributes() {
    return ['items-json', 'itemsjson', 'columns', 'speed', 'tile-width', 'tilewidth', 'tile-height', 'tileheight'];
  }

  _get(name) {
    if (this.hasAttribute(name)) return this.getAttribute(name);
    const flat = name.replace(/-/g, '');
    return this.hasAttribute(flat) ? this.getAttribute(flat) : null;
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = DW_CSS;
      this.shadowRoot.appendChild(style);
      this._plane = document.createElement('div');
      this._plane.className = 'plane';
      this.shadowRoot.appendChild(this._plane);
    }
    this._mounted = true;
    this._bind();
    this.build();
  }

  disconnectedCallback() {
    this._mounted = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    this.removeEventListener('pointermove', this._onMove);
    this.removeEventListener('pointerleave', this._onLeave);
  }

  attributeChangedCallback() { if (this._mounted) this.build(); }

  _num(attr, dflt) { const v = this._get(attr); return v === null ? dflt : parseFloat(v); }

  _bind() {
    if (this._bound) return;
    this._bound = true;
    this._pointer = { x: 0, y: 0 };
    this._damped = { x: 0, y: 0 };
    this._hoveredCol = -1;
    this._activeId = null;

    this._onMove = (e) => {
      const rect = this.getBoundingClientRect();
      if (!rect.width) return;
      if (!this._reduced) {
        this._pointer = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5
        };
      }
      const hit = this.shadowRoot.elementFromPoint
        ? this.shadowRoot.elementFromPoint(e.clientX, e.clientY)
        : null;
      const tile = hit && hit.closest ? hit.closest('[data-tile-id]') : null;
      if (!tile) return;
      const id = tile.dataset.tileId;
      if (id === this._activeId) return;
      if (this._activeEl) {
        this._activeEl.classList.remove('is-active');
        if (this._activeEl._video) this._activeEl._video.pause();
      }
      tile.classList.add('is-active');
      // Tiles never play. Video only runs in the opened viewer, so nothing on
      // the wall makes noise or motion until it's deliberately opened.
      this._activeEl = tile;
      this._activeId = id;
      this._hoveredCol = Number(tile.dataset.col);
    };

    this._onLeave = () => {
      this._pointer = { x: 0, y: 0 };
      this._hoveredCol = -1;
      this._activeId = null;
      if (this._activeEl) {
        this._activeEl.classList.remove('is-active');
        if (this._activeEl._video) this._activeEl._video.pause();
        this._activeEl = null;
      }
    };

    this.addEventListener('pointermove', this._onMove, { passive: true });
    this.addEventListener('pointerleave', this._onLeave);
  }

  build() {
    let items = [];
    try { items = JSON.parse(this._get('items-json') || '[]'); } catch (e) { items = []; }
    if (!items.length) return;

    this._reduced = reducedMotion();
    const columns = Math.max(1, Math.round(this._num('columns', 5)));
    const tileWidth = this._num('tile-width', 200);
    const tileHeight = this._num('tile-height', 132);
    const gap = this._num('gap', 18);
    const radius = this._num('radius', 14);
    const tilt = this._num('tilt', 16);
    const turn = this._num('turn', -14);
    const roll = this._num('roll', 0);
    const perspective = this._num('perspective', 1200);
    const depth = this._num('depth', 120);
    const speed = this._num('speed', 42);
    const variance = this._num('variance', 0.45);
    const parallax = this._num('parallax', 0.6);
    const lift = this._num('lift', 64);
    const fade = this._num('fade', 0.6);
    const dim = this._num('dim', 0.55);
    const grayscale = this._get('grayscale') === 'true';
    const overlayColor = this._get('overlay-color') || '#060010';
    const direction = this._get('direction') || 'up';

    const s = this.style;
    s.setProperty('--dw-tile-w', tileWidth + 'px');
    s.setProperty('--dw-tile-h', tileHeight + 'px');
    s.setProperty('--dw-gap', gap + 'px');
    s.setProperty('--dw-radius', radius + 'px');
    s.setProperty('--dw-perspective', perspective + 'px');
    s.setProperty('--dw-lift', lift + 'px');
    s.setProperty('--dw-dim', dim);
    s.setProperty('--dw-gray', grayscale ? 1 : 0);
    s.setProperty('--dw-overlay', overlayColor);
    s.setProperty('--dw-edge', Math.max(0, (1 - fade) * 100) + '%');

    const cols = Array.from({ length: columns }, () => []);
    // `_i` carries the item's index in the original list through the column
    // split, so a click can report which item was opened.
    items.forEach((it, i) => cols[i % columns].push(Object.assign({}, it, { _i: i })));
    const columnItems = cols.map(c => (c.length ? c : items.slice(0, 1)));

    const height = this.clientHeight || 600;
    const unit = tileHeight + gap;
    const meta = columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      return { copyHeight, copies: Math.max(2, Math.ceil((height * 1.6) / copyHeight) + 1) };
    });

    const dirSign = direction === 'up' ? 1 : -1;
    this._baseVel = columnItems.map((_, c) => {
      const alt = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * alt;
    });
    this._offsets = meta.map((m, c) => m.copyHeight * ((c * 0.37) % 1));
    this._vels = columnItems.map(() => 0);
    this._meta = meta;
    this._tilt = tilt; this._turn = turn; this._roll = roll;
    this._depth = depth; this._parallax = parallax;

    this._plane.textContent = '';
    this._tracks = [];
    columnItems.forEach((col, c) => {
      const colEl = document.createElement('div');
      colEl.className = 'col';
      const track = document.createElement('div');
      track.className = 'track';
      for (let copy = 0; copy < meta[c].copies; copy++) {
        col.forEach((item, idx) => track.appendChild(this._tile(item, c + '-' + copy + '-' + idx, c)));
      }
      colEl.appendChild(track);
      this._plane.appendChild(colEl);
      this._tracks.push(track);
    });

    if (!this._ro && typeof ResizeObserver !== 'undefined') {
      this._lastH = height;
      this._ro = new ResizeObserver(() => {
        if (Math.abs((this.clientHeight || 0) - this._lastH) < 40) return;
        if (this._resizeT) clearTimeout(this._resizeT);
        this._resizeT = setTimeout(() => this.build(), 220);
      });
      this._ro.observe(this);
    } else {
      this._lastH = height;
    }

    if (!this._raf) this._loop();
  }

  _tile(item, id, col) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', item.title || 'media');
    el.dataset.tileId = id;
    el.dataset.col = col;
    el.dataset.itemIndex = item._i == null ? -1 : item._i;

    // The wall is decorative but its tiles are real media. A click announces
    // itself past the shadow boundary so the host can open a viewer.
    el.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('tile-open', {
        detail: { index: Number(el.dataset.itemIndex), item: item },
        bubbles: true, composed: true
      }));
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });

    const inner = document.createElement('span');
    inner.className = 'inner';

    if (item.kind === 'video') {
      const v = document.createElement('video');
      v.src = item.src;
      v.muted = true;
      v.removeAttribute('autoplay');
      v.loop = true;
      v.playsInline = true;
      v.preload = 'metadata';
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      // Deliberately NOT autoplaying: the wall duplicates every column several
      // times to loop seamlessly, so autoplay would put dozens of simultaneous
      // decodes on the page. Tiles play when they come forward instead.
      inner.appendChild(v);
      el._video = v;
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      inner.appendChild(img);
    }

    const overlay = document.createElement('span');
    overlay.className = 'overlay';
    overlay.setAttribute('aria-hidden', 'true');
    inner.appendChild(overlay);

    if (item.kind === 'video') {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.innerHTML = PLAY;
      inner.appendChild(badge);
    }

    el.appendChild(inner);
    return el;
  }

  _loop() {
    let last = null;
    const step = (ts) => {
      if (!this._mounted) { this._raf = null; return; }
      if (last === null) last = ts;
      const dt = Math.min(0.05, Math.max(0, ts - last) / 1000);
      last = ts;

      const maxTilt = this._parallax * 8;
      const tx = this._pointer.x * maxTilt;
      const ty = -this._pointer.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      this._damped.x += (tx - this._damped.x) * damp;
      this._damped.y += (ty - this._damped.y) * damp;
      this._plane.style.transform =
        'translate(-50%, -50%) scale(1.18) rotateX(' + (this._tilt + this._damped.y) +
        'deg) rotateY(' + (this._turn + this._damped.x) + 'deg) rotateZ(' + this._roll +
        'deg) translateZ(' + -this._depth + 'px)';

      for (let c = 0; c < (this._tracks || []).length; c++) {
        const m = this._meta[c];
        if (!m) continue;
        const target = this._reduced ? 0 : this._baseVel[c] * (this._hoveredCol === c ? 0 : 1);
        const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
        this._vels[c] += (target - this._vels[c]) * ease;
        let next = (this._offsets[c] || 0) + this._vels[c] * dt;
        next = ((next % m.copyHeight) + m.copyHeight) % m.copyHeight;
        this._offsets[c] = next;
        this._tracks[c].style.transform = 'translate3d(0, ' + -next + 'px, 0)';
      }

      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }
}

if (!customElements.get('drift-wall')) customElements.define('drift-wall', DriftWall);

})();
