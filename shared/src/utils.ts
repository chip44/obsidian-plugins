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

/**
 * return a random integer between `min` and `max` (inclusive)
 *
 * source: underscore.js (https://github.com/jashkenas/underscore/blob/master/modules/random.js)
 */
export function random(max: number): number;
export function random(min: number, max: number): number;
export function random(min: number, max?: number): number {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
}
