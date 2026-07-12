export type DisplayTarget = "player-art" | "battle-map" | "secondary";

export type LayerPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export interface DisplayDefinition {
  id: DisplayTarget;
  label: string;
  route: string;
  description: string;
}

export interface Scene {
  id: string;
  name: string;
  imagePath: string;
  targetDisplay: DisplayTarget;
  hotkey: string;
  description?: string;
}

export interface FloatingLayer {
  id: string;
  name: string;
  imagePath: string;
  targetDisplay: DisplayTarget;
  size: number;
  position: LayerPosition;
  visible: boolean;
}

export interface DisplayState {
  activeSceneId: string | null;
  blackout: boolean;
  showMarchingOrder: boolean;
  showPlayerCards: boolean;
}

export type DisplaysState = Record<DisplayTarget, DisplayState>;

export type CombatantKind = "player" | "ally" | "enemy";

export interface ConditionType {
  id: string;
  label: string;
  /** Any valid CSS color, stored as a hex string from the color picker. */
  color: string;
}

export interface Combatant {
  id: string;
  name: string;
  /** Data URL (from an uploaded picture) or a /public path. Empty renders a placeholder. */
  image: string;
  kind: CombatantKind;
  /** Ids of the ConditionTypes currently affecting this combatant. */
  conditionIds: string[];
}

export type MarchingOrderPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface MarchingOrderState {
  title: string;
  combatants: Combatant[];
  conditions: ConditionType[];
  /** The combatant whose turn is highlighted, or null. */
  activeCombatantId: string | null;
  /** Which section of the screen the overlay is anchored to. */
  position: MarchingOrderPosition;
}

export interface PlayerCard {
  id: string;
  name: string;
  /** Data URL (from an uploaded card) or a /public path. Empty renders a placeholder. */
  image: string;
  visible: boolean;
}

export interface PlayerCardsState {
  title: string;
  cards: PlayerCard[];
  /** Which section of the screen the card tray is anchored to. */
  position: MarchingOrderPosition;
}

export interface TerradorState {
  scenes: Scene[];
  layers: FloatingLayer[];
  displays: DisplaysState;
  marchingOrder: MarchingOrderState;
  playerCards: PlayerCardsState;
}
