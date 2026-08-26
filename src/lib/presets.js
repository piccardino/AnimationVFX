// Preset definitions for the VolleyVFX Studio animation library

export const PRESET_CATEGORIES = [
  { id: 'vfx', name: 'VFX Impact' },
  { id: 'player', name: 'Player Spotlight' },
];

export const PRESETS = [
  {
    id: 'monster_block',
    name: 'Monster Block',
    category: 'vfx',
    defaultMainText: 'MONSTER BLOCK',
    defaultSubText: 'SPIKE REJECTED!',
    primaryColor: '#00e5ff',
    secondaryColor: '#7c4dff',
    accentColor: '#ffffff',
    duration: 3.5,
    description: 'Scudo d’impatto metallico con onde d’urto energetiche, scintille e screen shake.',
  },
  {
    id: 'super_spike',
    name: 'Super Spike',
    category: 'vfx',
    defaultMainText: 'SUPER SPIKE!',
    defaultSubText: '115 KM/H CANNONBALL',
    primaryColor: '#ff3d00',
    secondaryColor: '#ffea00',
    accentColor: '#ffffff',
    duration: 3.0,
    description: 'Detonazione ad alta velocità con scia di fiamme, braci e onda di calore.',
  },
  {
    id: 'service_ace',
    name: 'Service Ace',
    category: 'vfx',
    defaultMainText: 'SERVICE ACE!',
    defaultSubText: 'UNTOUCHABLE SERVE',
    primaryColor: '#ffd700',
    secondaryColor: '#ff007f',
    accentColor: '#ffffff',
    duration: 3.2,
    description: 'Mirino cibernetico rotante, anello sonico dorato e fascio laser orizzontale.',
  },
  {
    id: 'great_dig',
    name: 'Monster Save',
    category: 'vfx',
    defaultMainText: 'MONSTER SAVE',
    defaultSubText: 'GREAT DIG & DEFENSE',
    primaryColor: '#00ff87',
    secondaryColor: '#60efff',
    accentColor: '#ffffff',
    duration: 3.0,
    description: 'Onde liquide difensive, spruzzi idro-elettrici e cupola di energia acquatica.',
  },
  {
    id: 'perfect_set',
    name: 'Perfect Set',
    category: 'vfx',
    defaultMainText: 'PERFECT SET',
    defaultSubText: 'MAGIC HANDS',
    primaryColor: '#e040fb',
    secondaryColor: '#00e5ff',
    accentColor: '#ffffff',
    duration: 3.2,
    description: 'Orbite celesti multi-asse, aura di polvere stellare ed alone cosmico.',
  },
  {
    id: 'match_point',
    name: 'Set & Match Point Alert',
    category: 'vfx',
    defaultMainText: 'SET POINT',
    defaultSubText: 'DECISIVE RALLY',
    primaryColor: '#ff0055',
    secondaryColor: '#ffcc00',
    accentColor: '#ffffff',
    duration: 3.5,
    description: 'Nastri di pericolo animati, bordo stroboscopico ed ingresso glitch broadcast.',
  },
  {
    id: 'player_card',
    name: 'Player Spotlight Card',
    category: 'player',
    defaultMainText: 'MARCO ZANGHERI',
    defaultSubText: '#7 • OUTSIDE HITTER',
    primaryColor: '#7c3aed',
    secondaryColor: '#06b6d4',
    accentColor: '#ffffff',
    duration: 4.0,
    description: 'Lower-third broadcast con slide diagonale, passaggio shimmer e particelle fluttuanti.',
  },
];

export const COLOR_THEMES = [
  { name: 'Neon Cyber', primary: '#00e5ff', secondary: '#7c4dff', accent: '#ffffff' },
  { name: 'Fire & Ice', primary: '#ff3d00', secondary: '#00e5ff', accent: '#ffffff' },
  { name: 'Azzurri Blue', primary: '#0055ff', secondary: '#00ccff', accent: '#ffffff' },
  { name: 'Champions Gold', primary: '#ffd700', secondary: '#ff007f', accent: '#ffffff' },
  { name: 'Volcano Red', primary: '#dc2626', secondary: '#f59e0b', accent: '#ffffff' },
  { name: 'Emerald Victory', primary: '#00ff87', secondary: '#06b6d4', accent: '#ffffff' },
];

export const QUICK_TEXT_PRESETS = [
  'MONSTER BLOCK',
  'SUPER SPIKE!',
  'SERVICE ACE!',
  'GREAT DIG!',
  'PERFECT SET',
  'MATCH POINT',
  'KILL BLOCK!',
  '115 KM/H CANNONBALL',
];

export function getPresetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

export function buildInitialConfig() {
  const first = PRESETS[0];
  return {
    presetId: first.id,
    mainText: first.defaultMainText,
    subText: first.defaultSubText,
    primaryColor: first.primaryColor,
    secondaryColor: first.secondaryColor,
    accentColor: first.accentColor,
    duration: first.duration,
    lineThickness: 0.8,
    exportFps: 60,
    enableShake: true,
    selectedPlayer: null,
  };
}
