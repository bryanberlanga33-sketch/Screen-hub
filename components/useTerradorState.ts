"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_DISPLAYS,
  DEFAULT_LAYERS,
  DEFAULT_MARCHING_ORDER,
  DEFAULT_PLAYER_CARDS_STATE,
  DEFAULT_SCENES,
  MARCHING_ORDER_POSITIONS,
} from "@/data/defaultScenes";
import type {
  Combatant,
  CombatantKind,
  ConditionType,
  DisplaysState,
  DisplayState,
  DisplayTarget,
  FloatingLayer,
  MarchingOrderPosition,
  MarchingOrderState,
  PlayerCard,
  PlayerCardsState,
  Scene,
  TerradorState,
} from "@/types/terrador";

const CONDITION_SWATCHES = [
  "#38bdf8",
  "#f97316",
  "#a855f7",
  "#22c55e",
  "#ef4444",
  "#eab308",
  "#ec4899",
  "#14b8a6",
];

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
    marchingOrder: DEFAULT_MARCHING_ORDER,
    playerCards: DEFAULT_PLAYER_CARDS_STATE,
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

function normalizeDisplayState(
  saved: Partial<DisplayState> | undefined,
  fallback: DisplayState,
): DisplayState {
  return {
    activeSceneId:
      saved && "activeSceneId" in saved
        ? (saved.activeSceneId ?? null)
        : fallback.activeSceneId,
    blackout: Boolean(saved?.blackout),
    showMarchingOrder: Boolean(saved?.showMarchingOrder),
    showPlayerCards: Boolean(saved?.showPlayerCards),
  };
}

function normalizeDisplays(
  saved: Partial<DisplaysState> | undefined,
): DisplaysState {
  const fallback = DEFAULT_DISPLAYS;

  return {
    "player-art": normalizeDisplayState(
      saved?.["player-art"],
      fallback["player-art"],
    ),
    "battle-map": normalizeDisplayState(
      saved?.["battle-map"],
      fallback["battle-map"],
    ),
    secondary: normalizeDisplayState(saved?.secondary, fallback.secondary),
  };
}

function normalizeMarchingOrder(
  saved: Partial<MarchingOrderState> | undefined,
): MarchingOrderState {
  if (!saved || typeof saved !== "object") {
    return DEFAULT_MARCHING_ORDER;
  }

  const conditions: ConditionType[] = Array.isArray(saved.conditions)
    ? saved.conditions
        .filter((condition): condition is ConditionType => Boolean(condition?.id))
        .map((condition) => ({
          id: String(condition.id),
          label: String(condition.label ?? "Condition"),
          color: String(condition.color ?? "#38bdf8"),
        }))
    : DEFAULT_MARCHING_ORDER.conditions;

  const conditionIdSet = new Set(conditions.map((condition) => condition.id));

  const combatants: Combatant[] = Array.isArray(saved.combatants)
    ? saved.combatants
        .filter((combatant): combatant is Combatant => Boolean(combatant?.id))
        .map((combatant) => ({
          id: String(combatant.id),
          name: String(combatant.name ?? "Unnamed"),
          image: typeof combatant.image === "string" ? combatant.image : "",
          kind: (["player", "ally", "enemy"] as CombatantKind[]).includes(
            combatant.kind,
          )
            ? combatant.kind
            : "player",
          conditionIds: Array.isArray(combatant.conditionIds)
            ? combatant.conditionIds.filter((id) => conditionIdSet.has(id))
            : [],
        }))
    : DEFAULT_MARCHING_ORDER.combatants;

  const activeCombatantId =
    saved.activeCombatantId &&
    combatants.some((combatant) => combatant.id === saved.activeCombatantId)
      ? saved.activeCombatantId
      : (combatants[0]?.id ?? null);

  const position = MARCHING_ORDER_POSITIONS.some(
    (option) => option.value === saved.position,
  )
    ? (saved.position as MarchingOrderPosition)
    : DEFAULT_MARCHING_ORDER.position;

  return {
    title: typeof saved.title === "string" ? saved.title : DEFAULT_MARCHING_ORDER.title,
    combatants,
    conditions,
    activeCombatantId,
    position,
  };
}

function normalizePlayerCards(
  saved: Partial<PlayerCardsState> | undefined,
): PlayerCardsState {
  if (!saved || typeof saved !== "object") {
    return DEFAULT_PLAYER_CARDS_STATE;
  }

  const cards: PlayerCard[] = Array.isArray(saved.cards)
    ? saved.cards
        .filter((card): card is PlayerCard => Boolean(card?.id))
        .map((card) => ({
          id: String(card.id),
          name: String(card.name ?? "Player Card"),
          image: typeof card.image === "string" ? card.image : "",
          visible: card.visible !== false,
        }))
    : DEFAULT_PLAYER_CARDS_STATE.cards;

  const position = MARCHING_ORDER_POSITIONS.some(
    (option) => option.value === saved.position,
  )
    ? (saved.position as MarchingOrderPosition)
    : DEFAULT_PLAYER_CARDS_STATE.position;

  return {
    title:
      typeof saved.title === "string"
        ? saved.title
        : DEFAULT_PLAYER_CARDS_STATE.title,
    cards,
    position,
  };
}

function normalizeState(state: TerradorState): TerradorState {
  const defaultState = createDefaultState();

  return {
    scenes: Array.isArray(state.scenes) ? state.scenes : defaultState.scenes,
    layers: Array.isArray(state.layers) ? state.layers : defaultState.layers,
    displays: normalizeDisplays(state.displays),
    marchingOrder: normalizeMarchingOrder(state.marchingOrder),
    playerCards: normalizePlayerCards(state.playerCards),
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

  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

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
              ...previous.displays[scene.targetDisplay],
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
              ...previous.displays[displayId],
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
              ...previous.displays[deletedScene.targetDisplay],
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

  const updateMarchingOrder = useCallback(
    (updater: (previous: MarchingOrderState) => MarchingOrderState) => {
      publishState((previous) => ({
        ...previous,
        marchingOrder: updater(previous.marchingOrder),
      }));
    },
    [publishState],
  );

  const updatePlayerCards = useCallback(
    (updater: (previous: PlayerCardsState) => PlayerCardsState) => {
      publishState((previous) => ({
        ...previous,
        playerCards: updater(previous.playerCards),
      }));
    },
    [publishState],
  );

  const setMarchingOrderTitle = useCallback(
    (title: string) => {
      updateMarchingOrder((previous) => ({ ...previous, title }));
    },
    [updateMarchingOrder],
  );

  const setMarchingOrderPosition = useCallback(
    (position: MarchingOrderPosition) => {
      updateMarchingOrder((previous) => ({ ...previous, position }));
    },
    [updateMarchingOrder],
  );

  const addCombatant = useCallback(
    (kind: CombatantKind) => {
      const newCombatant: Combatant = {
        id: createId(kind),
        name:
          kind === "enemy"
            ? "New Enemy"
            : kind === "ally"
              ? "New Ally"
              : "New Hero",
        image: "",
        kind,
        conditionIds: [],
      };

      updateMarchingOrder((previous) => ({
        ...previous,
        combatants: [...previous.combatants, newCombatant],
        activeCombatantId: previous.activeCombatantId ?? newCombatant.id,
      }));

      return newCombatant.id;
    },
    [updateMarchingOrder],
  );

  const updateCombatant = useCallback(
    (combatantId: string, patch: Partial<Omit<Combatant, "id">>) => {
      updateMarchingOrder((previous) => ({
        ...previous,
        combatants: previous.combatants.map((combatant) =>
          combatant.id === combatantId
            ? { ...combatant, ...patch }
            : combatant,
        ),
      }));
    },
    [updateMarchingOrder],
  );

  const deleteCombatant = useCallback(
    (combatantId: string) => {
      updateMarchingOrder((previous) => {
        const nextCombatants = previous.combatants.filter(
          (combatant) => combatant.id !== combatantId,
        );

        return {
          ...previous,
          combatants: nextCombatants,
          activeCombatantId:
            previous.activeCombatantId === combatantId
              ? (nextCombatants[0]?.id ?? null)
              : previous.activeCombatantId,
        };
      });
    },
    [updateMarchingOrder],
  );

  const moveCombatant = useCallback(
    (combatantId: string, direction: 1 | -1) => {
      updateMarchingOrder((previous) => {
        const index = previous.combatants.findIndex(
          (combatant) => combatant.id === combatantId,
        );
        const targetIndex = index + direction;

        if (
          index === -1 ||
          targetIndex < 0 ||
          targetIndex >= previous.combatants.length
        ) {
          return previous;
        }

        const combatants = [...previous.combatants];
        [combatants[index], combatants[targetIndex]] = [
          combatants[targetIndex],
          combatants[index],
        ];

        return { ...previous, combatants };
      });
    },
    [updateMarchingOrder],
  );

  const toggleCombatantCondition = useCallback(
    (combatantId: string, conditionId: string) => {
      updateMarchingOrder((previous) => ({
        ...previous,
        combatants: previous.combatants.map((combatant) => {
          if (combatant.id !== combatantId) {
            return combatant;
          }

          const hasCondition = combatant.conditionIds.includes(conditionId);

          return {
            ...combatant,
            conditionIds: hasCondition
              ? combatant.conditionIds.filter((id) => id !== conditionId)
              : [...combatant.conditionIds, conditionId],
          };
        }),
      }));
    },
    [updateMarchingOrder],
  );

  const setActiveCombatant = useCallback(
    (combatantId: string | null) => {
      updateMarchingOrder((previous) => ({
        ...previous,
        activeCombatantId: combatantId,
      }));
    },
    [updateMarchingOrder],
  );

  const advanceTurn = useCallback(
    (direction: 1 | -1) => {
      updateMarchingOrder((previous) => {
        if (previous.combatants.length === 0) {
          return previous;
        }

        const activeIndex = previous.combatants.findIndex(
          (combatant) => combatant.id === previous.activeCombatantId,
        );
        const nextIndex =
          activeIndex === -1
            ? 0
            : (activeIndex + direction + previous.combatants.length) %
              previous.combatants.length;

        return {
          ...previous,
          activeCombatantId: previous.combatants[nextIndex].id,
        };
      });
    },
    [updateMarchingOrder],
  );

  const addCondition = useCallback(() => {
    const newCondition: ConditionType = {
      id: createId("condition"),
      label: "New Condition",
      color:
        CONDITION_SWATCHES[
          Math.floor(Math.random() * CONDITION_SWATCHES.length)
        ],
    };

    updateMarchingOrder((previous) => ({
      ...previous,
      conditions: [...previous.conditions, newCondition],
    }));

    return newCondition.id;
  }, [updateMarchingOrder]);

  const updateCondition = useCallback(
    (conditionId: string, patch: Partial<Omit<ConditionType, "id">>) => {
      updateMarchingOrder((previous) => ({
        ...previous,
        conditions: previous.conditions.map((condition) =>
          condition.id === conditionId
            ? { ...condition, ...patch }
            : condition,
        ),
      }));
    },
    [updateMarchingOrder],
  );

  const deleteCondition = useCallback(
    (conditionId: string) => {
      updateMarchingOrder((previous) => ({
        ...previous,
        conditions: previous.conditions.filter(
          (condition) => condition.id !== conditionId,
        ),
        combatants: previous.combatants.map((combatant) => ({
          ...combatant,
          conditionIds: combatant.conditionIds.filter(
            (id) => id !== conditionId,
          ),
        })),
      }));
    },
    [updateMarchingOrder],
  );

  const setPlayerCardsTitle = useCallback(
    (title: string) => {
      updatePlayerCards((previous) => ({ ...previous, title }));
    },
    [updatePlayerCards],
  );

  const setPlayerCardsPosition = useCallback(
    (position: MarchingOrderPosition) => {
      updatePlayerCards((previous) => ({ ...previous, position }));
    },
    [updatePlayerCards],
  );

  const addPlayerCard = useCallback(() => {
    const newCard: PlayerCard = {
      id: createId("player-card"),
      name: "New Player Card",
      image: "",
      visible: true,
    };

    updatePlayerCards((previous) => ({
      ...previous,
      cards: [...previous.cards, newCard],
    }));

    return newCard.id;
  }, [updatePlayerCards]);

  const updatePlayerCard = useCallback(
    (cardId: string, patch: Partial<Omit<PlayerCard, "id">>) => {
      updatePlayerCards((previous) => ({
        ...previous,
        cards: previous.cards.map((card) =>
          card.id === cardId ? { ...card, ...patch } : card,
        ),
      }));
    },
    [updatePlayerCards],
  );

  const deletePlayerCard = useCallback(
    (cardId: string) => {
      updatePlayerCards((previous) => ({
        ...previous,
        cards: previous.cards.filter((card) => card.id !== cardId),
      }));
    },
    [updatePlayerCards],
  );

  const movePlayerCard = useCallback(
    (cardId: string, direction: 1 | -1) => {
      updatePlayerCards((previous) => {
        const index = previous.cards.findIndex((card) => card.id === cardId);
        const targetIndex = index + direction;

        if (
          index === -1 ||
          targetIndex < 0 ||
          targetIndex >= previous.cards.length
        ) {
          return previous;
        }

        const cards = [...previous.cards];
        [cards[index], cards[targetIndex]] = [cards[targetIndex], cards[index]];

        return { ...previous, cards };
      });
    },
    [updatePlayerCards],
  );

  const toggleMarchingOrder = useCallback(
    (displayId: DisplayTarget) => {
      publishState((previous) => ({
        ...previous,
        displays: {
          ...previous.displays,
          [displayId]: {
            ...previous.displays[displayId],
            showMarchingOrder: !previous.displays[displayId]?.showMarchingOrder,
          },
        },
      }));
    },
    [publishState],
  );

  const togglePlayerCards = useCallback(
    (displayId: DisplayTarget) => {
      publishState((previous) => ({
        ...previous,
        displays: {
          ...previous.displays,
          [displayId]: {
            ...previous.displays[displayId],
            showPlayerCards: !previous.displays[displayId]?.showPlayerCards,
          },
        },
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
    setMarchingOrderTitle,
    setMarchingOrderPosition,
    addCombatant,
    updateCombatant,
    deleteCombatant,
    moveCombatant,
    toggleCombatantCondition,
    setActiveCombatant,
    advanceTurn,
    addCondition,
    updateCondition,
    deleteCondition,
    setPlayerCardsTitle,
    setPlayerCardsPosition,
    addPlayerCard,
    updatePlayerCard,
    deletePlayerCard,
    movePlayerCard,
    toggleMarchingOrder,
    togglePlayerCards,
    resetToDefaults,
  };
}

export { STORAGE_KEY };
