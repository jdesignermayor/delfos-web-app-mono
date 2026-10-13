/**
 * What every form Server Action returns. On failure, `fieldErrors` land on
 * the matching inputs and `message` (if any) is shown above the buttons.
 */
export type ActionFormResult<TValues> =
  | { success: true }
  | { success: false; message: string | null; fieldErrors: Partial<Record<keyof TValues, string>> };

/** Shorthand for a failed result with only a form-level message. */
export function actionFailure<TValues>(message: string): ActionFormResult<TValues> {
  return { success: false, message, fieldErrors: {} };
}

/**
 * What a Server Action without a form returns (toggle, delete, restore…).
 * Pass `TData` when a successful call returns something (e.g. a deleted row).
 */
export type ActionResult<TData = undefined> =
  | ([TData] extends [undefined] ? { success: true } : { success: true; data: TData })
  | { success: false; error: string };
