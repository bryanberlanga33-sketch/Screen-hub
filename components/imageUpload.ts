"use client";

/**
 * Reads a user-selected image file and returns a compact data URL.
 *
 * Portraits are downscaled to `maxDim` and re-encoded so that a full roster of
 * combatants stays comfortably within the browser localStorage budget (the
 * whole app state is persisted there and mirrored across windows via
 * BroadcastChannel). WebP is used when the browser can encode it, otherwise we
 * fall back to the original data URL.
 */
export async function fileToResizedDataUrl(
  file: File,
  maxDim = 320,
  quality = 0.85,
): Promise<string> {
  const originalDataUrl = await readFileAsDataUrl(file);

  try {
    const image = await loadImage(originalDataUrl);
    const largestSide = Math.max(image.width, image.height) || 1;
    const scale = Math.min(1, maxDim / largestSide);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return originalDataUrl;
    }

    context.drawImage(image, 0, 0, width, height);

    const encoded = canvas.toDataURL("image/webp", quality);
    // Some browsers ignore unsupported types and return a PNG data URL; either
    // way a valid data URL is fine. Guard against an empty result.
    return encoded && encoded.startsWith("data:image")
      ? encoded
      : originalDataUrl;
  } catch {
    return originalDataUrl;
  }
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
