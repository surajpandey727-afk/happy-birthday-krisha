/**
 * IndexedDB store for the notebook — notes (rich text) and doodles (PNG
 * data URLs) live here rather than localStorage, since entries can get
 * large (a doodle alone can be hundreds of KB) and localStorage's ~5-10MB
 * quota fills fast with that. Small preferences (last-open note id, brush
 * defaults) stay on the existing localStorage-backed persistence layer.
 *
 * No IndexedDB wrapper library is installed anywhere in this project, and
 * the native API — while verbose — is small enough here (two object
 * stores, five operations) that adding a dependency for it isn't worth it.
 */

export interface Note {
  id: string;
  title: string;
  contentHtml: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Doodle {
  id: string;
  dataUrl: string;
  createdAt: number;
}

const DB_NAME = "olw-notebook";
const DB_VERSION = 1;
const NOTES_STORE = "notes";
const DOODLES_STORE = "doodles";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const store = db.createObjectStore(NOTES_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains(DOODLES_STORE)) {
        db.createObjectStore(DOODLES_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

function txAll<T>(storeName: string): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const t = db.transaction(storeName, "readonly");
        const req = t.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      })
  );
}

export const notebookDb = {
  async listNotes(): Promise<Note[]> {
    try {
      const notes = await txAll<Note>(NOTES_STORE);
      return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  },
  async putNote(note: Note): Promise<void> {
    await tx<IDBValidKey>(NOTES_STORE, "readwrite", (s) => s.put(note));
  },
  async deleteNote(id: string): Promise<void> {
    await tx<undefined>(NOTES_STORE, "readwrite", (s) => s.delete(id));
  },
  async listDoodles(): Promise<Doodle[]> {
    try {
      const doodles = await txAll<Doodle>(DOODLES_STORE);
      return doodles.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  },
  async putDoodle(doodle: Doodle): Promise<void> {
    await tx<IDBValidKey>(DOODLES_STORE, "readwrite", (s) => s.put(doodle));
  },
  async deleteDoodle(id: string): Promise<void> {
    await tx<undefined>(DOODLES_STORE, "readwrite", (s) => s.delete(id));
  },
};
