"use client";

import { type ChangeEvent, useRef } from "react";
import { assetRef } from "./assetLibrary";
import { useAssetLibrary } from "./useAssetLibrary";
import { VisualAsset } from "./VisualAsset";

interface AssetPickerProps {
  title?: string;
  onPick: (ref: string) => void;
  onClose: () => void;
}

export function AssetPicker({
  title = "Choose from Asset Library",
  onPick,
  onClose,
}: AssetPickerProps) {
  const { assets, ready, error, busy, upload } = useAssetLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    // Copy File references out before clearing the input: `event.target.files`
    // is a live FileList that resetting `value` would empty.
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    const ids = await upload(files);
    if (ids.length > 0) {
      onPick(assetRef(ids[0]));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="rune-panel max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative z-10 flex max-h-[calc(85vh-3rem)] flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                Asset Library
              </p>
              <h2 className="text-2xl font-black">{title}</h2>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFiles}
              />
              <button
                className="steel-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                {busy ? "Uploading..." : "Upload New"}
              </button>
              <button className="steel-button quiet-button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          {error ? (
            <p className="mb-3 rounded-xl border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {!ready ? (
              <p className="text-sm text-slate-300">Loading library...</p>
            ) : assets.length === 0 ? (
              <p className="rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-6 text-center text-sm text-slate-300">
                No images yet. Click <strong>Upload New</strong> to add photos
                from your device.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    className="group overflow-hidden rounded-2xl border border-cyan-100/15 bg-slate-950/60 text-left transition hover:border-cyan-300/70"
                    onClick={() => onPick(assetRef(asset.id))}
                    title={`Use ${asset.name}`}
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
                    <p className="truncate px-2 py-1.5 text-xs text-slate-200">
                      {asset.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
