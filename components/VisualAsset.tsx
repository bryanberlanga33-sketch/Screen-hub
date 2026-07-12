"use client";

import { useEffect, useState } from "react";
import { getAssetObjectUrl, isAssetRef, assetIdFromRef, subscribeAssets } from "./assetLibrary";

interface VisualAssetProps {
  name: string;
  imagePath: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  compact?: boolean;
}

export function VisualAsset({
  name,
  imagePath,
  className = "",
  imageClassName = "object-cover",
  placeholderClassName = "",
  compact = false,
}: VisualAssetProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [resolvedAsset, setResolvedAsset] = useState<{
    ref: string;
    url: string | null;
  }>({ ref: "", url: null });

  const isRef = isAssetRef(imagePath);

  // Asset-library images live in IndexedDB and are referenced as
  // `library:<id>`. Resolve those to a per-window object URL; plain paths and
  // data URLs are used directly during render.
  useEffect(() => {
    if (!isRef) {
      return;
    }

    let active = true;
    const resolve = () => {
      getAssetObjectUrl(assetIdFromRef(imagePath))
        .then((url) => {
          if (active) {
            setResolvedAsset({ ref: imagePath, url });
          }
        })
        .catch(() => {
          if (active) {
            setResolvedAsset({ ref: imagePath, url: null });
          }
        });
    };

    resolve();
    const unsubscribe = subscribeAssets(resolve);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [imagePath, isRef]);

  const resolvedSrc = isRef
    ? resolvedAsset.ref === imagePath
      ? resolvedAsset.url
      : null
    : imagePath || null;

  const shouldShowPlaceholder = !resolvedSrc || failedSrc === resolvedSrc;

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
      {shouldShowPlaceholder ? (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.22),rgba(15,23,42,0.96))] text-center ${placeholderClassName}`}
        >
          <div className="absolute inset-5 border border-cyan-200/15" />
          <p
            className={`relative z-10 font-black uppercase tracking-[0.18em] text-cyan-100 ${
              compact ? "text-xs" : "text-4xl"
            }`}
          >
            {name}
          </p>
          <p
            className={`relative z-10 mt-3 max-w-[80%] text-cyan-200/70 ${
              compact ? "hidden" : "text-sm"
            }`}
          >
            {isAssetRef(imagePath)
              ? "Pick an image from the Asset Library to replace the placeholder."
              : `Add this file at ${imagePath || "a scene path"} to replace the placeholder.`}
          </p>
        </div>
      ) : (
        // Plain img tags are easiest for local user-supplied files and blob URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={name}
          className={`absolute inset-0 h-full w-full ${imageClassName}`}
          src={resolvedSrc}
          onError={() => setFailedSrc(resolvedSrc)}
        />
      )}
    </div>
  );
}
