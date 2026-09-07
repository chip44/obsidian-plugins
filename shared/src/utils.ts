import type { around } from 'monkey-around';

export const noop = () => {};

/**
 * a function that can be called to disable or remove all of the wrappers created by `around()`
 */
export type Uninstaller = ReturnType<typeof around>;

/**
 * trim all strings, remove empty strings, and remove duplicates
 */
export function cleanStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

/**
 * capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
