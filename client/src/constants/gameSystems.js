/**
 * Список ігрових систем для настільних рольових ігор
 */

export const GAME_SYSTEMS = [
  { value: 'D&D 5e', label: 'Dungeons & Dragons 5e', icon: '🐉' },
  { value: 'Pathfinder 2e', label: 'Pathfinder 2nd Edition', icon: '⚔️' },
  { value: 'Call of Cthulhu', label: 'Call of Cthulhu', icon: '🦑' },
  { value: 'Інша', label: 'Інша система', icon: '✨' },
];

/**
 * Отримати всі системи у вигляді масиву
 */
export const getAllSystems = () => {
  return GAME_SYSTEMS;
};

/**
 * Отримати назву системи за значенням
 */
export const getSystemLabel = (value) => {
  const system = GAME_SYSTEMS.find(s => s.value === value);
  return system ? system.label : value;
};

/**
 * Отримати іконку системи за значенням
 */
export const getSystemIcon = (value) => {
  const system = GAME_SYSTEMS.find(s => s.value === value);
  return system ? system.icon : '🎲';
};
