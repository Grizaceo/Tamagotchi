import { describe, expect, it } from 'vitest';
import {
  CURRENT_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  getStorageLookupKeys,
  shouldForceReset,
  shouldUnregisterServiceWorker,
} from './runtimeConfig';

describe('runtimeConfig', () => {
  describe('shouldForceReset', () => {
    it('matches only reset param', () => {
      expect(shouldForceReset('')).toBe(false);
      expect(shouldForceReset('?preset=true')).toBe(false);
      expect(shouldForceReset('?reset')).toBe(true);
      expect(shouldForceReset('?reset=1')).toBe(true);
      expect(shouldForceReset('?reset=true')).toBe(true);
      expect(shouldForceReset('?reset=0')).toBe(false);
    });
  });

  describe('shouldUnregisterServiceWorker', () => {
    it('never unregisters outside dev mode', () => {
      expect(shouldUnregisterServiceWorker('?sw=off', false)).toBe(false);
      expect(shouldUnregisterServiceWorker('?sw-unregister', false)).toBe(false);
    });

    it('supports explicit dev flags', () => {
      expect(shouldUnregisterServiceWorker('?sw=off', true)).toBe(true);
      expect(shouldUnregisterServiceWorker('?sw=false', true)).toBe(true);
      expect(shouldUnregisterServiceWorker('?sw-unregister', true)).toBe(true);
      expect(shouldUnregisterServiceWorker('?sw=on', true)).toBe(false);
      expect(shouldUnregisterServiceWorker('', true)).toBe(false);
    });
  });

  describe('storage keys', () => {
    it('keeps current key first and includes legacy keys', () => {
      const keys = getStorageLookupKeys();
      expect(keys[0]).toBe(CURRENT_STORAGE_KEY);
      expect(keys).toContain(LEGACY_STORAGE_KEYS[0]);
      expect(keys).toContain(LEGACY_STORAGE_KEYS[1]);
    });
  });
});
