/**
 * Landing rules tied to specific `tower_statuses` rows, matched by id. Kept here, in one place:
 * the ids come from the database, so another environment (or a re-seeded catalog) means updating
 * this file.
 */

/** "Vendida completamente": a project with a tower in this status gets the "Éxito en ventas" tag. */
export const SALES_SUCCESS_TOWER_STATUS_ID = "b1129523-8f16-45e4-85ba-8b7ae7bbbc47";

/** Whether a tower in status `statusId` makes the project a sales success. */
export function isSalesSuccessStatus(statusId: string): boolean {
  return statusId === SALES_SUCCESS_TOWER_STATUS_ID;
}
