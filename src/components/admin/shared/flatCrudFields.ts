export interface NameGroupField {
  type: "nameGroup";
  /** DB column for the English name; zh_hant/zh_hans are read as `${key}_zh_hant` / `${key}_zh_hans`. */
  key: string;
  label: string;
  required?: boolean;
}

export interface CodeField {
  type: "code";
  key: string;
  label: string;
  required?: boolean;
  helperText?: string;
}

export interface TextField {
  type: "text";
  key: string;
  label: string;
  required?: boolean;
  /** UI-only convention (no DB trigger backs this) — locked once the row exists. */
  lockAfterCreate?: boolean;
  helperText?: string;
}

export const SELECT_NONE_VALUE = "__none__";

export interface SelectField {
  type: "select";
  key: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  /** Adds an explicit "unset this nullable FK" option (Radix disallows an empty-string item value). */
  allowNone?: boolean;
  noneLabel?: string;
}

export interface SwitchField {
  type: "switch";
  key: string;
  label: string;
  helperText?: string;
}

export type FlatCrudField = NameGroupField | CodeField | TextField | SelectField | SwitchField;

export type FlatCrudFormValues = Record<string, string | boolean | null>;

export function nameGroupKeys(key: string): [string, string, string] {
  return [key, `${key}_zh_hant`, `${key}_zh_hans`];
}
