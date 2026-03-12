type ClassValue = string | undefined | null | false;

/**
 * Combines multiple class values ​​into a single string.
 * Automatically filters out falsy values ​​(`undefined`, `null`, `false`, `""`).
 *
 * @param classes - List of class values ​​to combine.
 * @returns String containing the concatenated classes, separated by spaces.
 * */
export function className(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
