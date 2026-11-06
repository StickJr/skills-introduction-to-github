// Tiny synth for happy plinks. Notes come from a pentatonic scale, so any
// combination of frantic taps still sounds pleasant.

const KEY = 'tap-and-paint:sound';
const PENTA = [0, 2, 4, 7, 9];
const VOICES = {
  ocean: { type: 'sine', base: 220 },
  space: { type: 'triangle', base: 294 },
  garden: { type: 'triangle', base: 262 },
  sky: { type: 'sine', base: 392 },
  night: { type: 'triangle', base: 196 },
  candy: { type: 'sine', base: 523 },
};

let ac = null;
let master = null;
let enabled = localStorage.getItem(KEY) !== 'off';
let recent = [];

export const isOn = () => enabled;

export function toggle() {
  enabled = !enabled;
  localStorage.setItem(KEY, enabled ? 'on' : 'off');
  if (enabled) unlock();
  return enabled;
}

// Browsers only allow audio after a user gesture, so call this from one.
export function unlock() {
  try {
    if (!ac) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ac = new Ctx();
      const comp = ac.createDynamicsCompressor();
      master = ac.createGain();
      master.gain.value = 0.7;
      master.connect(comp).connect(ac.destination);
    }
    if (ac.state !== 'running') ac.resume();
  } catch {
    /* no audio: that's fine */
  }
}

// Keep a flurry of taps from turning into noise.
function allow(max = 7) {
  const now = performance.now();
  recent = recent.filter((t) => now - t < 250);
  if (recent.length >= max) return false;
  recent.push(now);
  return true;
}

function play(freq, { type = 'sine', dur = 0.4, gain = 0.2, when = 0 } = {}) {
  const t = ac.currentTime + when;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noteFor(yFrac, envId) {
  const v = VOICES[envId] || VOICES.garden;
  const step = Math.max(0, Math.min(9, Math.floor((1 - yFrac) * 10)));
  const semis = PENTA[step % 5] + 12 * Math.floor(step / 5);
  return { v, f: v.base * 2 ** (semis / 12) };
}

// Higher on the screen = higher note.
export function tap(yFrac, envId) {
  if (!enabled || !ac || ac.state !== 'running' || !allow()) return;
  const { v, f } = noteFor(yFrac, envId);
  play(f, { type: v.type, gain: 0.22 });
  play(f * 2, { type: 'sine', gain: 0.05, dur: 0.25 });
}

export function sparkle(yFrac, envId) {
  if (!enabled || !ac || ac.state !== 'running' || !allow(5)) return;
  const { f } = noteFor(yFrac, envId);
  play(f * 2, { type: 'sine', gain: 0.06, dur: 0.18 });
}

export function chime() {
  if (!enabled || !ac) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    play(f, { type: 'triangle', gain: 0.18, dur: 0.5, when: i * 0.09 })
  );
}

export function whoosh() {
  if (!enabled || !ac) return;
  [784, 659, 523].forEach((f, i) => play(f, { type: 'sine', gain: 0.12, dur: 0.3, when: i * 0.07 }));
}
