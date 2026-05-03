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
  source?:
    | {
        provider: 'freesound';
        soundId: number;
        author: string;
        license: string;
        url: string;
      }
    | {
        provider: 'openverse';
        soundId: string;
        author: string;
        license: string;
        url: string;
      };
  /** Optional attribution if the picture came from a third party. */
  imageSource?:
    | {
        provider: 'pixabay';
        imageId: number;
        author: string;
        url: string;
      }
    | {
        provider: 'openverse';
        imageId: string;
        author: string;
        license: string;
        url: string;
      };
};

/**
 * Generate a unique ID. `crypto.randomUUID()` is only defined in secure contexts
 * (HTTPS/localhost), so we fall back to timestamp + random for plain HTTP on a
 * LAN — IDs are just local primary keys, no crypto needed.
 */
function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to the non-secure fallback.
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens (and migrates) the local IndexedDB.
 *
 * Schema-versioning rules of the road:
 *
 * - Adding optional fields to a SoundEntry does NOT need a version bump.
 *   IndexedDB stores arbitrary objects with no schema enforcement, so
 *   old records simply lack the new field.
 * - Adding an index, adding/renaming an object store, or otherwise
 *   changing structure DOES need a version bump. Increment DB_VERSION
 *   and add a new `if (oldVersion < N)` branch below — never remove or
 *   reorder existing branches.
 */
function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = event.oldVersion;
      if (oldVersion < 1) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
      // Future:
      // if (oldVersion < 2) {
      //   const store = req.transaction!.objectStore(STORE);
      //   store.createIndex('byLoudness', 'loudness');
      // }
    };

    req.onsuccess = () => resolve(req.result);

    req.onerror = () => {
      const err = req.error;
      if (err?.name === 'VersionError') {
        reject(
          new Error(
            'Your saved library was made by a newer version of the app. Please update the app to use it.',
          ),
        );
      } else {
        reject(err ?? new Error('Failed to open the local database.'));
      }
    };

    // Another tab still has the DB open at the previous version.
    req.onblocked = () => {
      reject(
        new Error(
          'Another tab is keeping the library open. Close other copies of the app and reload.',
        ),
      );
    };
  });
  return dbPromise;
}

export async function addSound(
  data: Omit<SoundEntry, 'id' | 'createdAt'>,
): Promise<SoundEntry> {
  const db = await openDb();
  const entry: SoundEntry = {
    ...data,
    id: randomId(),
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

/** In-place Fisher-Yates shuffle. Unbiased; safe for small arrays. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick `count` distinct entries with a clear loudest + softest. */
export function pickRound(library: SoundEntry[], count = 2): SoundEntry[] | null {
  if (library.length < count) return null;
  // Sort by loudness, force the extremes into the round, fill the middle randomly.
  const sorted = [...library].sort((a, b) => a.loudness - b.loudness);
  const softest = sorted[0];
  const loudest = sorted[sorted.length - 1];
  if (softest.loudness === loudest.loudness) return null;
  const middle = sorted.slice(1, -1);
  const fill = shuffle(middle).slice(0, count - 2);
  return shuffle([softest, loudest, ...fill]);
}
