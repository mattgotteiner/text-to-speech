import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearStoredValues,
  getStoredValue,
  removeStoredValue,
  setStoredValue,
} from './localStorage';

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the fallback when the key is missing', () => {
    expect(getStoredValue('missing-key', { theme: 'light' })).toEqual({ theme: 'light' });
  });

  it('returns the parsed stored value', () => {
    localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));

    expect(getStoredValue('settings', { theme: 'light' })).toEqual({ theme: 'dark' });
  });

  it('returns the fallback and logs when stored JSON is invalid', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem('settings', '{invalid-json');

    expect(getStoredValue('settings', { theme: 'light' })).toEqual({ theme: 'light' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('stores JSON values', () => {
    setStoredValue('settings', { theme: 'dark', compactMode: true });

    expect(localStorage.getItem('settings')).toBe('{"theme":"dark","compactMode":true}');
  });

  it('removes stored values', () => {
    localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));

    removeStoredValue('settings');

    expect(localStorage.getItem('settings')).toBeNull();
  });

  it('clears multiple keys', () => {
    localStorage.setItem('one', JSON.stringify(1));
    localStorage.setItem('two', JSON.stringify(2));

    clearStoredValues(['one', 'two']);

    expect(localStorage.getItem('one')).toBeNull();
    expect(localStorage.getItem('two')).toBeNull();
  });
});
