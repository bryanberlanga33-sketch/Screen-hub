"use client";

/**
 * Asset Library storage layer, backed by IndexedDB.
 *
 * Why IndexedDB instead of localStorage: localStorage has a small (~5MB),
 * synchronous, string-only budget, so storing photos as base64 quickly throws
 * QuotaExceededError and "bugs out". IndexedDB stores image Blobs natively with
 * a much larger quota, so a library of photos fits comfortably. It is shared
 * across same-origin tabs/windows, so the DM panel and the display windows all
 * read the same assets. Only a short `library:<id>` reference is ever placed in
 * the app state (localStorage + BroadcastChannel), keeping sync small and fast.
 */

export interface AssetRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  createdAt: number;
  blob: Blob;
}

export type AssetMeta = Omit<AssetRecord, "blob">;

export const ASSET_REF_PREFIX = "library:";

const DB_NAME = "terrador-asset-library";
const DB_VERSION = 1;
const STORE = "assets";
const CHANNEL_NAME = "terrador-assets";

export function isAssetRef(value: string | undefined | null): value is string {
  return typeof value === "string" && value.startsWith(ASSET_REF_PREFIX);
}

export function assetRef(id: string) {
  return `${ASSET_REF_PREFIX}${id}`;
}

export function assetIdFromRef(ref: string) {
  return ref.startsWith(ASSET_REF_PREFIX)
    ? ref.slice(ASSET_REF_PREFIX.length)
    : ref;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `asset-${crypto.randomUUID()}`;
  }
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = run(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => reject(transaction.error);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed"));
    image.src = src;
  });
}

/**
 * Downscales very large images (TV/monitor display never needs more than a
 * couple thousand pixels) and re-encodes to WebP to keep stored blobs small,
 * while leaving already-small or non-decodable files untouched.
 */
async function normalizeImage(
  file: File,
  maxDim = 1920,
  quality = 0.85,
): Promise<{ blob: Blob; type: string; width: number; height: number }> {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const largestSide = Math.max(image.width, image.height) || 1;
    const scale = Math.min(1, maxDim / largestSide);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return { blob: file, type: file.type, width: image.width, height: image.height };
    }
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob) {
      return { blob, type: "image/webp", width, height };
    }
    return { blob: file, type: file.type, width: image.width, height: image.height };
  } catch {
    return { blob: file, type: file.type || "image/*", width: 0, height: 0 };
  }
}

// ---- Object URL cache (per window) -----------------------------------------

const urlCache = new Map<string, string>();

export async function getAssetObjectUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) {
    return cached;
  }
  const record = await getAsset(id);
  if (!record) {
    return null;
  }
  const url = URL.createObjectURL(record.blob);
  urlCache.set(id, url);
  return url;
}

function clearUrlCache() {
  for (const url of urlCache.values()) {
    URL.revokeObjectURL(url);
  }
  urlCache.clear();
}

// ---- Change notifications --------------------------------------------------

const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

function ensureChannel() {
  if (channel || typeof BroadcastChannel === "undefined") {
    return;
  }
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = () => {
    clearUrlCache();
    listeners.forEach((listener) => listener());
  };
}

export function subscribeAssets(listener: () => void): () => void {
  ensureChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyChange() {
  clearUrlCache();
  listeners.forEach((listener) => listener());
  ensureChannel();
  channel?.postMessage({ type: "assets-changed" });
}

// ---- CRUD ------------------------------------------------------------------

export async function addAsset(file: File): Promise<AssetMeta> {
  const { blob, type, width, height } = await normalizeImage(file);
  const record: AssetRecord = {
    id: createId(),
    name: file.name || "Untitled",
    type,
    size: blob.size,
    width,
    height,
    createdAt: Date.now(),
    blob,
  };

  await withStore("readwrite", (store) => store.put(record));
  notifyChange();

  const { blob: _omitBlob, ...meta } = record;
  void _omitBlob;
  return meta;
}

export async function getAsset(id: string): Promise<AssetRecord | undefined> {
  return withStore<AssetRecord | undefined>("readonly", (store) =>
    store.get(id),
  );
}

export async function getAllAssets(): Promise<AssetRecord[]> {
  const all = await withStore<AssetRecord[]>("readonly", (store) =>
    store.getAll(),
  );
  return (all ?? []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteAsset(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
  notifyChange();
}

export async function renameAsset(id: string, name: string): Promise<void> {
  const record = await getAsset(id);
  if (!record) {
    return;
  }
  record.name = name;
  await withStore("readwrite", (store) => store.put(record));
  notifyChange();
}
