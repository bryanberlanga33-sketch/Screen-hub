"use client";

import { useEffect, useState } from "react";

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
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const shouldShowPlaceholder = !imagePath || failedPath === imagePath;

  useEffect(() => {
    setFailedPath(null);
  }, [imagePath]);

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
            Add this file at {imagePath || "a scene path"} to replace the
            placeholder.
          </p>
        </div>
      ) : (
        // Plain img tags are easiest for local user-supplied files in /public.
        <img
          alt={name}
          className={`absolute inset-0 h-full w-full ${imageClassName}`}
          src={imagePath}
          onError={() => setFailedPath(imagePath)}
        />
      )}
    </div>
  );
}
