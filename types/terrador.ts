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
}

export type DisplaysState = Record<DisplayTarget, DisplayState>;

export interface TerradorState {
  scenes: Scene[];
  layers: FloatingLayer[];
  displays: DisplaysState;
}
