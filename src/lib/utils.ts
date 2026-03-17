import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function groupBy<T>(
  array: T[],
  key: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const k = key(item);
    return {
      ...groups,
      [k]: [...(groups[k] ?? []), item],
    };
  }, {} as Record<string, T[]>);
}
