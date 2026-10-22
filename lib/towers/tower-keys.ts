/**
 * Towers are stored per property as `tower-N` keys (`properties.typologies`,
 * `properties.tower_details`) and as `tower_number` N (`property_towers`). These helpers keep
 * the two forms in sync. Safe on client and server.
 */

/** `tower-3` for tower 3. */
export const towerKey = (towerNumber: number) => `tower-${towerNumber}`;

/** 3 for `tower-3`; 0 when the key has no number. */
export const towerNumberOf = (key: string) => Number(key.replace(/\D/g, "")) || 0;

/** Keys of towers 1..count: `["tower-1", "tower-2", …]`. */
export const towerKeys = (count: number) => Array.from({ length: count }, (_, i) => towerKey(i + 1));
