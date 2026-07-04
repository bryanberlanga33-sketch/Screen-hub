import type {
  DisplayDefinition,
  DisplaysState,
  FloatingLayer,
  Scene,
} from "@/types/terrador";

export const DISPLAY_DEFINITIONS: DisplayDefinition[] = [
  {
    id: "player-art",
    label: "Player Art Screen",
    route: "/display/player-art",
    description: "Cinematic artwork, NPC portraits, and title-card visuals.",
  },
  {
    id: "battle-map",
    label: "Battle Map Screen",
    route: "/display/battle-map",
    description: "Tactical maps, weather effects, and combat backdrops.",
  },
  {
    id: "secondary",
    label: "Secondary Screen",
    route: "/display/secondary",
    description: "Extra reference visuals, side portraits, and overlays.",
  },
];

export const DEFAULT_SCENES: Scene[] = [
  {
    id: "bio-bloom-village",
    name: "Bio-Bloom Village",
    imagePath: "/scenes/bio-bloom-village.jpg",
    targetDisplay: "player-art",
    hotkey: "1",
    description: "Bioluminescent streets and gentle village wonder.",
  },
  {
    id: "aetheria",
    name: "Aetheria",
    imagePath: "/scenes/aetheria.jpg",
    targetDisplay: "player-art",
    hotkey: "2",
    description: "A shining sky-realm vista for sweeping reveals.",
  },
  {
    id: "glad-stone",
    name: "Glad Stone",
    imagePath: "/scenes/glad-stone.jpg",
    targetDisplay: "secondary",
    hotkey: "3",
    description: "Ancient stonework and mystery for side-screen flavor.",
  },
  {
    id: "deadwood-wells",
    name: "Deadwood Wells",
    imagePath: "/scenes/deadwood-wells.jpg",
    targetDisplay: "player-art",
    hotkey: "4",
    description: "Dust, rot, and old frontier dread.",
  },
  {
    id: "nordic-jazz-club",
    name: "Nordic Jazz Club",
    imagePath: "/scenes/nordic-jazz-club.jpg",
    targetDisplay: "secondary",
    hotkey: "5",
    description: "A smoky, rune-lit social scene.",
  },
  {
    id: "mountain-pass",
    name: "Mountain Pass",
    imagePath: "/scenes/mountain-pass.jpg",
    targetDisplay: "battle-map",
    hotkey: "6",
    description: "A dangerous crossing for travel and ambushes.",
  },
  {
    id: "boss-encounter",
    name: "Boss Encounter",
    imagePath: "/scenes/boss-encounter.jpg",
    targetDisplay: "battle-map",
    hotkey: "7",
    description: "High-stakes combat backdrop for the big reveal.",
  },
];

export const DEFAULT_LAYERS: FloatingLayer[] = [
  {
    id: "village-title-card",
    name: "Village Title Card",
    imagePath: "/overlays/bio-bloom-title.png",
    targetDisplay: "player-art",
    size: 34,
    position: "center",
    visible: false,
  },
  {
    id: "battle-weather-mist",
    name: "Battle Weather Mist",
    imagePath: "/overlays/mist.png",
    targetDisplay: "battle-map",
    size: 100,
    position: "center",
    visible: false,
  },
  {
    id: "boss-portrait",
    name: "Boss Portrait",
    imagePath: "/overlays/boss-portrait.png",
    targetDisplay: "secondary",
    size: 30,
    position: "top-right",
    visible: false,
  },
];

export const DEFAULT_DISPLAYS: DisplaysState = {
  "player-art": {
    activeSceneId: "bio-bloom-village",
    blackout: false,
  },
  "battle-map": {
    activeSceneId: "mountain-pass",
    blackout: false,
  },
  secondary: {
    activeSceneId: "glad-stone",
    blackout: false,
  },
};
