/**
 * A deleted row as its delete action returns it, so "Deshacer" can send it
 * back to a restore action. `values` are the entity's form values: restoring
 * validates them with the same parser as editing.
 */
export type DeletedRecord<TId, TValues> = {
  id: TId;
  createdAt: string | null;
  values: TValues;
};

/** A restore request that passed validation. */
export type ParsedDeletedRecord<TId, TInput> = { id: TId; createdAt: string | null; input: TInput };

type Parse<TOut> = (value: unknown) => TOut | null;
type ParseValues<TInput> = (
  values: never,
) => { success: true; data: TInput } | { success: false; errors: Partial<Record<string, string>> };

/** A timestamp the client can't use to inject anything: a valid date, re-serialized, or `null`. */
function parseTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/**
 * Validates a `DeletedRecord` coming back from the client. It's untrusted
 * input, so the id and values go through the same parsers as editing does.
 * Returns `null` when anything is invalid.
 */
export function parseDeletedRecord<TId, TInput>(
  record: unknown,
  parseId: Parse<TId>,
  parseValues: ParseValues<TInput>,
): ParsedDeletedRecord<TId, TInput> | null {
  if (!record || typeof record !== "object") return null;
  const { id, createdAt, values } = record as Record<string, unknown>;

  const parsedId = parseId(id);
  if (parsedId === null || !values || typeof values !== "object") return null;

  const parsed = parseValues(values as never);
  if (!parsed.success) return null;
  return { id: parsedId, createdAt: parseTimestamp(createdAt), input: parsed.data };
}
