/**
 * Custom colour entry (Phase 6a R3): a Pantone code from the solid coated
 * range, or a hex the buyer types or picks on screen.
 *
 * The lookup table below is a *subset*, not the licensed solid coated set:
 * Pantone's sRGB values are proprietary and cannot be invented here, so the
 * table carries only codes whose published approximations are well known, and
 * every other code falls through to the hex the buyer supplies — which is
 * exactly what R3's "unknown → typed hex fallback" asks for. Dropping the
 * licensed table in later is a data change, not a code change: keep the shape.
 *
 * Whatever comes out of here is an approximation on a screen, which is why a
 * custom colour is always labelled "to be confirmed by WIN-CYC".
 *
 * Pure: no DOM, no three.js — the node tests load this file.
 */

/** Canonical form: uppercase, single-spaced, trailing " C" (solid coated). */
export function normalizePantone(input: string): string | null {
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, " ").replace(/^PANTONE\s+/, "");
  if (!trimmed) return null;
  // A number (1–4 digits, optional -letter suffix like 5-4 C is not solid
  // coated) or one of the named families, then an optional coated suffix.
  const numbered = /^(\d{1,4})\s*C?$/.exec(trimmed);
  if (numbered) return `${numbered[1]} C`;
  const named = /^((?:BLACK|COOL GRAY|COOL GREY|WARM GRAY|WARM GREY|PROCESS BLUE|PROCESS YELLOW|PROCESS MAGENTA|PROCESS CYAN|REFLEX BLUE|RHODAMINE RED|PURPLE|VIOLET|ORANGE|GREEN|BLUE|RED|YELLOW|PINK)(?:\s+\d{1,3})?)\s*C?$/.exec(trimmed);
  if (named) return `${named[1].replace("GREY", "GRAY")} C`;
  return null;
}

/**
 * The bundled subset, as published approximations of the solid coated range.
 * Values are sRGB hex; each is the vendor's own public web approximation.
 */
export const PANTONE_COATED: Record<string, string> = {
  "032 C": "#EF3340",
  "185 C": "#E4002B",
  "186 C": "#C8102E",
  "199 C": "#D50032",
  "200 C": "#BA0C2F",
  "286 C": "#0033A0",
  "287 C": "#003087",
  "293 C": "#0057B8",
  "300 C": "#005EB8",
  "347 C": "#009A44",
  "348 C": "#00843D",
  "354 C": "#00B140",
  "375 C": "#97D700",
  "376 C": "#84BD00",
  "021 C": "#FE5000",
  "165 C": "#FF671F",
  "116 C": "#FFCD00",
  "123 C": "#FFC72C",
  "109 C": "#FFD100",
  "7548 C": "#FFC600",
  "BLACK C": "#2D2926",
  "BLACK 6 C": "#101820",
  "COOL GRAY 1 C": "#D9D9D6",
  "COOL GRAY 6 C": "#A7A8AA",
  "COOL GRAY 9 C": "#75787B",
  "COOL GRAY 11 C": "#53565A",
  "WARM GRAY 3 C": "#BFB8AF",
  "WARM GRAY 9 C": "#8C8279",
  "PROCESS BLUE C": "#0085CA",
  "REFLEX BLUE C": "#001489",
  "RHODAMINE RED C": "#E10098",
  "PURPLE C": "#BB29BB",
  "VIOLET C": "#440099",
  "ORANGE C": "#FF5800",
  "GREEN C": "#00AB84",
  "RED C": "#ED2939",
  "YELLOW C": "#FEDD00",
  "PINK C": "#D62598",
};

/** The colour of a canonical code, or null when this build's table doesn't carry it. */
export function pantoneHex(code: string): string | null {
  const canonical = normalizePantone(code);
  if (!canonical) return null;
  return PANTONE_COATED[canonical] ?? null;
}

/** How many codes this build can resolve — the strip and the panel say so rather than pretending. */
export const PANTONE_TABLE_SIZE = Object.keys(PANTONE_COATED).length;

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#RGB` / `#RRGGBB`, with or without the hash → `#RRGGBB`, or null. */
export function normalizeHex(input: string): string | null {
  const match = HEX.exec(input.trim());
  if (!match) return null;
  const digits = match[1];
  const full = digits.length === 3 ? digits.split("").map((c) => c + c).join("") : digits;
  return `#${full.toUpperCase()}`;
}

export const isHex = (input: string): boolean => normalizeHex(input) !== null;

export interface CustomColourInput {
  pantone?: string;
  hex?: string;
}

/**
 * What a "Custom…" entry resolves to: a known Pantone code and its
 * approximation, a Pantone code with the buyer's own hex beside it (the
 * unknown-code fallback), or a plain picked colour. Null when there is
 * nothing usable yet — a code with no colour behind it is not a colour.
 */
export function resolveCustomColour({ pantone, hex }: CustomColourInput): { pantone: string | null; hex: string } | null {
  const code = pantone ? normalizePantone(pantone) : null;
  const typed = hex ? normalizeHex(hex) : null;
  if (code) {
    const known = PANTONE_COATED[code] ?? null;
    if (known) return { pantone: code, hex: known };
    return typed ? { pantone: code, hex: typed } : null;
  }
  return typed ? { pantone: null, hex: typed } : null;
}
