/**
 * Native: drei's /native loaders understand Metro asset module IDs directly,
 * so pass them through untouched.
 */
export function assetUri(mod: number | string): string {
  return mod as unknown as string;
}
