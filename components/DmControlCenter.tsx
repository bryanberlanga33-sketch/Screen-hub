"use client";

import { useEffect, useMemo, useState } from "react";
import { DISPLAY_DEFINITIONS } from "@/data/defaultScenes";
import type {
  DisplayTarget,
  FloatingLayer,
  LayerPosition,
  Scene,
} from "@/types/terrador";
import { STORAGE_KEY, useTerradorState } from "./useTerradorState";
import { VisualAsset } from "./VisualAsset";

const layerPositions: LayerPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
];

function displayLabel(displayId: DisplayTarget) {
  return (
    DISPLAY_DEFINITIONS.find((display) => display.id === displayId)?.label ??
    displayId
  );
}

function fileName(imagePath: string) {
  return imagePath.split("/").filter(Boolean).pop() ?? imagePath;
}

function isTypingField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
  );
}

interface DisplayPreviewCardProps {
  displayId: DisplayTarget;
  selected: boolean;
  scene?: Scene;
  blackout: boolean;
  onSelect: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleBlackout: () => void;
}

function DisplayPreviewCard({
  displayId,
  selected,
  scene,
  blackout,
  onSelect,
  onPrevious,
  onNext,
  onToggleBlackout,
}: DisplayPreviewCardProps) {
  const definition = DISPLAY_DEFINITIONS.find((display) => display.id === displayId);

  return (
    <section
      className={`rune-panel rounded-3xl p-4 ${
        selected ? "border-cyan-300/80 shadow-[0_0_30px_rgba(56,189,248,0.2)]" : ""
      }`}
    >
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/75">
              {definition?.label}
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-50">
              {scene?.name ?? "No scene assigned"}
            </h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
              blackout
                ? "border-red-400/50 bg-red-950/70 text-red-100"
                : "border-emerald-300/40 bg-emerald-950/40 text-emerald-100"
            }`}
          >
            {blackout ? "Black" : "Live"}
          </span>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-100/15 bg-black">
          <VisualAsset
            name={scene?.name ?? definition?.label ?? "Display"}
            imagePath={scene?.imagePath ?? ""}
            className="h-full w-full"
            compact
          />
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-500 ${
              blackout ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <p className="mt-3 min-h-10 text-sm text-slate-300/80">
          {definition?.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="steel-button quiet-button" onClick={onSelect}>
            {selected ? "Targeted" : "Set Target"}
          </button>
          <button className="steel-button danger-button" onClick={onToggleBlackout}>
            {blackout ? "Clear Black" : "Fade Black"}
          </button>
          <button className="steel-button quiet-button" onClick={onPrevious}>
            Previous
          </button>
          <button className="steel-button quiet-button" onClick={onNext}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

interface HotkeyTableProps {
  scenes: Scene[];
  onActivate: (scene: Scene) => void;
}

function HotkeyTable({ scenes, onActivate }: HotkeyTableProps) {
  return (
    <section className="rune-panel rounded-3xl p-5">
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Keyboard Runes
            </p>
            <h2 className="text-2xl font-black">Hotkey Table</h2>
          </div>
          <div className="rounded-2xl border border-cyan-200/15 bg-slate-950/60 px-4 py-2 text-sm text-cyan-100">
            B blackouts target, N/P cycle, F opens help
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">
              <tr>
                <th className="px-3 py-2">Hotkey</th>
                <th className="px-3 py-2">Target Screen</th>
                <th className="px-3 py-2">Scene Name</th>
                <th className="px-3 py-2">Image Filename</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene) => (
                <tr key={scene.id} className="bg-slate-950/58 text-slate-100">
                  <td className="rounded-l-xl px-3 py-3 font-black text-cyan-200">
                    {scene.hotkey || "-"}
                  </td>
                  <td className="px-3 py-3">{displayLabel(scene.targetDisplay)}</td>
                  <td className="px-3 py-3">{scene.name}</td>
                  <td className="px-3 py-3 text-slate-300">{fileName(scene.imagePath)}</td>
                  <td className="rounded-r-xl px-3 py-3">
                    <button
                      className="steel-button py-2 text-xs"
                      onClick={() => onActivate(scene)}
                    >
                      Activate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

interface SceneEditorProps {
  scenes: Scene[];
  selectedDisplay: DisplayTarget;
  editingSceneId: string | null;
  onAddScene: () => void;
  onSetEditingSceneId: (sceneId: string | null) => void;
  onActivate: (scene: Scene) => void;
  onUpdateScene: (sceneId: string, patch: Partial<Omit<Scene, "id">>) => void;
  onDeleteScene: (sceneId: string) => void;
}

function SceneEditor({
  scenes,
  selectedDisplay,
  editingSceneId,
  onAddScene,
  onSetEditingSceneId,
  onActivate,
  onUpdateScene,
  onDeleteScene,
}: SceneEditorProps) {
  return (
    <section className="rune-panel rounded-3xl p-5">
      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Scene Forge
            </p>
            <h2 className="text-2xl font-black">Scene Editor</h2>
          </div>
          <button className="steel-button" onClick={onAddScene}>
            Add New Scene to {displayLabel(selectedDisplay)}
          </button>
        </div>

        <div className="grid gap-4">
          {scenes.map((scene) => {
            const isEditing = editingSceneId === scene.id;

            return (
              <article
                key={scene.id}
                className="rounded-2xl border border-cyan-100/14 bg-slate-950/58 p-4"
              >
                {isEditing ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="grid gap-1 text-sm text-cyan-100">
                      Scene name
                      <input
                        className="steel-input"
                        value={scene.name}
                        onChange={(event) =>
                          onUpdateScene(scene.id, { name: event.target.value })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-cyan-100">
                      Image path
                      <input
                        className="steel-input"
                        value={scene.imagePath}
                        onChange={(event) =>
                          onUpdateScene(scene.id, { imagePath: event.target.value })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-cyan-100">
                      Target screen
                      <select
                        className="steel-input"
                        value={scene.targetDisplay}
                        onChange={(event) =>
                          onUpdateScene(scene.id, {
                            targetDisplay: event.target.value as DisplayTarget,
                          })
                        }
                      >
                        {DISPLAY_DEFINITIONS.map((display) => (
                          <option key={display.id} value={display.id}>
                            {display.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm text-cyan-100">
                      Hotkey
                      <input
                        className="steel-input"
                        maxLength={12}
                        value={scene.hotkey}
                        onChange={(event) =>
                          onUpdateScene(scene.id, {
                            hotkey: event.target.value.toUpperCase(),
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-cyan-100 lg:col-span-2">
                      Optional description
                      <textarea
                        className="steel-input min-h-20 resize-y"
                        value={scene.description ?? ""}
                        onChange={(event) =>
                          onUpdateScene(scene.id, {
                            description: event.target.value,
                          })
                        }
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 lg:col-span-2">
                      <button
                        className="steel-button"
                        onClick={() => onSetEditingSceneId(null)}
                      >
                        Done
                      </button>
                      <button
                        className="steel-button quiet-button"
                        onClick={() => onActivate(scene)}
                      >
                        Activate
                      </button>
                      <button
                        className="steel-button danger-button"
                        onClick={() => onDeleteScene(scene.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-[11rem_1fr_auto] md:items-center">
                    <VisualAsset
                      name={scene.name}
                      imagePath={scene.imagePath}
                      className="aspect-video rounded-xl border border-cyan-100/15"
                      compact
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-slate-50">
                          {scene.name}
                        </h3>
                        <span className="rounded-full border border-cyan-200/20 bg-cyan-950/40 px-3 py-1 text-xs font-bold text-cyan-100">
                          {scene.hotkey ? `Key ${scene.hotkey}` : "No hotkey"}
                        </span>
                        <span className="rounded-full border border-slate-400/20 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                          {displayLabel(scene.targetDisplay)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        {scene.description || "No description yet."}
                      </p>
                      <p className="mt-2 text-xs text-cyan-200/70">
                        {scene.imagePath}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        className="steel-button"
                        onClick={() => onActivate(scene)}
                      >
                        Activate
                      </button>
                      <button
                        className="steel-button quiet-button"
                        onClick={() => onSetEditingSceneId(scene.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="steel-button danger-button"
                        onClick={() => onDeleteScene(scene.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface LayerEditorProps {
  layers: FloatingLayer[];
  selectedDisplay: DisplayTarget;
  onAddLayer: () => void;
  onUpdateLayer: (
    layerId: string,
    patch: Partial<Omit<FloatingLayer, "id">>,
  ) => void;
  onDeleteLayer: (layerId: string) => void;
}

function LayerEditor({
  layers,
  selectedDisplay,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer,
}: LayerEditorProps) {
  return (
    <section className="rune-panel rounded-3xl p-5">
      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Floating Sigils
            </p>
            <h2 className="text-2xl font-black">Floating Layer Editor</h2>
          </div>
          <button className="steel-button" onClick={onAddLayer}>
            Add Layer to {displayLabel(selectedDisplay)}
          </button>
        </div>

        <div className="grid gap-4">
          {layers.map((layer) => (
            <article
              key={layer.id}
              className="grid gap-3 rounded-2xl border border-cyan-100/14 bg-slate-950/58 p-4 xl:grid-cols-[1fr_1fr_12rem_12rem_10rem_auto]"
            >
              <label className="grid gap-1 text-sm text-cyan-100">
                Name
                <input
                  className="steel-input"
                  value={layer.name}
                  onChange={(event) =>
                    onUpdateLayer(layer.id, { name: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-sm text-cyan-100">
                Image path
                <input
                  className="steel-input"
                  value={layer.imagePath}
                  onChange={(event) =>
                    onUpdateLayer(layer.id, { imagePath: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-sm text-cyan-100">
                Target display
                <select
                  className="steel-input"
                  value={layer.targetDisplay}
                  onChange={(event) =>
                    onUpdateLayer(layer.id, {
                      targetDisplay: event.target.value as DisplayTarget,
                    })
                  }
                >
                  {DISPLAY_DEFINITIONS.map((display) => (
                    <option key={display.id} value={display.id}>
                      {display.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-cyan-100">
                Position
                <select
                  className="steel-input"
                  value={layer.position}
                  onChange={(event) =>
                    onUpdateLayer(layer.id, {
                      position: event.target.value as LayerPosition,
                    })
                  }
                >
                  {layerPositions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm text-cyan-100">
                Size %
                <input
                  className="steel-input"
                  min={8}
                  max={100}
                  type="number"
                  value={layer.size}
                  onChange={(event) =>
                    onUpdateLayer(layer.id, {
                      size: Number(event.target.value),
                    })
                  }
                />
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <button
                  className={`steel-button ${layer.visible ? "" : "quiet-button"}`}
                  onClick={() =>
                    onUpdateLayer(layer.id, { visible: !layer.visible })
                  }
                >
                  {layer.visible ? "Hide" : "Show"}
                </button>
                <button
                  className="steel-button danger-button"
                  onClick={() => onDeleteLayer(layer.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DmControlCenter() {
  const {
    state,
    loaded,
    activateScene,
    activateRelativeScene,
    addScene,
    updateScene,
    deleteScene,
    setBlackout,
    toggleBlackout,
    addLayer,
    updateLayer,
    deleteLayer,
    resetToDefaults,
  } = useTerradorState();
  const [selectedDisplay, setSelectedDisplay] =
    useState<DisplayTarget>("player-art");
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [showFullscreenHelp, setShowFullscreenHelp] = useState(false);

  const activeScenesByDisplay = useMemo(() => {
    return DISPLAY_DEFINITIONS.reduce(
      (accumulator, display) => {
        accumulator[display.id] = state.scenes.find(
          (scene) => scene.id === state.displays[display.id]?.activeSceneId,
        );
        return accumulator;
      },
      {} as Record<DisplayTarget, Scene | undefined>,
    );
  }, [state.displays, state.scenes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingField(event.target)) {
        return;
      }

      const key = event.key.toUpperCase();
      const hotkeyScene = state.scenes.find(
        (scene) => scene.hotkey.toUpperCase() === key,
      );

      if (hotkeyScene) {
        event.preventDefault();
        setSelectedDisplay(hotkeyScene.targetDisplay);
        activateScene(hotkeyScene.id);
        return;
      }

      if (key === "B") {
        event.preventDefault();
        toggleBlackout(selectedDisplay);
      }

      if (key === "N") {
        event.preventDefault();
        activateRelativeScene(selectedDisplay, 1);
      }

      if (key === "P") {
        event.preventDefault();
        activateRelativeScene(selectedDisplay, -1);
      }

      if (key === "F") {
        event.preventDefault();
        setShowFullscreenHelp((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activateRelativeScene,
    activateScene,
    selectedDisplay,
    state.scenes,
    toggleBlackout,
  ]);

  const handleAddScene = () => {
    const newSceneId = addScene(selectedDisplay);
    setEditingSceneId(newSceneId);
  };

  const handleDeleteScene = (sceneId: string) => {
    deleteScene(sceneId);
    if (editingSceneId === sceneId) {
      setEditingSceneId(null);
    }
  };

  const handleActivateScene = (scene: Scene) => {
    setSelectedDisplay(scene.targetDisplay);
    activateScene(scene.id);
  };

  return (
    <main className="min-h-screen px-5 py-6 text-slate-100 lg:px-8">
      <header className="mx-auto max-w-7xl">
        <div className="rune-panel overflow-hidden rounded-[2rem] p-6">
          <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.45em] text-cyan-300/75">
                Terrador Campaign
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-6xl">
                Terrador Control Center
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Local DM command console for controlling player art, battle maps,
                secondary visuals, blackouts, and floating overlays across browser
                windows.
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <span className="rounded-2xl border border-cyan-200/20 bg-slate-950/70 px-4 py-2 text-cyan-100">
                Storage: {loaded ? "localStorage synced" : "loading saved data"}
              </span>
              <span className="rounded-2xl border border-cyan-200/20 bg-slate-950/70 px-4 py-2 text-cyan-100">
                Keyboard target: {displayLabel(selectedDisplay)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-6 grid max-w-7xl gap-6">
        <section className="grid gap-4 lg:grid-cols-3">
          {DISPLAY_DEFINITIONS.map((display) => (
            <DisplayPreviewCard
              key={display.id}
              displayId={display.id}
              selected={selectedDisplay === display.id}
              scene={activeScenesByDisplay[display.id]}
              blackout={state.displays[display.id]?.blackout ?? false}
              onSelect={() => setSelectedDisplay(display.id)}
              onPrevious={() => activateRelativeScene(display.id, -1)}
              onNext={() => activateRelativeScene(display.id, 1)}
              onToggleBlackout={() => toggleBlackout(display.id)}
            />
          ))}
        </section>

        <section className="rune-panel rounded-3xl p-5">
          <div className="relative z-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                Display Launch Bay
              </p>
              <h2 className="text-2xl font-black">Open Visual Windows</h2>
              <p className="mt-2 text-sm text-slate-300">
                Open each display in a new browser window, drag it to a TV or
                monitor, then make that browser window full screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DISPLAY_DEFINITIONS.map((display) => (
                <a
                  key={display.id}
                  className="steel-button"
                  href={display.route}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open {display.label}
                </a>
              ))}
              <button
                className="steel-button quiet-button"
                onClick={() => setShowFullscreenHelp(true)}
              >
                Fullscreen Help (F)
              </button>
              <button
                className="steel-button danger-button"
                onClick={resetToDefaults}
              >
                Reset Saved Data
              </button>
            </div>
          </div>
        </section>

        <HotkeyTable scenes={state.scenes} onActivate={handleActivateScene} />

        <SceneEditor
          scenes={state.scenes}
          selectedDisplay={selectedDisplay}
          editingSceneId={editingSceneId}
          onAddScene={handleAddScene}
          onSetEditingSceneId={setEditingSceneId}
          onActivate={handleActivateScene}
          onUpdateScene={updateScene}
          onDeleteScene={handleDeleteScene}
        />

        <LayerEditor
          layers={state.layers}
          selectedDisplay={selectedDisplay}
          onAddLayer={() => addLayer(selectedDisplay)}
          onUpdateLayer={updateLayer}
          onDeleteLayer={deleteLayer}
        />
      </div>

      {showFullscreenHelp ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
          <section className="rune-panel max-w-2xl rounded-3xl p-6">
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                Fullscreen Rune
              </p>
              <h2 className="mt-1 text-3xl font-black">Display Setup Help</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-200">
                <li>Click an Open Display button above.</li>
                <li>Drag the new browser window to the TV or monitor you want.</li>
                <li>Use the browser full-screen command for that window.</li>
                <li>
                  Return to this DM panel and use scene buttons or hotkeys. The
                  display window updates locally through BroadcastChannel.
                </li>
              </ol>
              <p className="mt-4 rounded-2xl border border-cyan-200/20 bg-slate-950/70 p-3 text-sm text-cyan-100">
                If saved data gets messy, press Reset Saved Data or clear the
                browser key named <code>{STORAGE_KEY}</code>.
              </p>
              <button
                className="steel-button mt-5"
                onClick={() => setShowFullscreenHelp(false)}
              >
                Close Help
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
