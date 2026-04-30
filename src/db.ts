// Local IndexedDB store for teacher-curated sound entries.
// Each entry pairs a name + image + audio + a 0..100 loudness rating.

const DB_NAME = 'rain-game';
const DB_VERSION = 1;
const STORE = 'sounds';

export type SoundEntry = {
  id: string;
  name: string;
  image: Blob;
  audio: Blob;
  /** 0 = whisper-soft, 100 = roar-loud */
  loudness: number;
  createdAt: number;
  /** Optional trim window in seconds — plays this slice on tap. */
  startSec?: number;
  endSec?: number;
  /** Optional attribution if the audio came from a third party. */
  source?: {
    provider: 'freesound';
    soundId: number;
    author: string;
    license: string;
    url: string;
  };
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function addSound(
  data: Omit<SoundEntry, 'id' | 'createdAt'>,
): Promise<SoundEntry> {
  const db = await openDb();
  const entry: SoundEntry = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(entry);
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listSounds(): Promise<SoundEntry[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const items = (req.result as SoundEntry[]).sort((a, b) => a.loudness - b.loudness);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSound(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateSound(entry: SoundEntry): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Pick `count` distinct entries with a clear loudest + softest. */
export function pickRound(library: SoundEntry[], count = 4): SoundEntry[] | null {
  if (library.length < count) return null;
  // Sort by loudness, force the extremes into the round, fill the middle randomly.
  const sorted = [...library].sort((a, b) => a.loudness - b.loudness);
  const softest = sorted[0];
  const loudest = sorted[sorted.length - 1];
  if (softest.loudness === loudest.loudness) return null;
  const middle = sorted.slice(1, -1);
  const shuffledMiddle = middle.sort(() => Math.random() - 0.5);
  const fill = shuffledMiddle.slice(0, count - 2);
  const round = [softest, loudest, ...fill];
  return round.sort(() => Math.random() - 0.5);
}
