import { beforeEach, describe, expect, it } from 'vitest';
import { decryptValue, encryptValue } from './secureStorage';

describe('secure storage helpers', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('text-audio-secure-storage');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });

  it('encrypts values without leaving them in plain text', async () => {
    const encryptedValue = await encryptValue('speech-key');

    expect(encryptedValue.ciphertext).not.toContain('speech-key');
    await expect(decryptValue(encryptedValue)).resolves.toBe('speech-key');
  });

  it('fails to decrypt when the browser-managed key is missing', async () => {
    const encryptedValue = await encryptValue('speech-key');

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('text-audio-secure-storage');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    await expect(decryptValue(encryptedValue)).rejects.toThrow(/could not be unlocked/i);
  });
});
