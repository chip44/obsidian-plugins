/*
 * trim all strings, remove empty strings, and remove duplicates
 */
export function cleanStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}
