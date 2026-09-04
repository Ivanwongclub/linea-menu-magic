interface PostgrestLikeError {
  message: string;
  code?: string;
  details?: string;
}

type Translate = (key: string) => string;

const EN: Record<string, string> = {
  "admin.error.unique": "This value is already in use — choose another.",
  "admin.error.fk": "This record is still referenced elsewhere and can't be removed.",
  "admin.error.needsItemCode": "A product can't be active without an item code.",
  "admin.error.standardFinishNeedsCode": "A standard finish needs a CYC code — either add one or mark it non-standard.",
};

/**
 * Surfaces database errors as text a person can act on.
 *
 * M1's triggers (the metal gate, prevent_code_change, the material-change
 * guard) RAISE EXCEPTION with messages written to be read by a human — those
 * arrive as SQLSTATE P0001 and are relayed verbatim (they are authored in
 * the database, so they are not translated). Only the constraint classes
 * Postgres itself phrases unhelpfully get a gloss, which is translated when
 * a `t` is supplied.
 */
export function describeSupabaseError(error: PostgrestLikeError, t: Translate = (k) => EN[k] ?? k): string {
  switch (error.code) {
    case "P0001": // raise_exception — a trigger spoke; pass it through untouched
      return error.message;
    case "23505": // unique_violation
      return t("admin.error.unique");
    case "23503": // foreign_key_violation
      return t("admin.error.fk");
    case "23514": // check_violation
      if (/published_needs_item_code/.test(error.message)) return t("admin.error.needsItemCode");
      if (/standard_finish_needs_code/.test(error.message)) return t("admin.error.standardFinishNeedsCode");
      return error.message;
    default:
      return error.message;
  }
}
