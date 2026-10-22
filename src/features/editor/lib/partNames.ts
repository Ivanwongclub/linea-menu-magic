export type PartNames = Record<string, string>;

export function defaultPartName(index: number): string {
  return `Object ${index + 1}`;
}

/** Keep only index-keyed, non-empty names from a stored recipe. */
export function normalizePartNames(raw: unknown): PartNames {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([key, value]) => /^\d+$/.test(key) && typeof value === "string" && value.trim().length > 0)
      .map(([key, value]) => [key, (value as string).trim()]),
  );
}

export function partDisplayName(index: number, sourceName: string, names: PartNames = {}): string {
  return names[String(index)] ?? (sourceName || defaultPartName(index));
}

/** Empty input restores the generated/source label instead of storing noise. */
export function renamePartName(names: PartNames, index: number, value: string): PartNames {
  const next = { ...names };
  const key = String(index);
  const trimmed = value.trim();
  if (trimmed) next[key] = trimmed;
  else delete next[key];
  return next;
}
