"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_DISPLAYS,
  DEFAULT_LAYERS,
  DEFAULT_SCENES,
} from "@/data/defaultScenes";
import type {
  DisplayTarget,
  FloatingLayer,
  Scene,
  TerradorState,
} from "@/types/terrador";

const STORAGE_KEY = "terrador-control-center-state-v1";
const CHANNEL_NAME = "terrador-control-center";

type StateUpdater = TerradorState | ((previous: TerradorState) => TerradorState);

type ChannelMessage = {
  type: "terrador-state";
  sourceId: string;
  state: TerradorState;
};

function createDefaultState(): TerradorState {
  return {
    scenes: DEFAULT_SCENES,
    layers: DEFAULT_LAYERS,
    displays: DEFAULT_DISPLAYS,
  };
}

function createId(label: string) {
  const safeLabel = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const randomSuffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${safeLabel || "terrador"}-${randomSuffix}`;
}

function normalizeState(state: TerradorState): TerradorState {
  const defaultState = createDefaultState();

  return {
    scenes: Array.isArray(state.scenes) ? state.scenes : defaultState.scenes,
    layers: Array.isArray(state.layers) ? state.layers : defaultState.layers,
    displays: {
      ...defaultState.displays,
      ...(state.displays ?? {}),
    },
  };
}

function loadState() {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY);
    return savedState
      ? normalizeState(JSON.parse(savedState) as TerradorState)
      : createDefaultState();
  } catch {
    return createDefaultState();
  }
}

function saveState(state: TerradorState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useTerradorState() {
  const [state, setState] = useState<TerradorState>(() => createDefaultState());
  const [loaded, setLoaded] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const sourceId = useRef(createId("dm-session"));

  useEffect(() => {
    const initialState = loadState();
    setState(initialState);
    setLoaded(true);

    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = (event: MessageEvent<ChannelMessage>) => {
        if (
          event.data?.type === "terrador-state" &&
          event.data.sourceId !== sourceId.current
        ) {
          const nextState = normalizeState(event.data.state);
          setState(nextState);
          saveState(nextState);
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setState(normalizeState(JSON.parse(event.newValue) as TerradorState));
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      channelRef.current?.close();
    };
  }, []);

  const publishState = useCallback((updater: StateUpdater) => {
    setState((previous) => {
      const nextState = normalizeState(
        typeof updater === "function" ? updater(previous) : updater,
      );

      saveState(nextState);
      channelRef.current?.postMessage({
        type: "terrador-state",
        sourceId: sourceId.current,
        state: nextState,
      } satisfies ChannelMessage);

      return nextState;
    });
  }, []);

  const activateScene = useCallback(
    (sceneId: string) => {
      publishState((previous) => {
        const scene = previous.scenes.find((item) => item.id === sceneId);

        if (!scene) {
          return previous;
        }

        return {
          ...previous,
          displays: {
            ...previous.displays,
            [scene.targetDisplay]: {
              activeSceneId: scene.id,
              blackout: false,
            },
          },
        };
      });
    },
    [publishState],
  );

  const activateRelativeScene = useCallback(
    (displayId: DisplayTarget, direction: 1 | -1) => {
      publishState((previous) => {
        const scenesForDisplay = previous.scenes.filter(
          (scene) => scene.targetDisplay === displayId,
        );

        if (scenesForDisplay.length === 0) {
          return previous;
        }

        const activeSceneId = previous.displays[displayId]?.activeSceneId;
        const activeIndex = scenesForDisplay.findIndex(
          (scene) => scene.id === activeSceneId,
        );
        const nextIndex =
          activeIndex === -1
            ? 0
            : (activeIndex + direction + scenesForDisplay.length) %
              scenesForDisplay.length;
        const nextScene = scenesForDisplay[nextIndex];

        return {
          ...previous,
          displays: {
            ...previous.displays,
            [displayId]: {
              activeSceneId: nextScene.id,
              blackout: false,
            },
          },
        };
      });
    },
    [publishState],
  );

  const addScene = useCallback(
    (targetDisplay: DisplayTarget) => {
      const newScene: Scene = {
        id: createId("new-scene"),
        name: "New Scene",
        imagePath: "/scenes/new-scene.jpg",
        targetDisplay,
        hotkey: "",
        description: "Describe what the players should feel here.",
      };

      publishState((previous) => ({
        ...previous,
        scenes: [...previous.scenes, newScene],
      }));

      return newScene.id;
    },
    [publishState],
  );

  const updateScene = useCallback(
    (sceneId: string, patch: Partial<Omit<Scene, "id">>) => {
      publishState((previous) => ({
        ...previous,
        scenes: previous.scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, ...patch } : scene,
        ),
      }));
    },
    [publishState],
  );

  const deleteScene = useCallback(
    (sceneId: string) => {
      publishState((previous) => {
        const deletedScene = previous.scenes.find((scene) => scene.id === sceneId);
        const nextScenes = previous.scenes.filter((scene) => scene.id !== sceneId);

        if (!deletedScene) {
          return previous;
        }

        const replacementScene = nextScenes.find(
          (scene) => scene.targetDisplay === deletedScene.targetDisplay,
        );

        return {
          ...previous,
          scenes: nextScenes,
          displays: {
            ...previous.displays,
            [deletedScene.targetDisplay]: {
              activeSceneId:
                previous.displays[deletedScene.targetDisplay]?.activeSceneId ===
                sceneId
                  ? (replacementScene?.id ?? null)
                  : previous.displays[deletedScene.targetDisplay]?.activeSceneId,
              blackout: false,
            },
          },
        };
      });
    },
    [publishState],
  );

  const setBlackout = useCallback(
    (displayId: DisplayTarget, blackout: boolean) => {
      publishState((previous) => ({
        ...previous,
        displays: {
          ...previous.displays,
          [displayId]: {
            ...previous.displays[displayId],
            blackout,
          },
        },
      }));
    },
    [publishState],
  );

  const toggleBlackout = useCallback(
    (displayId: DisplayTarget) => {
      publishState((previous) => ({
        ...previous,
        displays: {
          ...previous.displays,
          [displayId]: {
            ...previous.displays[displayId],
            blackout: !previous.displays[displayId]?.blackout,
          },
        },
      }));
    },
    [publishState],
  );

  const addLayer = useCallback(
    (targetDisplay: DisplayTarget) => {
      const newLayer: FloatingLayer = {
        id: createId("floating-layer"),
        name: "New Floating Layer",
        imagePath: "/overlays/new-layer.png",
        targetDisplay,
        size: 32,
        position: "center",
        visible: true,
      };

      publishState((previous) => ({
        ...previous,
        layers: [...previous.layers, newLayer],
      }));

      return newLayer.id;
    },
    [publishState],
  );

  const updateLayer = useCallback(
    (layerId: string, patch: Partial<Omit<FloatingLayer, "id">>) => {
      publishState((previous) => ({
        ...previous,
        layers: previous.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...patch } : layer,
        ),
      }));
    },
    [publishState],
  );

  const deleteLayer = useCallback(
    (layerId: string) => {
      publishState((previous) => ({
        ...previous,
        layers: previous.layers.filter((layer) => layer.id !== layerId),
      }));
    },
    [publishState],
  );

  const resetToDefaults = useCallback(() => {
    publishState(createDefaultState());
  }, [publishState]);

  return {
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
  };
}

export { STORAGE_KEY };
