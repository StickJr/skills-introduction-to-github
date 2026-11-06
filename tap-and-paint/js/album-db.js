// The album lives in the browser's IndexedDB, on the device only.
// "meta" holds small thumbnails for the album grid; "images" holds the
// full-size pictures, loaded only when one is opened.
// If IndexedDB isn't available (some private modes and sandboxed frames),
// paintings are kept in memory until the page is closed.

const DB_NAME = 'tap-and-paint';
let dbPromise = null;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) throw new Error('no IndexedDB');
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('meta', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('images', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('blocked'));
    }).catch(() => null);
  }
  return dbPromise;
}

const memory = { rows: [], next: 1 };

function done(t, value) {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve(typeof value === 'function' ? value() : value);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

// Blobs are stored as ArrayBuffers: older Safari versions mishandle Blobs.
export async function addPainting({ image, thumb, env }) {
  const db = await open();
  if (!db) {
    const id = memory.next++;
    memory.rows.push({ id, env, created: Date.now(), thumb, image });
    return id;
  }
  const [img, th] = await Promise.all([image.arrayBuffer(), thumb.arrayBuffer()]);
  const t = db.transaction(['meta', 'images'], 'readwrite');
  let id;
  const req = t.objectStore('meta').add({ env, created: Date.now(), thumb: th, type: thumb.type });
  req.onsuccess = () => {
    id = req.result;
    t.objectStore('images').put({ id, data: img, type: image.type });
  };
  return done(t, () => id);
}

export async function listPaintings() {
  const db = await open();
  let rows;
  if (!db) {
    rows = memory.rows.map(({ id, env, created, thumb }) => ({ id, env, created, thumb }));
  } else {
    const t = db.transaction('meta', 'readonly');
    const req = t.objectStore('meta').getAll();
    rows = (await done(t, () => req.result)).map((r) => ({
      id: r.id, env: r.env, created: r.created, thumb: new Blob([r.thumb], { type: r.type }),
    }));
  }
  return rows.sort((a, b) => b.created - a.created);
}

export async function getImage(id) {
  const db = await open();
  if (!db) return memory.rows.find((r) => r.id === id)?.image ?? null;
  const t = db.transaction('images', 'readonly');
  const req = t.objectStore('images').get(id);
  const row = await done(t, () => req.result);
  return row ? new Blob([row.data], { type: row.type }) : null;
}

export async function deletePainting(id) {
  const db = await open();
  if (!db) {
    memory.rows = memory.rows.filter((r) => r.id !== id);
    return;
  }
  const t = db.transaction(['meta', 'images'], 'readwrite');
  t.objectStore('meta').delete(id);
  t.objectStore('images').delete(id);
  return done(t);
}
