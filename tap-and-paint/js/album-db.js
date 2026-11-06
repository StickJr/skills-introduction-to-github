// The album lives in the browser's IndexedDB, on the device only.
// "meta" holds small thumbnails for the album grid; "images" holds the
// full-size pictures, loaded only when one is opened.

const DB_NAME = 'tap-and-paint';
let dbPromise = null;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('meta', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('images', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function done(t, value) {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve(typeof value === 'function' ? value() : value);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

// Blobs are stored as ArrayBuffers: older Safari versions mishandle Blobs.
export async function addPainting({ image, thumb, env }) {
  const [img, th] = await Promise.all([image.arrayBuffer(), thumb.arrayBuffer()]);
  const db = await open();
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
  const t = db.transaction('meta', 'readonly');
  const req = t.objectStore('meta').getAll();
  const rows = await done(t, () => req.result);
  return rows
    .map((r) => ({ id: r.id, env: r.env, created: r.created, thumb: new Blob([r.thumb], { type: r.type }) }))
    .sort((a, b) => b.created - a.created);
}

export async function getImage(id) {
  const db = await open();
  const t = db.transaction('images', 'readonly');
  const req = t.objectStore('images').get(id);
  const row = await done(t, () => req.result);
  return row ? new Blob([row.data], { type: row.type }) : null;
}

export async function deletePainting(id) {
  const db = await open();
  const t = db.transaction(['meta', 'images'], 'readwrite');
  t.objectStore('meta').delete(id);
  t.objectStore('images').delete(id);
  return done(t);
}
