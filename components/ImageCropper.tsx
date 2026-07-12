"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cropImageDataUrl, getCropRect, loadImage } from "./imageUpload";

interface ImageCropperProps {
  title: string;
  source: string;
  outputWidth: number;
  outputHeight: number;
  aspectLabel: string;
  applyLabel?: string;
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropper({
  title,
  source,
  outputWidth,
  outputHeight,
  aspectLabel,
  applyLabel = "Apply Crop",
  onApply,
  onCancel,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImage(null);
    setError(null);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);

    loadImage(source)
      .then((loadedImage) => {
        if (!cancelled) {
          setImage(loadedImage);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load that image for cropping.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  const cropSummary = useMemo(() => {
    if (!image) {
      return null;
    }

    const crop = getCropRect({
      imageWidth: image.width,
      imageHeight: image.height,
      aspectRatio: outputWidth / outputHeight,
      zoom,
      offsetX,
      offsetY,
    });

    return `${Math.round(crop.width)} x ${Math.round(crop.height)} source pixels`;
  }, [image, offsetX, offsetY, outputHeight, outputWidth, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || !image) {
      return;
    }

    const crop = getCropRect({
      imageWidth: image.width,
      imageHeight: image.height,
      aspectRatio: outputWidth / outputHeight,
      zoom,
      offsetX,
      offsetY,
    });

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    context.clearRect(0, 0, outputWidth, outputHeight);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      outputWidth,
      outputHeight,
    );
  }, [image, offsetX, offsetY, outputHeight, outputWidth, zoom]);

  const handleApply = async () => {
    setApplying(true);
    setError(null);

    try {
      const cropped = await cropImageDataUrl({
        source,
        outputWidth,
        outputHeight,
        zoom,
        offsetX,
        offsetY,
      });
      onApply(cropped);
    } catch {
      setError("Could not create the cropped image.");
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <section className="rune-panel max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl p-5">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Fixed Crop Frame
            </p>
            <h2 className="mt-1 text-3xl font-black text-white">{title}</h2>
            <p className="mt-2 text-sm text-slate-300">
              Preview shows the exact {aspectLabel} frame that will be saved.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-100/20 bg-black shadow-[0_0_35px_rgba(56,189,248,0.12)]">
              {error ? (
                <div className="grid min-h-72 place-items-center p-6 text-center text-red-200">
                  {error}
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="block h-auto w-full"
                  style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
                />
              )}
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-2xl border border-cyan-100/14 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                Saved Size
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {outputWidth} x {outputHeight}
              </p>
              <p className="mt-1 text-sm text-slate-300">{aspectLabel}</p>
              {cropSummary ? (
                <p className="mt-2 text-xs text-cyan-200/70">{cropSummary}</p>
              ) : null}
            </div>

            <label className="grid gap-2 text-sm text-cyan-100">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>

            <label className="grid gap-2 text-sm text-cyan-100">
              Move left / right
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={offsetX}
                onChange={(event) => setOffsetX(Number(event.target.value))}
              />
            </label>

            <label className="grid gap-2 text-sm text-cyan-100">
              Move up / down
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={offsetY}
                onChange={(event) => setOffsetY(Number(event.target.value))}
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button
                className="steel-button"
                disabled={!image || applying}
                onClick={handleApply}
              >
                {applying ? "Cropping..." : applyLabel}
              </button>
              <button className="steel-button quiet-button" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
