interface PostgrestLikeError {
  message: string;
  code?: string;
}

/**
 * M1's own trigger messages (the metal gate, prevent_code_change, etc.) are
 * deliberately written to be read by a human — relay them verbatim rather
 * than flattening everything to a generic toast. Only the two constraint
 * classes Postgres itself phrases unhelpfully get a friendlier gloss.
 */
export function describeSupabaseError(error: PostgrestLikeError): string {
  if (error.code === "23505") {
    return "This value is already in use — choose another.";
  }
  if (error.code === "23503") {
    return "This record is still referenced elsewhere and can't be removed.";
  }
  return error.message;
}
