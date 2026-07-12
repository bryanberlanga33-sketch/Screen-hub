"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from "react";
import { assetRef } from "./assetLibrary";
import { useAssetLibrary } from "./useAssetLibrary";
import { VisualAsset } from "./VisualAsset";

function formatBytes(bytes: number) {
  if (!bytes) {
    return "0 KB";
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function AssetLibrary() {
  const { assets, ready, error, busy, upload, remove, rename } =
    useAssetLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = "";
    if (files && files.length > 0) {
      await upload(files);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files.length > 0) {
      await upload(event.dataTransfer.files);
    }
  };

  const handleCopy = async (id: string) => {
    const ref = assetRef(id);
    try {
      await navigator.clipboard.writeText(ref);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section className="rune-panel rounded-3xl p-5">
      <div className="relative z-10 grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Vault
            </p>
            <h2 className="text-2xl font-black">Asset Library</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Upload photos from your device once, then reuse them for scenes,
              floating layers, and combatant portraits. Images are stored in
              your browser (IndexedDB), so a big library will not overflow like
              small localStorage would.
            </p>
          </div>
          <div className="text-right text-xs text-cyan-200/70">
            <p>
              {assets.length} image{assets.length === 1 ? "" : "s"}
            </p>
            <p>{formatBytes(totalBytes)} stored</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        <div
          className={`asset-dropzone ${dragActive ? "is-active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <p className="text-sm font-bold text-cyan-100">
            {busy ? "Uploading..." : "Drop images here or click to upload"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            PNG, JPG, WEBP, GIF · large photos are auto-resized for display
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        {!ready ? (
          <p className="text-sm text-slate-300">Loading library...</p>
        ) : assets.length === 0 ? (
          <p className="rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-6 text-center text-sm text-slate-300">
            Your library is empty. Uploaded images will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <article
                key={asset.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-cyan-100/14 bg-slate-950/58"
              >
                <div className="aspect-video w-full">
                  <VisualAsset
                    name={asset.name}
                    imagePath={assetRef(asset.id)}
                    className="h-full w-full"
                    imageClassName="object-cover"
                    compact
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <input
                    className="steel-input py-1.5 text-sm"
                    value={asset.name}
                    onChange={(event) => rename(asset.id, event.target.value)}
                    aria-label="Asset name"
                  />
                  <p className="text-xs text-slate-400">
                    {asset.width && asset.height
                      ? `${asset.width}x${asset.height} · `
                      : ""}
                    {formatBytes(asset.size)}
                  </p>
                  <div className="mt-auto flex gap-2">
                    <button
                      className="steel-button quiet-button flex-1 py-1.5 text-xs"
                      onClick={() => handleCopy(asset.id)}
                    >
                      {copiedId === asset.id ? "Copied!" : "Copy Reference"}
                    </button>
                    <button
                      className="steel-button danger-button py-1.5 text-xs"
                      onClick={() => remove(asset.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
