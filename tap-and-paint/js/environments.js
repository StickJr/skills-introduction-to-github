// Painting worlds. Each world has a background, a set of "stamps" that pop
// in where a finger taps, a brush for swipes, and small decorations that
// sprinkle along a swipe.

export const TAU = Math.PI * 2;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;
const wrap = (h) => ((h % 360) + 360) % 360;
export const hsl = (h, s = 95, l = 58, a = 1) =>
  `hsla(${wrap(h).toFixed(1)}, ${s}%, ${l}%, ${a})`;
export const randHue = () => Math.random() * 360;
export const vivid = (h = randHue()) => hsl(h, Math.round(rand(88, 100)), Math.round(rand(50, 62)));

function weightedPick(list) {
  const total = list.reduce((n, [, w]) => n + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of list) {
    if ((r -= w) <= 0) return item;
  }
  return list[0][0];
}

/* ---------- small drawing helpers ---------- */

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
  ctx.fill();
}

function starPath(ctx, r, n = 5, inner = 0.5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = rot + (i * Math.PI) / n;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

function sparklePath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.quadraticCurveTo(0, 0, 0, s);
  ctx.quadraticCurveTo(0, 0, -s, 0);
  ctx.quadraticCurveTo(0, 0, 0, -s);
  ctx.closePath();
}

function heartPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.75);
  ctx.bezierCurveTo(-s * 0.2, s * 0.55, -s, s * 0.1, -s, -s * 0.3);
  ctx.bezierCurveTo(-s, -s * 0.75, -s * 0.35, -s * 0.95, 0, -s * 0.5);
  ctx.bezierCurveTo(s * 0.35, -s * 0.95, s, -s * 0.75, s, -s * 0.3);
  ctx.bezierCurveTo(s, s * 0.1, s * 0.2, s * 0.55, 0, s * 0.75);
  ctx.closePath();
}

function shine(ctx, x, y, rx, ry, rot = -0.6, a = 0.4) {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
}

function eye(ctx, x, y, r) {
  ctx.fillStyle = '#fff';
  circle(ctx, x, y, r);
  ctx.fillStyle = '#1f2937';
  circle(ctx, x + r * 0.15, y + r * 0.12, r * 0.62);
  ctx.fillStyle = '#fff';
  circle(ctx, x + r * 0.38, y - r * 0.15, r * 0.24);
}

// A cute face: toddlers love faces.
function face(ctx, r, { y = -0.12, spread = 0.34, cheeks = true } = {}) {
  const er = r * 0.15;
  const ey = y * r;
  eye(ctx, -spread * r, ey, er);
  eye(ctx, spread * r, ey, er);
  if (cheeks) {
    ctx.fillStyle = 'rgba(255, 90, 160, 0.45)';
    circle(ctx, -spread * r * 1.55, ey + r * 0.26, er * 0.85);
    circle(ctx, spread * r * 1.55, ey + r * 0.26, er * 0.85);
  }
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, ey + r * 0.12, r * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

function sprinkle(ctx, x, y, len, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = len * 0.45;
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.stroke();
  ctx.restore();
}

/* ---------- OCEAN ---------- */

const fish = (s) => {
  const h = randHue();
  const body = vivid(h);
  const accent = vivid(h + rand(60, 200));
  return (ctx) => {
    // tail
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, 0);
    ctx.lineTo(-s * 1.15, -s * 0.48);
    ctx.quadraticCurveTo(-s * 0.95, 0, -s * 1.15, s * 0.48);
    ctx.closePath();
    ctx.fill();
    // top fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.4);
    ctx.quadraticCurveTo(0, -s * 0.9, s * 0.3, -s * 0.42);
    ctx.closePath();
    ctx.fill();
    // body
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.75, s * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(-s * 0.3, -s, s * 0.14, s * 2);
    ctx.fillRect(0, -s, s * 0.14, s * 2);
    ctx.restore();
    shine(ctx, s * 0.1, -s * 0.28, s * 0.25, s * 0.08, -0.15, 0.35);
    eye(ctx, s * 0.4, -s * 0.1, s * 0.15);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = Math.max(1.5, s * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(s * 0.55, s * 0.1, s * 0.12, 0.1 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();
  };
};

const jellyfish = (s) => {
  const h = randHue();
  const c = vivid(h);
  const legs = hsl(h, 100, 78);
  const wiggles = Array.from({ length: 5 }, () => rand(-0.25, 0.25));
  return (ctx) => {
    ctx.strokeStyle = legs;
    ctx.lineWidth = s * 0.1;
    ctx.lineCap = 'round';
    wiggles.forEach((w, i) => {
      const x = -s * 0.55 + i * (s * 1.1) / 4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + s * 0.25, s * 0.4, x - s * 0.25, s * 0.7, x + w * s, s * 1.05);
      ctx.stroke();
    });
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, Math.PI, 0);
    const k = 4;
    const step = (s * 1.6) / k;
    for (let i = 0; i < k; i++) {
      const xa = s * 0.8 - i * step;
      const xb = xa - step;
      ctx.quadraticCurveTo((xa + xb) / 2, s * 0.25, xb, 0);
    }
    ctx.fill();
    shine(ctx, -s * 0.35, -s * 0.48, s * 0.2, s * 0.1);
    face(ctx, s * 0.8, { y: -0.32, spread: 0.36 });
  };
};

const starfish = (s) => {
  const h = randHue();
  const c = vivid(h);
  const dots = hsl(h, 100, 82);
  const rot = rand(0, TAU);
  return (ctx) => {
    ctx.save();
    ctx.rotate(rot * 0.1);
    starPath(ctx, s * 0.92, 5, 0.48);
    ctx.fillStyle = c;
    ctx.strokeStyle = c;
    ctx.lineJoin = 'round';
    ctx.lineWidth = s * 0.25;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = dots;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 5;
      circle(ctx, Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62, s * 0.06);
    }
    face(ctx, s * 0.5, { y: 0 });
    ctx.restore();
  };
};

const octopus = (s) => {
  const h = randHue();
  const c = vivid(h);
  const spots = hsl(h, 100, 78);
  const curls = Array.from({ length: 6 }, () => (chance(0.5) ? 1 : -1));
  return (ctx) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = s * 0.18;
    ctx.lineCap = 'round';
    curls.forEach((d, i) => {
      const x = -s * 0.55 + i * s * 0.22;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + d * s * 0.35, s * 0.55, x + d * s * 0.05, s * 0.85);
      ctx.quadraticCurveTo(x - d * s * 0.1, s * 1.0, x - d * s * 0.2, s * 0.9);
      ctx.stroke();
    });
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.2, s * 0.68, s * 0.72, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = spots;
    circle(ctx, -s * 0.38, -s * 0.62, s * 0.08);
    circle(ctx, s * 0.3, -s * 0.7, s * 0.1);
    circle(ctx, s * 0.5, -s * 0.4, s * 0.06);
    face(ctx, s * 0.68, { y: -0.1 });
  };
};

const bubbles = (s) => {
  const h = randHue();
  const list = Array.from({ length: randInt(3, 6) }, () => ({
    x: rand(-s, s) * 0.7,
    y: rand(-s, s) * 0.7,
    r: s * rand(0.15, 0.42),
  }));
  return (ctx) => {
    for (const b of list) bubble(ctx, b.x, b.y, b.r, h);
  };
};

function bubble(ctx, x, y, r, h) {
  ctx.fillStyle = hsl(h, 100, 85, 0.35);
  circle(ctx, x, y, r);
  ctx.strokeStyle = hsl(h, 100, 90, 0.95);
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.2);
}

const bubbleDecor = (s) => {
  const h = randHue();
  return (ctx) => bubble(ctx, 0, 0, s * 0.7, h);
};

function bgOcean(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#38bdf8');
  g.addColorStop(0.55, '#0369a1');
  g.addColorStop(1, '#172554');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < 6; i++) {
    const x = rand(-0.2, 1) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w * 0.08, 0);
    ctx.lineTo(x + w * 0.35, h);
    ctx.lineTo(x + w * 0.15, h);
    ctx.fill();
  }
  // far seaweed
  ctx.strokeStyle = 'rgba(16, 80, 90, 0.45)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const x = rand(0, w);
    const tall = rand(0.12, 0.3) * h;
    ctx.lineWidth = rand(6, 12);
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.bezierCurveTo(x - 25, h - tall * 0.3, x + 25, h - tall * 0.6, x, h - tall);
    ctx.stroke();
  }
  // sand
  const phase = rand(0, TAU);
  ctx.fillStyle = '#f6c97a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w + 10; x += 10) {
    ctx.lineTo(x, h * 0.92 + Math.sin(x * 0.012 + phase) * h * 0.015);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(180,120,50,0.35)';
  for (let i = 0; i < 60; i++) circle(ctx, rand(0, w), rand(h * 0.94, h), rand(1, 2.5));
}

/* ---------- SPACE ---------- */

const planet = (s) => {
  const h = randHue();
  const ring = chance(0.55) ? vivid(h + rand(120, 200)) : null;
  const tilt = rand(-0.5, 0.5);
  const striped = chance(0.45);
  const happy = chance(0.5);
  const craters = Array.from({ length: 3 }, () => [rand(-0.5, 0.5), rand(-0.5, 0.5), rand(0.1, 0.2)]);
  return (ctx) => {
    if (ring) {
      ctx.save();
      ctx.rotate(tilt);
      ctx.strokeStyle = ring;
      ctx.lineWidth = s * 0.14;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.5, s * 0.42, 0, Math.PI, TAU);
      ctx.stroke();
      ctx.restore();
    }
    const g = ctx.createRadialGradient(-s * 0.35, -s * 0.35, s * 0.1, 0, 0, s);
    g.addColorStop(0, hsl(h, 100, 78));
    g.addColorStop(0.6, hsl(h, 95, 56));
    g.addColorStop(1, hsl(h + 25, 90, 38));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (striped) {
      ctx.fillStyle = hsl(h + 40, 100, 75, 0.55);
      ctx.fillRect(-s, -s * 0.45, s * 2, s * 0.18);
      ctx.fillRect(-s, s * 0.2, s * 2, s * 0.24);
    } else {
      ctx.fillStyle = hsl(h + 20, 80, 35, 0.35);
      for (const [x, y, r] of craters) circle(ctx, x * s, y * s, r * s);
    }
    ctx.restore();
    if (happy) face(ctx, s * 0.9, { y: 0 });
    if (ring) {
      ctx.save();
      ctx.rotate(tilt);
      ctx.strokeStyle = ring;
      ctx.lineWidth = s * 0.14;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.5, s * 0.42, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  };
};

const bigStar = (s) => {
  const h = chance(0.4) ? rand(40, 58) : randHue();
  const c = hsl(h, 100, 62);
  const happy = chance(0.6);
  return (ctx) => {
    ctx.fillStyle = hsl(h, 100, 75, 0.3);
    starPath(ctx, s * 1.3, 5, 0.5);
    ctx.fill();
    starPath(ctx, s * 0.95, 5, 0.5);
    ctx.fillStyle = c;
    ctx.strokeStyle = c;
    ctx.lineJoin = 'round';
    ctx.lineWidth = s * 0.15;
    ctx.fill();
    ctx.stroke();
    shine(ctx, -s * 0.2, -s * 0.25, s * 0.15, s * 0.07);
    if (happy) face(ctx, s * 0.5, { y: 0.05 });
  };
};

const moon = (s) => {
  const c = chance(0.6) ? hsl(rand(42, 58), 100, rand(66, 78)) : vivid();
  return (ctx) => {
    ctx.save();
    ctx.translate(s * 0.35, 0);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, s, -Math.PI / 2, Math.PI / 2, true);
    ctx.ellipse(0, 0, s * 0.35, s, 0, Math.PI / 2, (3 * Math.PI) / 2, false);
    ctx.fill();
    // sleepy eye + smile
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-s * 0.68, -s * 0.15, s * 0.1, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.62, s * 0.2, s * 0.12, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 90, 160, 0.45)';
    circle(ctx, -s * 0.78, s * 0.06, s * 0.07);
    ctx.restore();
  };
};

const rocket = (s) => {
  const h = randHue();
  const body = chance(0.5) ? '#f8fafc' : hsl(h, 90, 70);
  const fin = vivid(h + 180);
  return (ctx) => {
    // flame
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-s * 0.24, s * 0.58);
    ctx.quadraticCurveTo(0, s * 1.45, s * 0.24, s * 0.58);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(-s * 0.13, s * 0.58);
    ctx.quadraticCurveTo(0, s * 1.1, s * 0.13, s * 0.58);
    ctx.fill();
    // fins
    ctx.fillStyle = fin;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(d * s * 0.34, s * 0.05);
      ctx.lineTo(d * s * 0.68, s * 0.62);
      ctx.lineTo(d * s * 0.62, s * 0.78);
      ctx.lineTo(d * s * 0.3, s * 0.58);
      ctx.closePath();
      ctx.fill();
    }
    // body
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.48, -s * 0.6, s * 0.42, s * 0.2, s * 0.32, s * 0.62);
    ctx.lineTo(-s * 0.32, s * 0.62);
    ctx.bezierCurveTo(-s * 0.42, s * 0.2, -s * 0.48, -s * 0.6, 0, -s);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = fin;
    ctx.fillRect(-s, -s, s * 2, s * 0.42);
    ctx.restore();
    // window
    ctx.fillStyle = fin;
    circle(ctx, 0, -s * 0.12, s * 0.22);
    ctx.fillStyle = '#7dd3fc';
    circle(ctx, 0, -s * 0.12, s * 0.16);
    shine(ctx, -s * 0.05, -s * 0.18, s * 0.06, s * 0.03, -0.6, 0.8);
  };
};

const galaxy = (s) => {
  const h = randHue();
  const dots = [];
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 36; i++) {
      const t = i / 36;
      const a = arm * Math.PI + t * 3 * Math.PI + rand(-0.15, 0.15);
      const r = t * s + rand(-0.05, 0.05) * s;
      dots.push([Math.cos(a) * r, Math.sin(a) * r * 0.6, (1 - t) * s * 0.07 + 1.2, h + t * 140]);
    }
  }
  return (ctx) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hsl(h, 100, 70, 0.35);
    circle(ctx, 0, 0, s * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    circle(ctx, 0, 0, s * 0.12);
    for (const [x, y, r, hh] of dots) {
      ctx.fillStyle = hsl(hh, 100, 70, 0.9);
      circle(ctx, x, y, r);
    }
    ctx.restore();
  };
};

const sparkle = (s) => {
  const c = hsl(randHue(), 100, 78);
  return (ctx) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = c;
    sparklePath(ctx, s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    circle(ctx, 0, 0, s * 0.18);
    ctx.restore();
  };
};

function scatterStars(ctx, w, h, density = 2600) {
  const n = Math.round((w * h) / density);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rand(0.3, 0.95).toFixed(2)})`;
    circle(ctx, rand(0, w), rand(0, h), rand(0.4, 1.6));
  }
}

function bgSpace(ctx, w, h) {
  const g = ctx.createRadialGradient(w * rand(0.3, 0.7), h * rand(0.3, 0.7), 0, w / 2, h / 2, Math.max(w, h) * 0.8);
  g.addColorStop(0, '#3b2a8a');
  g.addColorStop(0.5, '#1a1650');
  g.addColorStop(1, '#070a1f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const x = rand(0, w), y = rand(0, h), r = rand(0.25, 0.5) * Math.max(w, h);
    const n = ctx.createRadialGradient(x, y, 0, x, y, r);
    n.addColorStop(0, hsl(randHue(), 90, 55, 0.18));
    n.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = n;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
  scatterStars(ctx, w, h);
}

/* ---------- GARDEN ---------- */

const green = () => hsl(rand(95, 140), 70, rand(35, 45));

function stemAndLeaf(ctx, s, top, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = s * 0.14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.quadraticCurveTo(s * 0.2, s * 0.8, 0, s * 1.5);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(s * 0.25, s * 1.0, s * 0.32, s * 0.12, -0.6, 0, TAU);
  ctx.fill();
}

const flower = (s) => {
  const h = randHue();
  const petal = vivid(h);
  const petalIn = hsl(h, 100, 80);
  const center = chance(0.5) ? hsl(rand(45, 55), 100, 55) : vivid(h + 180);
  const n = randInt(5, 8);
  const stem = chance(0.6) ? green() : null;
  const happy = chance(0.55);
  return (ctx) => {
    if (stem) stemAndLeaf(ctx, s, 0, stem);
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.rotate((i * TAU) / n);
      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.55, s * 0.28, s * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = petalIn;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.5, s * 0.11, s * 0.28, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = center;
    circle(ctx, 0, 0, s * 0.34);
    if (happy) face(ctx, s * 0.34, { y: -0.05 });
  };
};

const tulip = (s) => {
  const h = randHue();
  const c = vivid(h);
  const stem = green();
  return (ctx) => {
    stemAndLeaf(ctx, s, s * 0.3, stem);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.55);
    ctx.lineTo(-s * 0.25, -s * 0.2);
    ctx.lineTo(0, -s * 0.65);
    ctx.lineTo(s * 0.25, -s * 0.2);
    ctx.lineTo(s * 0.5, -s * 0.55);
    ctx.bezierCurveTo(s * 0.58, s * 0.2, s * 0.3, s * 0.45, 0, s * 0.45);
    ctx.bezierCurveTo(-s * 0.3, s * 0.45, -s * 0.58, s * 0.2, -s * 0.5, -s * 0.55);
    ctx.fill();
    shine(ctx, -s * 0.22, 0, s * 0.08, s * 0.2, 0.2, 0.35);
  };
};

const butterfly = (s) => {
  const h = randHue();
  const top = vivid(h);
  const bottom = vivid(h + rand(40, 180));
  const dot = hsl(h + rand(150, 210), 100, 82);
  return (ctx) => {
    for (const d of [-1, 1]) {
      ctx.save();
      ctx.scale(d, 1);
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.ellipse(s * 0.45, -s * 0.3, s * 0.48, s * 0.4, -0.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = bottom;
      ctx.beginPath();
      ctx.ellipse(s * 0.35, s * 0.35, s * 0.34, s * 0.3, 0.45, 0, TAU);
      ctx.fill();
      ctx.fillStyle = dot;
      circle(ctx, s * 0.5, -s * 0.32, s * 0.15);
      circle(ctx, s * 0.36, s * 0.38, s * 0.1);
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = Math.max(1.5, s * 0.04);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.03, -s * 0.6);
      ctx.quadraticCurveTo(s * 0.1, -s * 0.95, s * 0.3, -s * 1.0);
      ctx.stroke();
      ctx.fillStyle = '#1f2937';
      circle(ctx, s * 0.3, -s * 1.0, s * 0.06);
      ctx.restore();
    }
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.1, s * 0.55, 0, 0, TAU);
    ctx.fill();
    circle(ctx, 0, -s * 0.6, s * 0.14);
  };
};

const ladybug = (s) => {
  const c = chance(0.5) ? hsl(rand(350, 365), 90, 52) : vivid();
  const spots = Array.from({ length: 6 }, (_, i) => [
    (i % 2 ? 1 : -1) * rand(0.2, 0.42),
    rand(-0.15, 0.6),
    rand(0.09, 0.14),
  ]);
  return (ctx) => {
    ctx.fillStyle = '#1f2937';
    circle(ctx, 0, -s * 0.52, s * 0.4);
    ctx.fillStyle = c;
    circle(ctx, 0, s * 0.15, s * 0.68);
    ctx.fillStyle = '#1f2937';
    for (const [x, y, r] of spots) circle(ctx, x * s, y * s, r * s);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(0, s * 0.82);
    ctx.stroke();
    shine(ctx, -s * 0.35, -s * 0.05, s * 0.14, s * 0.07);
    ctx.save();
    ctx.translate(0, -s * 0.6);
    face(ctx, s * 0.32, { y: 0, cheeks: false });
    ctx.restore();
  };
};

const mushroom = (s) => {
  const c = vivid();
  return (ctx) => {
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.38, s * 0.28, s * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.85, Math.PI, 0);
    ctx.quadraticCurveTo(0, s * 0.3, -s * 0.85, s * 0.08);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    circle(ctx, -s * 0.4, -s * 0.25, s * 0.13);
    circle(ctx, s * 0.1, -s * 0.5, s * 0.15);
    circle(ctx, s * 0.5, -s * 0.15, s * 0.11);
    ctx.save();
    ctx.translate(0, s * 0.45);
    face(ctx, s * 0.26, { y: 0, cheeks: false });
    ctx.restore();
  };
};

const leafDecor = (s, angle, side) => {
  const col = chance(0.75) ? green() : vivid();
  const flowerOn = chance(0.18);
  const fh = randHue();
  return (ctx) => {
    ctx.save();
    ctx.rotate(angle + side * 0.9);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(s * 0.6, 0, s * 0.75, s * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 1.1, 0);
    ctx.stroke();
    ctx.restore();
    if (flowerOn) {
      ctx.fillStyle = vivid(fh);
      for (let i = 0; i < 5; i++) {
        const a = (i * TAU) / 5;
        circle(ctx, Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4, s * 0.32);
      }
      ctx.fillStyle = hsl(50, 100, 60);
      circle(ctx, 0, 0, s * 0.25);
    }
  };
};

function hills(ctx, w, h, baseY, color, amp) {
  const phase = rand(0, TAU);
  const freq = rand(1.2, 2.2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w + 10; x += 8) {
    ctx.lineTo(x, baseY + Math.sin((x / w) * TAU * freq * 0.5 + phase) * amp);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function sun(ctx, x, y, r) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.4);
  g.addColorStop(0, 'rgba(255, 236, 140, 0.8)');
  g.addColorStop(1, 'rgba(255, 236, 140, 0)');
  ctx.fillStyle = g;
  circle(ctx, x, y, r * 2.4);
  ctx.fillStyle = '#fde047';
  circle(ctx, x, y, r);
  ctx.restore();
}

function bgGarden(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#93d5fb');
  g.addColorStop(0.6, '#e0f4ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  sun(ctx, w * rand(0.1, 0.25), h * 0.1, m * 0.08);
  hills(ctx, w, h, h * 0.62, '#a7f3a0', h * 0.04);
  hills(ctx, w, h, h * 0.73, '#6ee07a', h * 0.035);
  hills(ctx, w, h, h * 0.85, '#3fbf5a', h * 0.025);
  ctx.strokeStyle = 'rgba(20, 110, 40, 0.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const x = rand(0, w), y = rand(h * 0.88, h);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y - 9);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y - 8);
    ctx.stroke();
  }
}

/* ---------- SKY ---------- */

const balloon = (s) => {
  const h = randHue();
  const happy = chance(0.35);
  const sway = rand(-0.3, 0.3);
  return (ctx) => {
    ctx.save();
    ctx.translate(0, -s * 0.4);
    ctx.strokeStyle = 'rgba(55, 55, 80, 0.75)';
    ctx.lineWidth = Math.max(1.5, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.85);
    ctx.bezierCurveTo(s * (0.3 + sway), s * 1.2, -s * 0.3, s * 1.5, s * sway, s * 1.9);
    ctx.stroke();
    ctx.fillStyle = hsl(h, 90, 45);
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, s * 0.9);
    ctx.lineTo(s * 0.1, s * 0.9);
    ctx.lineTo(0, s * 0.76);
    ctx.fill();
    const g = ctx.createRadialGradient(-s * 0.25, -s * 0.3, s * 0.05, 0, 0, s * 0.85);
    g.addColorStop(0, hsl(h, 100, 78));
    g.addColorStop(1, hsl(h, 95, 52));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.65, s * 0.8, 0, 0, TAU);
    ctx.fill();
    shine(ctx, -s * 0.25, -s * 0.35, s * 0.12, s * 0.22, 0.4, 0.5);
    if (happy) face(ctx, s * 0.6, { y: 0 });
    ctx.restore();
  };
};

const PUFFS = [[-0.5, 0.1, 0.38], [-0.15, -0.2, 0.5], [0.3, -0.1, 0.42], [0.62, 0.15, 0.3], [0.05, 0.2, 0.4]];
const cloud = (s) => {
  const c = chance(0.5) ? '#ffffff' : hsl(randHue(), 100, 88);
  const happy = chance(0.7);
  return (ctx) => {
    ctx.fillStyle = c;
    for (const [x, y, r] of PUFFS) circle(ctx, x * s, y * s, r * s);
    if (happy) face(ctx, s * 0.5, { y: 0.05 });
  };
};

const birds = (s) => {
  const list = Array.from({ length: randInt(1, 3) }, () => ({
    x: rand(-0.6, 0.6) * s,
    y: rand(-0.5, 0.5) * s,
    b: s * rand(0.5, 0.9),
    c: vivid(),
  }));
  return (ctx) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const { x, y, b, c } of list) {
      ctx.strokeStyle = c;
      ctx.lineWidth = b * 0.16;
      ctx.beginPath();
      ctx.moveTo(x - b * 0.5, y);
      ctx.quadraticCurveTo(x - b * 0.25, y - b * 0.4, x, y);
      ctx.quadraticCurveTo(x + b * 0.25, y - b * 0.4, x + b * 0.5, y);
      ctx.stroke();
    }
  };
};

const kite = (s) => {
  const h = randHue();
  const cols = [vivid(h), vivid(h + 90), vivid(h + 180), vivid(h + 270)];
  const pts = [[0, -s], [s * 0.6, -s * 0.1], [0, s], [-s * 0.6, -s * 0.1]];
  const c = [0, -s * 0.1];
  return (ctx) => {
    // tail
    ctx.strokeStyle = 'rgba(55,55,80,0.7)';
    ctx.lineWidth = Math.max(1.5, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.bezierCurveTo(s * 0.4, s * 1.4, -s * 0.4, s * 1.7, s * 0.1, s * 2.1);
    ctx.stroke();
    [[s * 0.12, s * 1.3], [-s * 0.05, s * 1.65], [s * 0.05, s * 1.95]].forEach(([x, y], i) => {
      ctx.fillStyle = cols[i % 4];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s * 0.15, y - s * 0.1);
      ctx.lineTo(x - s * 0.15, y + s * 0.1);
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * 0.15, y - s * 0.1);
      ctx.lineTo(x + s * 0.15, y + s * 0.1);
      ctx.fill();
    });
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[(i + 1) % 4];
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.moveTo(c[0], c[1]);
      ctx.lineTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.closePath();
      ctx.fill();
    }
  };
};

const heart = (s) => {
  const c = vivid();
  const happy = chance(0.4);
  return (ctx) => {
    ctx.fillStyle = c;
    heartPath(ctx, s);
    ctx.fill();
    shine(ctx, -s * 0.5, -s * 0.4, s * 0.15, s * 0.08);
    if (happy) face(ctx, s * 0.55, { y: -0.2 });
  };
};

const rainbow = (s) => {
  const h = chance(0.6) ? 0 : randHue();
  return (ctx) => {
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = hsl(h + i * 48, 95, 58);
      ctx.lineWidth = s * 0.14;
      ctx.beginPath();
      ctx.arc(0, s * 0.4, s * (1 - i * 0.13), Math.PI, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    for (const d of [-1, 1]) {
      circle(ctx, d * s * 0.68, s * 0.42, s * 0.2);
      circle(ctx, d * s * 0.88, s * 0.45, s * 0.16);
      circle(ctx, d * s * 0.5, s * 0.47, s * 0.15);
    }
  };
};

const tinyHeartOrStar = (s) => {
  const c = vivid();
  const isHeart = chance(0.5);
  return (ctx) => {
    ctx.fillStyle = c;
    if (isHeart) heartPath(ctx, s * 0.8);
    else starPath(ctx, s, 5, 0.5);
    ctx.fill();
  };
};

function bgSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5ec4f7');
  g.addColorStop(0.6, '#b9e6fd');
  g.addColorStop(1, '#fde9c4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  sun(ctx, w * rand(0.72, 0.9), h * 0.12, m * 0.1);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 5; i++) {
    const x = rand(0, w), y = rand(0.15, 0.9) * h, s = m * rand(0.06, 0.12);
    for (const [px, py, r] of PUFFS) circle(ctx, x + px * s, y + py * s, r * s);
  }
}

/* ---------- FIREWORKS (night) ---------- */

const firework = (s0) => {
  const s = s0 * 1.5;
  const h1 = randHue();
  const h2 = h1 + rand(30, 180);
  const style = pick(['rays', 'rays', 'dots', 'willow', 'ring']);
  const n = randInt(14, 24);
  const rays = Array.from({ length: n }, (_, i) => ({
    a: (i * TAU) / n + rand(-0.08, 0.08),
    len: rand(0.75, 1),
  }));
  return (ctx) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (style === 'rays' || style === 'willow') {
      rays.forEach(({ a, len }, i) => {
        const c = Math.cos(a), sn = Math.sin(a);
        ctx.strokeStyle = hsl(i % 2 ? h1 : h2, 100, 62);
        ctx.lineWidth = s * 0.045;
        ctx.beginPath();
        ctx.moveTo(c * s * 0.15, sn * s * 0.15);
        if (style === 'rays') ctx.lineTo(c * s * len, sn * s * len);
        else ctx.quadraticCurveTo(c * s * len * 0.8, sn * s * len * 0.8, c * s * len, sn * s * len + s * 0.35);
        ctx.stroke();
        ctx.fillStyle = hsl(i % 2 ? h1 : h2, 100, 82);
        const ey = style === 'rays' ? sn * s * len : sn * s * len + s * 0.35;
        circle(ctx, c * s * len, ey, s * 0.06);
      });
    } else if (style === 'dots') {
      [0.35, 0.65, 0.95].forEach((rr, ring) => {
        const k = 8 + ring * 6;
        for (let i = 0; i < k; i++) {
          const a = (i * TAU) / k + ring * 0.2;
          ctx.fillStyle = hsl(ring % 2 ? h2 : h1, 100, 65 + ring * 6);
          circle(ctx, Math.cos(a) * s * rr, Math.sin(a) * s * rr, s * (0.07 - ring * 0.012));
        }
      });
    } else {
      for (let i = 0; i < 28; i++) {
        const a = (i * TAU) / 28;
        ctx.fillStyle = hsl(i % 2 ? h1 : h2, 100, 68);
        circle(ctx, Math.cos(a) * s * 0.9, Math.sin(a) * s * 0.9, s * 0.05);
      }
      ctx.fillStyle = hsl(h2, 100, 75);
      sparklePath(ctx, s * 0.45);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    circle(ctx, 0, 0, s * 0.1);
    ctx.restore();
  };
};

function bgNight(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#030616');
  g.addColorStop(0.6, '#1e1b4b');
  g.addColorStop(1, '#4c1d95');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  scatterStars(ctx, w, h * 0.8, 3500);
  // skyline
  let x = 0;
  while (x < w) {
    const bw = rand(0.06, 0.14) * w;
    const bh = rand(0.08, 0.24) * h;
    ctx.fillStyle = '#0a0820';
    ctx.fillRect(x, h - bh, bw + 1, bh);
    for (let wy = h - bh + 8; wy < h - 8; wy += 14) {
      for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
        if (chance(0.35)) {
          ctx.fillStyle = chance(0.8) ? 'rgba(253, 224, 120, 0.8)' : 'rgba(150, 220, 255, 0.7)';
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
    }
    x += bw;
  }
}

/* ---------- CANDY ---------- */

const lollipop = (s) => {
  const h = randHue();
  const a = vivid(h), b = chance(0.5) ? '#ffffff' : vivid(h + 150);
  return (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-s * 0.07, s * 0.3, s * 0.14, s * 1.2);
    ctx.fillStyle = a;
    circle(ctx, 0, 0, s * 0.72);
    ctx.strokeStyle = b;
    ctx.lineWidth = s * 0.13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.02) {
      const ang = t * 4.2 * Math.PI;
      ctx.lineTo(Math.cos(ang) * t * s * 0.62, Math.sin(ang) * t * s * 0.62);
    }
    ctx.stroke();
    shine(ctx, -s * 0.3, -s * 0.35, s * 0.16, s * 0.08, -0.6, 0.5);
  };
};

const donut = (s) => {
  const icing = vivid();
  const bumps = Array.from({ length: 10 }, () => rand(0.64, 0.74));
  const sprinkles = Array.from({ length: 14 }, () => {
    const a = rand(0, TAU), r = rand(0.45, 0.62);
    return [Math.cos(a) * r, Math.sin(a) * r, rand(0, TAU), vivid()];
  });
  return (ctx) => {
    ctx.fillStyle = '#e8ad72';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.82, 0, TAU);
    ctx.arc(0, 0, s * 0.26, 0, TAU, true);
    ctx.fill();
    ctx.fillStyle = icing;
    ctx.beginPath();
    bumps.forEach((r, i) => {
      const a = (i * TAU) / bumps.length;
      const a2 = ((i + 0.5) * TAU) / bumps.length;
      ctx.quadraticCurveTo(Math.cos(a) * s * (r + 0.08), Math.sin(a) * s * (r + 0.08), Math.cos(a2) * s * r, Math.sin(a2) * s * r);
    });
    ctx.closePath();
    ctx.moveTo(s * 0.36, 0);
    ctx.arc(0, 0, s * 0.36, 0, TAU, true);
    ctx.fill('evenodd');
    for (const [x, y, rot, c] of sprinkles) sprinkle(ctx, x * s, y * s, s * 0.16, rot, c);
  };
};

const wrappedCandy = (s) => {
  const h = randHue();
  const a = vivid(h), b = vivid(h + rand(90, 200));
  return (ctx) => {
    ctx.fillStyle = b;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(d * s * 0.45, 0);
      ctx.lineTo(d * s * 1.0, -s * 0.4);
      ctx.quadraticCurveTo(d * s * 0.85, 0, d * s * 1.0, s * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.6, s * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = b;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = s * 0.12;
    for (let x = -s; x < s; x += s * 0.32) {
      ctx.beginPath();
      ctx.moveTo(x, s * 0.5);
      ctx.lineTo(x + s * 0.5, -s * 0.5);
      ctx.stroke();
    }
    ctx.restore();
    shine(ctx, -s * 0.2, -s * 0.2, s * 0.18, s * 0.07, -0.2, 0.5);
  };
};

const cupcake = (s) => {
  const h = randHue();
  const wrapper = vivid(h);
  const frost = hsl(h + rand(90, 270), 100, 80);
  const happy = chance(0.5);
  const sprinkles = Array.from({ length: 8 }, () => [rand(-0.55, 0.55), rand(-0.6, 0.15), rand(0, TAU), vivid()]);
  return (ctx) => {
    ctx.fillStyle = wrapper;
    ctx.beginPath();
    ctx.moveTo(-s * 0.58, s * 0.1);
    ctx.lineTo(s * 0.58, s * 0.1);
    ctx.lineTo(s * 0.42, s * 0.9);
    ctx.lineTo(-s * 0.42, s * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = s * 0.05;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.22, s * 0.12);
      ctx.lineTo(i * s * 0.16, s * 0.88);
      ctx.stroke();
    }
    ctx.fillStyle = frost;
    circle(ctx, -s * 0.36, s * 0.02, s * 0.32);
    circle(ctx, s * 0.36, s * 0.02, s * 0.32);
    circle(ctx, 0, -s * 0.08, s * 0.42);
    circle(ctx, 0, -s * 0.45, s * 0.3);
    for (const [x, y, rot, c] of sprinkles) sprinkle(ctx, x * s, y * s, s * 0.14, rot, c);
    ctx.fillStyle = '#e11d48';
    circle(ctx, 0, -s * 0.82, s * 0.14);
    shine(ctx, -s * 0.04, -s * 0.87, s * 0.04, s * 0.025, -0.6, 0.8);
    if (happy) {
      ctx.save();
      ctx.translate(0, s * 0.5);
      face(ctx, s * 0.35, { y: 0, cheeks: false });
      ctx.restore();
    }
  };
};

const iceCream = (s) => {
  const a = hsl(randHue(), 95, 75), b = hsl(randHue(), 95, 72);
  return (ctx) => {
    ctx.save();
    ctx.translate(0, -s * 0.2);
    ctx.fillStyle = '#e3a35b';
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.12);
    ctx.lineTo(s * 0.42, s * 0.12);
    ctx.lineTo(0, s * 1.25);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(140, 80, 20, 0.45)';
    ctx.lineWidth = s * 0.04;
    for (let x = -s; x < s; x += s * 0.2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + s * 1.2, s * 1.3);
      ctx.moveTo(x, s * 1.3);
      ctx.lineTo(x + s * 1.2, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = a;
    circle(ctx, 0, -s * 0.05, s * 0.48);
    circle(ctx, -s * 0.3, s * 0.15, s * 0.16);
    circle(ctx, s * 0.25, s * 0.18, s * 0.14);
    ctx.fillStyle = b;
    circle(ctx, 0, -s * 0.58, s * 0.38);
    shine(ctx, -s * 0.15, -s * 0.72, s * 0.1, s * 0.05);
    ctx.fillStyle = '#e11d48';
    circle(ctx, 0, -s * 0.98, s * 0.12);
    ctx.restore();
  };
};

const sprinkleDecor = (s) => {
  const list = Array.from({ length: randInt(3, 6) }, () => [rand(-1, 1) * s, rand(-1, 1) * s, rand(0, TAU), vivid()]);
  return (ctx) => {
    for (const [x, y, rot, c] of list) sprinkle(ctx, x, y, s * 0.6, rot, c);
  };
};

function bgCandy(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#fbcfe8');
  g.addColorStop(0.5, '#f5d0fe');
  g.addColorStop(1, '#c7d2fe');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const step = Math.min(w, h) * 0.12;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let y = 0, row = 0; y < h + step; y += step, row++) {
    for (let x = (row % 2) * step * 0.5; x < w + step; x += step) circle(ctx, x, y, step * 0.12);
  }
  hills(ctx, w, h, h * 0.86, '#f9a8d4', h * 0.03);
  hills(ctx, w, h, h * 0.93, '#f472b6', h * 0.02);
}

/* ---------- brushes ----------
 * A brush is a set of bands drawn from widest to narrowest along the
 * finger's path. Each band gets a colour from the stroke's current hue,
 * which slowly drifts as the finger moves.
 */
const BRUSHES = {
  tube: [
    [1, (h) => hsl(h, 90, 42)],
    [0.72, (h) => hsl(h, 95, 57)],
    [0.28, (h) => hsl(h, 100, 82)],
  ],
  neon: [
    [2.0, (h) => hsl(h, 100, 22)],
    [1.4, (h) => hsl(h, 100, 42)],
    [0.85, (h) => hsl(h, 100, 62)],
    [0.32, (h) => hsl(h, 100, 92)],
  ],
  vine: [
    [1, (h) => hsl(h, 75, 32)],
    [0.62, (h) => hsl(h, 90, 50)],
    [0.18, (h) => hsl(h, 100, 75)],
  ],
  rainbow: [0, 1, 2, 3, 4, 5].map((i) => [1.7 - i * 0.27, (h) => hsl(h + i * 48, 95, 58)]),
  frosting: [
    [1.25, (h) => hsl(h, 80, 50)],
    [1.0, (h) => hsl(h, 95, 72)],
    [0.4, (h) => hsl(h, 100, 90)],
  ],
};

// Draws a smooth piece of stroke from a to b, bending toward control point c.
// Pieces join with matching direction, so the bands line up cleanly.
export function drawBrushCurve(ctx, env, ax, ay, cx, cy, bx, by, w, hue) {
  let tx = cx - ax, ty = cy - ay;
  let tl = Math.hypot(tx, ty);
  if (tl < 0.01) {
    tx = bx - ax;
    ty = by - ay;
    tl = Math.hypot(tx, ty);
    if (tl < 0.01) return;
  }
  // Each inner band starts a little further back than the band around it,
  // so its soft edge lands on its own colour and no seam shows.
  ctx.lineCap = 'butt';
  BRUSHES[env.brush].forEach(([wf, col], i) => {
    const back = 0.5 + i * 1.2;
    ctx.strokeStyle = col(hue);
    ctx.lineWidth = w * wf;
    ctx.beginPath();
    ctx.moveTo(ax - (tx / tl) * back, ay - (ty / tl) * back);
    ctx.lineTo(ax, ay);
    ctx.quadraticCurveTo(cx, cy, bx, by);
    ctx.stroke();
  });
}

export function drawBrushDot(ctx, env, x, y, w, hue) {
  for (const [wf, col] of BRUSHES[env.brush]) {
    ctx.fillStyle = col(hue);
    circle(ctx, x, y, (w * wf) / 2);
  }
}

/* ---------- the worlds ---------- */

export const ENVIRONMENTS = [
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🐠',
    background: bgOcean,
    stamps: [[fish, 3], [jellyfish, 2], [starfish, 2], [octopus, 1.5], [bubbles, 1]],
    brush: 'tube',
    decor: bubbleDecor,
    decorGap: 55,
    decorSpread: 1.6,
    glow: false,
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    background: bgSpace,
    stamps: [[planet, 3], [bigStar, 2], [moon, 1.5], [rocket, 1.5], [galaxy, 1]],
    brush: 'neon',
    decor: sparkle,
    decorGap: 45,
    decorSpread: 1.8,
    glow: true,
  },
  {
    id: 'garden',
    name: 'Garden',
    emoji: '🌷',
    background: bgGarden,
    stamps: [[flower, 4], [tulip, 2], [butterfly, 2], [ladybug, 1.5], [mushroom, 1.5]],
    brush: 'vine',
    decor: leafDecor,
    decorGap: 34,
    decorSpread: 0,
    glow: false,
  },
  {
    id: 'sky',
    name: 'Sky',
    emoji: '🎈',
    background: bgSky,
    stamps: [[balloon, 3], [cloud, 2], [birds, 1.5], [kite, 1.5], [heart, 1.5], [rainbow, 1]],
    brush: 'rainbow',
    decor: tinyHeartOrStar,
    decorGap: 90,
    decorSpread: 2.2,
    glow: false,
  },
  {
    id: 'night',
    name: 'Fireworks',
    emoji: '🎆',
    background: bgNight,
    stamps: [[firework, 6], [sparkle, 1], [bigStar, 1], [moon, 0.5]],
    brush: 'neon',
    decor: sparkle,
    decorGap: 30,
    decorSpread: 2.2,
    glow: true,
  },
  {
    id: 'candy',
    name: 'Candy',
    emoji: '🍭',
    background: bgCandy,
    stamps: [[lollipop, 2], [donut, 2], [cupcake, 2], [iceCream, 2], [wrappedCandy, 1.5], [heart, 0.5]],
    brush: 'frosting',
    decor: sprinkleDecor,
    decorGap: 30,
    decorSpread: 1.4,
    glow: false,
  },
];

export const getEnv = (id) => ENVIRONMENTS.find((e) => e.id === id) || ENVIRONMENTS[0];
export const makeStamp = (env, size) => weightedPick(env.stamps)(size);
