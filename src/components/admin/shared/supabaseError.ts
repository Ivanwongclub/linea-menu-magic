interface PostgrestLikeError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Surfaces database errors as text a person can act on.
 *
 * M1's triggers (the metal gate, prevent_code_change, the material-change
 * guard) RAISE EXCEPTION with messages written to be read by a human — those
 * arrive as SQLSTATE P0001 and are relayed verbatim. Only the constraint
 * classes Postgres itself phrases unhelpfully get a friendlier gloss.
 */
export function describeSupabaseError(error: PostgrestLikeError): string {
  switch (error.code) {
    case "P0001": // raise_exception — a trigger spoke; pass it through untouched
      return error.message;
    case "23505": // unique_violation
      return "This value is already in use — choose another.";
    case "23503": // foreign_key_violation
      return "This record is still referenced elsewhere and can't be removed.";
    case "23514": // check_violation
      if (/published_needs_item_code/.test(error.message)) {
        return "A product can't be active without an item code.";
      }
      if (/standard_finish_needs_code/.test(error.message)) {
        return "A standard finish needs a CYC code — either add one or mark it non-standard.";
      }
      return error.message;
    default:
      return error.message;
  }
}
