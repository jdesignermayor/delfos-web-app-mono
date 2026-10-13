import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";

type ParseResult<TValues> =
  | { success: true }
  | { success: false; errors: Partial<Record<keyof TValues, string>> };

/**
 * Turns one of our `parse…Form` validators into a React Hook Form resolver,
 * so the client checks a form with exactly the rules its Server Action
 * enforces. Valid forms pass their raw values through: the server parses
 * (and normalizes) them again on save.
 */
export function parseResolver<TValues extends FieldValues>(
  parse: (values: TValues) => ParseResult<TValues>,
): Resolver<TValues> {
  return async (values) => {
    const parsed = parse(values);
    if (parsed.success) return { values, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const [field, message] of Object.entries(parsed.errors)) {
      if (typeof message === "string") errors[field] = { type: "validate", message };
    }
    return { values: {}, errors: errors as FieldErrors<TValues> };
  };
}
