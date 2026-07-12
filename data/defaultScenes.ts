import type {
  Combatant,
  ConditionType,
  DisplayDefinition,
  DisplaysState,
  FloatingLayer,
  MarchingOrderPosition,
  MarchingOrderState,
  Scene,
} from "@/types/terrador";

export const MARCHING_ORDER_POSITIONS: {
  value: MarchingOrderPosition;
  label: string;
}[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "center-left", label: "Center Left" },
  { value: "center", label: "Center" },
  { value: "center-right", label: "Center Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

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
    showMarchingOrder: false,
  },
  "battle-map": {
    activeSceneId: "mountain-pass",
    blackout: false,
    showMarchingOrder: false,
  },
  secondary: {
    activeSceneId: "glad-stone",
    blackout: false,
    showMarchingOrder: false,
  },
};

export const DEFAULT_CONDITIONS: ConditionType[] = [
  { id: "poisoned", label: "Poisoned", color: "#22c55e" },
  { id: "stunned", label: "Stunned", color: "#eab308" },
  { id: "frightened", label: "Frightened", color: "#a855f7" },
  { id: "charmed", label: "Charmed", color: "#ec4899" },
  { id: "prone", label: "Prone", color: "#f97316" },
  { id: "blessed", label: "Blessed", color: "#38bdf8" },
  { id: "burning", label: "Burning", color: "#ef4444" },
  { id: "hasted", label: "Hasted", color: "#14b8a6" },
];

export const DEFAULT_COMBATANTS: Combatant[] = [
  {
    id: "aria-vane",
    name: "Aria Vane",
    image: "",
    kind: "player",
    conditionIds: ["blessed"],
  },
  {
    id: "bront-hollow",
    name: "Bront Hollow",
    image: "",
    kind: "player",
    conditionIds: [],
  },
  {
    id: "sable-ally",
    name: "Sable",
    image: "",
    kind: "ally",
    conditionIds: ["hasted"],
  },
  {
    id: "gloomfang",
    name: "Gloomfang",
    image: "",
    kind: "enemy",
    conditionIds: ["burning", "frightened"],
  },
];

export const DEFAULT_MARCHING_ORDER: MarchingOrderState = {
  title: "Marching Order",
  combatants: DEFAULT_COMBATANTS,
  conditions: DEFAULT_CONDITIONS,
  activeCombatantId: "aria-vane",
  position: "center-left",
};
