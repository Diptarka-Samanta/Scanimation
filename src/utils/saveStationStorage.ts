import { SavedScanimationItem } from "../types";

const DB_NAME = "ScanimationStudioDB";
const DB_VERSION = 1;
const STORE_NAME = "scanimation_vault";
const LOCAL_STORAGE_FALLBACK_KEY = "scanimation_studio_saved_items_fallback";

// Helper to open IndexedDB with promise
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

// Fallback localStorage handlers
function getLocalStorageFallback(): SavedScanimationItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("localStorage fallback read failed:", e);
    return [];
  }
}

function setLocalStorageFallback(items: SavedScanimationItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("localStorage fallback write failed (storage may be full):", e);
  }
}

/**
 * Creates a fast compressed thumbnail data URL from a canvas or data URL
 */
export async function createThumbnail(
  source: HTMLCanvasElement | string,
  maxSize: number = 200
): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (typeof source !== "string") {
        const thumbCanvas = document.createElement("canvas");
        const scale = Math.min(maxSize / source.width, maxSize / source.height, 1);
        thumbCanvas.width = Math.round(source.width * scale);
        thumbCanvas.height = Math.round(source.height * scale);
        const ctx = thumbCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(source, 0, 0, thumbCanvas.width, thumbCanvas.height);
          resolve(thumbCanvas.toDataURL("image/webp", 0.85));
          return;
        }
      }

      const img = new Image();
      img.onload = () => {
        const thumbCanvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        thumbCanvas.width = Math.round(img.width * scale);
        thumbCanvas.height = Math.round(img.height * scale);
        const ctx = thumbCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
          resolve(thumbCanvas.toDataURL("image/webp", 0.85));
        } else {
          resolve(typeof source === "string" ? source : source.toDataURL());
        }
      };
      img.onerror = () => {
        resolve(typeof source === "string" ? source : source.toDataURL());
      };
      img.src = typeof source === "string" ? source : source.toDataURL();
    } catch {
      resolve(typeof source === "string" ? source : source.toDataURL());
    }
  });
}

/**
 * Retrieve all saved scanimations, sorted by creation date descending
 */
export async function getAllSavedItems(): Promise<SavedScanimationItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as SavedScanimationItem[]) || [];
        // Sort newest first
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };

      request.onerror = () => {
        console.warn("IndexedDB getAll failed, using fallback:", request.error);
        resolve(getLocalStorageFallback());
      };
    });
  } catch (err) {
    console.warn("IndexedDB unavailable, falling back to localStorage:", err);
    return getLocalStorageFallback();
  }
}

/**
 * Save a new scanimation or update an existing one
 */
export async function saveScanimationItem(item: SavedScanimationItem): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn("IndexedDB put failed:", request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("IndexedDB unavailable, saving to localStorage fallback:", err);
    const existing = getLocalStorageFallback().filter((i) => i.id !== item.id);
    existing.unshift(item);
    setLocalStorageFallback(existing);
  }
}

/**
 * Delete a saved scanimation by ID
 */
export async function deleteSavedItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB unavailable, deleting from localStorage fallback:", err);
    const existing = getLocalStorageFallback().filter((i) => i.id !== id);
    setLocalStorageFallback(existing);
  }
}

/**
 * Clear all items in the save station
 */
export async function clearAllSavedItems(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    setLocalStorageFallback([]);
  }
}

/**
 * Export all saved items as a formatted JSON backup file
 */
export async function exportSaveStationBackup(): Promise<string> {
  const items = await getAllSavedItems();
  const backup = {
    app: "Scanimation Studio",
    version: 1,
    exportedAt: new Date().toISOString(),
    itemCount: items.length,
    items,
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Import items from a JSON backup file
 */
export async function importSaveStationBackup(jsonString: string): Promise<number> {
  const parsed = JSON.parse(jsonString);
  const items: SavedScanimationItem[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.items)
    ? parsed.items
    : [];

  if (!items.length) {
    throw new Error("No valid scanimation items found in backup file.");
  }

  let count = 0;
  for (const item of items) {
    if (item.id && item.compositeDataUrl && item.slitWidth) {
      await saveScanimationItem(item);
      count++;
    }
  }

  return count;
}
