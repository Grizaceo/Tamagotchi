export const CURRENT_STORAGE_KEY = 'pompom-save-v3';

export const LEGACY_STORAGE_KEYS = ['pompom-save-v2', 'pompom-save-debug-v1', 'pompom-save-v1'] as const;

const TRUE_FLAGS = new Set(['1', 'true', 'yes', 'on']);
const UNREGISTER_SW_FLAGS = new Set(['0', 'false', 'off', 'unregister']);

export function shouldForceReset(search: string): boolean {
  if (!import.meta.env.DEV) return false; // dev-only: prevents malicious reset links in production
  const params = new URLSearchParams(search);
  if (!params.has('reset')) return false;

  const value = params.get('reset');
  if (value === null || value === '') return true;

  return TRUE_FLAGS.has(value.toLowerCase());
}

export function shouldUnregisterServiceWorker(search: string, isDev: boolean): boolean {
  if (!isDev) return false;

  const params = new URLSearchParams(search);
  if (params.has('sw-unregister')) return true;

  const sw = params.get('sw');
  if (sw === null) return false;
  if (sw === '') return true;

  return UNREGISTER_SW_FLAGS.has(sw.toLowerCase());
}

export function getStorageLookupKeys(): string[] {
  return [CURRENT_STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
}
