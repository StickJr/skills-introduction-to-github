import {
  ENVIRONMENTS, getEnv, makeStamp, drawBrushCurve, drawBrushDot,
  rand, randHue, vivid, TAU,
} from './environments.js';
import * as album from './album-db.js';
import * as sound from './audio.js';

const $ = (s) => document.querySelector(s);
const screens = { home: $('#home'), paint: $('#paint'), album: $('#album') };

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

/* ---------- toast ---------- */

let toastTimer = 0;
let lastToast = { text: '', at: 0 };
function toast(text, ms = 1600) {
  const now = performance.now();
  if (text === lastToast.text && now - lastToast.at < 2500) return;
  lastToast = { text, at: now };
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/* ---------- hold-to-press buttons ----------
 * Grown-up buttons (exit, new page, save, delete) need a press-and-hold, so a
 * toddler's frantic tapping doesn't trigger them by accident.
 */
function holdButton(el, ms, onDone, hint) {
  let id = null, start = 0, raf = 0;
  const reset = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    id = null;
    el.style.setProperty('--p', 0);
    el.classList.remove('holding');
  };
  const tick = (now) => {
    const p = Math.min(1, (now - start) / ms);
    el.style.setProperty('--p', p);
    if (p >= 1) {
      reset();
      onDone();
    } else {
      raf = requestAnimationFrame(tick);
    }
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (id !== null) return;
    id = e.pointerId;
    try { el.setPointerCapture(id); } catch { /* ignore */ }
    start = performance.now();
    el.classList.add('holding');
    raf = requestAnimationFrame(tick);
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    if (raf && performance.now() - start < 300 && hint) toast(hint);
    reset();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

/* ---------- painting ---------- */

const bgC = $('#bg');
const paintC = $('#paintLayer');
const fxC = $('#fx');
const bgX = bgC.getContext('2d');
const pX = paintC.getContext('2d');
const fxX = fxC.getContext('2d');

let W = 0, H = 0, DPR = 1, unit = 1;
let env = null;
let raf = 0;
let lastFrame = 0;
const anims = [];
const particles = [];
const strokes = new Map();

function sizeCanvases(keepPaint) {
  const oldDpr = DPR;
  let old = null;
  if (keepPaint && paintC.width) {
    old = document.createElement('canvas');
    old.width = paintC.width;
    old.height = paintC.height;
    old.getContext('2d').drawImage(paintC, 0, 0);
  }
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  unit = Math.min(W, H) / 400;
  for (const c of [bgC, paintC, fxC]) {
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
    c.style.width = `${W}px`;
    c.style.height = `${H}px`;
    c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  env.background(bgX, W, H);
  if (old) pX.drawImage(old, 0, 0, old.width / oldDpr, old.height / oldDpr);
}

function startPainting(id) {
  env = getEnv(id);
  show('paint');
  anims.length = 0;
  particles.length = 0;
  strokes.clear();
  sizeCanvases(false);
  sound.unlock();
  cancelAnimationFrame(raf);
  lastFrame = performance.now();
  raf = requestAnimationFrame(frame);
}

function stopPainting() {
  cancelAnimationFrame(raf);
  raf = 0;
  flushAnims();
  strokes.clear();
}

function newPage() {
  flushAnims();
  particles.length = 0;
  pX.clearRect(0, 0, W, H);
  env.background(bgX, W, H);
  sound.whoosh();
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!screens.paint.hidden) {
      flushAnims();
      sizeCanvases(true);
    } else if (!screens.home.hidden) {
      renderPreviews();
    }
  }, 150);
});

// Pop-in animation, then the stamp is painted onto the picture for good.
const easeOutBack = (t) => {
  const c1 = 1.9, c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

function addAnim(x, y, draw, rot, dur) {
  if (anims.length > 90) commitAnim(anims.shift());
  anims.push({ x, y, draw, rot, dur, t0: performance.now() });
}

function drawAnim(ctx, a, s) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot + (1 - Math.min(1, s)) * 0.5);
  const k = Math.max(0.01, s);
  ctx.scale(k, k);
  a.draw(ctx);
  ctx.restore();
}

function commitAnim(a) {
  drawAnim(pX, a, 1);
}

function flushAnims() {
  while (anims.length) commitAnim(anims.shift());
}

function burst(x, y, size) {
  const n = 10;
  for (let i = 0; i < n && particles.length < 400; i++) {
    const a = (i / n) * TAU + rand(-0.3, 0.3);
    const v = rand(120, 320) * unit;
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      r: rand(3, 7) * unit,
      c: vivid(),
      life: 1,
      decay: rand(1.6, 2.4),
    });
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  fxX.clearRect(0, 0, W, H);

  let i = 0;
  while (i < anims.length) {
    const a = anims[i];
    const t = (now - a.t0) / a.dur;
    if (t >= 1) {
      commitAnim(a);
      anims.splice(i, 1);
    } else {
      drawAnim(fxX, a, easeOutBack(Math.max(0, t)));
      i++;
    }
  }

  if (particles.length) {
    fxX.save();
    if (env.glow) fxX.globalCompositeOperation = 'lighter';
    for (let j = particles.length - 1; j >= 0; j--) {
      const p = particles[j];
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        particles.splice(j, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy = p.vy * 0.94 + 60 * unit * dt;
      fxX.globalAlpha = p.life;
      fxX.fillStyle = p.c;
      fxX.beginPath();
      fxX.arc(p.x, p.y, p.r * (0.5 + p.life * 0.5), 0, TAU);
      fxX.fill();
    }
    fxX.restore();
  }

  raf = requestAnimationFrame(frame);
}

function spawnStamp(x, y) {
  const size = Math.min(W, H) * rand(0.075, 0.13);
  addAnim(x, y, makeStamp(env, size), rand(-0.35, 0.35), 380);
  burst(x, y, size);
  sound.tap(y / H, env.id);
  if (navigator.vibrate) navigator.vibrate(8);
}

function spawnDecor(st, x, y, angle) {
  const s = Math.min(W, H) * rand(0.018, 0.032);
  st.side = -st.side;
  const spread = env.decorSpread;
  let ox, oy;
  if (spread) {
    // scatter around the line
    const r = st.w * spread * rand(0.4, 1);
    const a = angle + (Math.PI / 2) * st.side + rand(-0.6, 0.6);
    ox = Math.cos(a) * r;
    oy = Math.sin(a) * r;
  } else {
    // sit right on the edge of the line (leaves on a vine)
    ox = Math.cos(angle + (Math.PI / 2) * st.side) * st.w * 0.35;
    oy = Math.sin(angle + (Math.PI / 2) * st.side) * st.w * 0.35;
  }
  addAnim(x + ox, y + oy, env.decor(s, angle, st.side), 0, 260);
  sound.sparkle(y / H, env.id);
}

const DRAG_START = 8;

function moveStroke(st, x, y) {
  const dx = x - st.x, dy = y - st.y;
  const d = Math.hypot(dx, dy);
  if (!st.started) {
    if (d < DRAG_START) return;
    st.started = true;
    drawBrushDot(pX, env, st.x, st.y, st.w, st.hue);
  }
  if (d < 1.5) return;
  st.hue = (st.hue + d * 0.3) % 360;
  // faster swipes make slightly thinner lines
  const target = st.base * Math.min(1.3, Math.max(0.65, 1.3 - d / (45 * unit)));
  st.w += (target - st.w) * 0.2;
  // Smooth curve: from the last midpoint, bending through the last point,
  // to the new midpoint.
  const mx = (st.x + x) / 2, my = (st.y + y) / 2;
  drawBrushCurve(pX, env, st.mx, st.my, st.x, st.y, mx, my, st.w, st.hue);
  st.mx = mx;
  st.my = my;
  st.travel += d;
  if (st.travel >= st.nextDecor) {
    spawnDecor(st, x, y, Math.atan2(dy, dx));
    st.nextDecor = st.travel + env.decorGap * unit * rand(0.7, 1.3);
  }
  st.x = x;
  st.y = y;
}

fxC.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sound.unlock();
  try { fxC.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  const x = e.clientX, y = e.clientY;
  spawnStamp(x, y);
  const base = 15 * unit * rand(0.85, 1.3);
  strokes.set(e.pointerId, {
    x, y, mx: x, my: y, base, w: base,
    hue: randHue(),
    travel: 0,
    nextDecor: env.decorGap * unit * rand(0.4, 1),
    started: false,
    side: 1,
  });
});

fxC.addEventListener('pointermove', (e) => {
  const st = strokes.get(e.pointerId);
  if (!st) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of list.length ? list : [e]) moveStroke(st, ev.clientX, ev.clientY);
});

function endStroke(e) {
  const st = strokes.get(e.pointerId);
  if (!st) return;
  if (st.started) {
    // finish the last little piece, then round off the end
    drawBrushCurve(pX, env, st.mx, st.my, st.x, st.y, st.x, st.y, st.w, st.hue);
    drawBrushDot(pX, env, st.x, st.y, st.w, st.hue);
  }
  strokes.delete(e.pointerId);
}
fxC.addEventListener('pointerup', endStroke);
fxC.addEventListener('pointercancel', endStroke);

/* ---------- saving ---------- */

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality)
  );
}

let saving = false;
async function savePainting() {
  if (saving) return;
  saving = true;
  try {
    flushAnims();
    const out = document.createElement('canvas');
    out.width = paintC.width;
    out.height = paintC.height;
    const o = out.getContext('2d');
    o.drawImage(bgC, 0, 0);
    o.drawImage(paintC, 0, 0);

    const scale = 360 / Math.max(out.width, out.height);
    const th = document.createElement('canvas');
    th.width = Math.round(out.width * scale);
    th.height = Math.round(out.height * scale);
    th.getContext('2d').drawImage(out, 0, 0, th.width, th.height);

    const [image, thumb] = await Promise.all([canvasToBlob(out), canvasToBlob(th, 'image/jpeg', 0.8)]);
    await album.addPainting({ image, thumb, env: env.id });
    // Ask the browser not to clear the album when space runs low.
    navigator.storage?.persist?.().catch(() => {});

    const flash = $('#flash');
    flash.classList.remove('go');
    void flash.offsetWidth;
    flash.classList.add('go');
    sound.chime();
    toast('Saved to your album! ⭐');
  } catch (err) {
    console.error(err);
    toast('Oops, could not save 😕', 2500);
  } finally {
    saving = false;
  }
}

holdButton($('#exitBtn'), 1200, () => {
  stopPainting();
  goHome();
}, 'Hold to go home');
holdButton($('#clearBtn'), 1200, newPage, 'Hold for a new page');
holdButton($('#saveBtn'), 800, savePainting, 'Hold to save');

/* ---------- home ---------- */

function colorTitle() {
  const title = $('#title');
  const text = title.dataset.text || title.textContent;
  title.dataset.text = text;
  title.innerHTML = '';
  [...text].forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.style.color = ch === ' ' ? '' : vivid();
    span.style.animationDelay = `${i * 0.08}s`;
    title.append(span);
  });
}

function renderPreview(canvas, e) {
  const r = canvas.getBoundingClientRect();
  if (!r.width) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = r.width, h = r.height, m = Math.min(w, h);
  e.background(ctx, w, h);
  // a squiggle
  const y0 = h * rand(0.35, 0.65);
  const phase = rand(0, TAU);
  let hue = randHue();
  const pt = (i) => [w * 0.05 + (i / 40) * w * 0.9, y0 + Math.sin(i * 0.3 + phase) * h * 0.15];
  let [px, py] = pt(0);
  let [mx, my] = [px, py];
  for (let i = 1; i <= 40; i++) {
    const [x, y] = pt(i);
    const nx = (px + x) / 2, ny = (py + y) / 2;
    hue += 6;
    drawBrushCurve(ctx, e, mx, my, px, py, nx, ny, m * 0.045, hue);
    [mx, my, px, py] = [nx, ny, x, y];
  }
  // a few stamps
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(rand(0.15, 0.85) * w, rand(0.2, 0.8) * h);
    ctx.rotate(rand(-0.3, 0.3));
    makeStamp(e, m * rand(0.1, 0.15))(ctx);
    ctx.restore();
  }
}

function buildHome() {
  const grid = $('#envGrid');
  for (const e of ENVIRONMENTS) {
    const btn = document.createElement('button');
    btn.className = 'env-tile';
    btn.dataset.env = e.id;
    btn.setAttribute('aria-label', e.name);
    btn.innerHTML = `<canvas></canvas><span class="env-label"><span class="env-emoji">${e.emoji}</span>${e.name}</span>`;
    btn.addEventListener('click', () => {
      sound.unlock();
      sound.tap(0.3, e.id);
      startPainting(e.id);
    });
    grid.append(btn);
  }
}

function renderPreviews() {
  document.querySelectorAll('.env-tile').forEach((tile) => {
    renderPreview(tile.querySelector('canvas'), getEnv(tile.dataset.env));
  });
}

function goHome() {
  show('home');
  colorTitle();
  requestAnimationFrame(renderPreviews);
}

const soundBtn = $('#soundBtn');
const paintSound = () => {
  soundBtn.textContent = sound.isOn() ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-label', sound.isOn() ? 'Sound on' : 'Sound off');
};
soundBtn.addEventListener('click', () => {
  sound.toggle();
  paintSound();
  sound.tap(0.5, 'candy');
});

/* ---------- album ---------- */

let albumUrls = [];
const freeUrls = () => {
  albumUrls.forEach((u) => URL.revokeObjectURL(u));
  albumUrls = [];
};

async function openAlbum() {
  show('album');
  const grid = $('#albumGrid');
  freeUrls();
  grid.innerHTML = '';
  let items = [];
  try {
    items = await album.listPaintings();
  } catch (err) {
    console.error(err);
    toast('Album is not available here 😕', 2500);
  }
  $('#albumEmpty').hidden = items.length > 0;
  for (const item of items) {
    const url = URL.createObjectURL(item.thumb);
    albumUrls.push(url);
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.innerHTML = `<img alt="" src="${url}"><span class="badge">${getEnv(item.env).emoji}</span>`;
    btn.addEventListener('click', () => openViewer(item));
    grid.append(btn);
  }
}

let current = null;
let viewerUrl = null;

async function openViewer(item) {
  const image = await album.getImage(item.id);
  if (!image) return;
  current = { ...item, image };
  if (viewerUrl) URL.revokeObjectURL(viewerUrl);
  viewerUrl = URL.createObjectURL(image);
  $('#viewerImg').src = viewerUrl;
  const e = getEnv(item.env);
  $('#viewerDate').textContent = `${e.emoji} ${e.name} · ${new Date(item.created).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })}`;
  $('#viewer').hidden = false;
}

function closeViewer() {
  $('#viewer').hidden = true;
  current = null;
}

async function shareCurrent() {
  if (!current) return;
  const e = getEnv(current.env);
  const name = `${e.name.toLowerCase()}-painting-${new Date(current.created).toISOString().slice(0, 10)}.jpg`;
  const file = new File([current.image], name, { type: current.image.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My painting' });
    } catch { /* cancelled */ }
    return;
  }
  const a = document.createElement('a');
  a.href = viewerUrl;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}

$('#albumBtn').addEventListener('click', () => {
  sound.unlock();
  openAlbum();
});
$('#albumBack').addEventListener('click', () => {
  freeUrls();
  goHome();
});
$('#viewerClose').addEventListener('click', closeViewer);
$('#viewerShare').addEventListener('click', shareCurrent);
holdButton($('#viewerDelete'), 1000, async () => {
  if (!current) return;
  await album.deletePainting(current.id);
  closeViewer();
  toast('Deleted');
  openAlbum();
}, 'Hold to delete');

/* ---------- keep the browser from zooming, scrolling or selecting ---------- */

document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => {
  if (!screens.paint.hidden) e.preventDefault();
}, { passive: false });
fxC.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
// iOS only unlocks audio on certain events.
document.addEventListener('touchend', () => sound.unlock(), { passive: true });

/* ---------- start ---------- */

buildHome();
paintSound();
goHome();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
