/**
 * Список ігрових систем для настільних рольових ігор
 */

export const GAME_SYSTEMS = [
  { value: 'D&D 5e', label: 'Dungeons & Dragons 5e' },
  { value: 'Pathfinder 2e', label: 'Pathfinder 2nd Edition' },
  { value: 'Call of Cthulhu', label: 'Call of Cthulhu' },
  { value: 'Інша', label: 'Інша система' },
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

