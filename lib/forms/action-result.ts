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
