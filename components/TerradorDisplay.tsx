"use client";

import { DISPLAY_DEFINITIONS } from "@/data/defaultScenes";
import type { DisplayTarget, FloatingLayer } from "@/types/terrador";
import { MarchingOrderOverlay } from "./MarchingOrderOverlay";
import { useTerradorState } from "./useTerradorState";
import { VisualAsset } from "./VisualAsset";

interface TerradorDisplayProps {
  displayId: DisplayTarget;
}

const layerPositionClasses: Record<FloatingLayer["position"], string> = {
  "top-left": "left-8 top-8",
  "top-right": "right-8 top-8",
  "bottom-left": "bottom-8 left-8",
  "bottom-right": "bottom-8 right-8",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

function layerWidth(size: number) {
  return `${Math.min(100, Math.max(8, size))}%`;
}

export function TerradorDisplay({ displayId }: TerradorDisplayProps) {
  const { state } = useTerradorState();
  const displayDefinition = DISPLAY_DEFINITIONS.find(
    (display) => display.id === displayId,
  );
  const displayState = state.displays[displayId];
  const activeScene = state.scenes.find(
    (scene) => scene.id === displayState?.activeSceneId,
  );
  const visibleLayers = state.layers.filter(
    (layer) => layer.targetDisplay === displayId && layer.visible,
  );

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 transition-opacity duration-700 ease-out">
        {activeScene ? (
          <VisualAsset
            key={activeScene.id}
            name={activeScene.name}
            imagePath={activeScene.imagePath}
            className="h-full w-full"
            imageClassName="object-cover"
          />
        ) : (
          <VisualAsset
            name={displayDefinition?.label ?? "Terrador Display"}
            imagePath=""
            className="h-full w-full"
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/24" />

      <div className="pointer-events-none absolute inset-0 z-20">
        {visibleLayers.map((layer) => (
          <div
            key={layer.id}
            className={`absolute ${layerPositionClasses[layer.position]} drop-shadow-[0_0_30px_rgba(125,211,252,0.35)] transition-opacity duration-500`}
            style={{ width: layerWidth(layer.size) }}
          >
            <VisualAsset
              name={layer.name}
              imagePath={layer.imagePath}
              className="aspect-[4/3] w-full rounded-2xl border border-cyan-200/20 bg-slate-950/80"
              imageClassName="object-contain"
              placeholderClassName="rounded-2xl"
              compact
            />
          </div>
        ))}
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-700 ${
          displayState?.blackout ? "opacity-100" : "opacity-0"
        }`}
      />

      {displayState?.showMarchingOrder ? (
        <div className="pointer-events-none absolute inset-0 z-40">
          <MarchingOrderOverlay marchingOrder={state.marchingOrder} />
        </div>
      ) : null}
    </main>
  );
}
