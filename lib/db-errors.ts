/** Postgres error codes we turn into friendly messages. */
export const PG_ERROR = {
  /** A unique column (e.g. a NIT) already has this value. */
  uniqueViolation: "23505",
  /** The row is still referenced by another table's foreign key. */
  foreignKeyViolation: "23503",
} as const;
