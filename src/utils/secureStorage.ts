const SECURE_STORAGE_DATABASE_NAME = 'text-audio-secure-storage';
const SECURE_STORAGE_STORE_NAME = 'crypto-keys';
const API_KEY_RECORD_ID = 'settings-api-key';
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const ENCRYPTION_IV_LENGTH = 12;
const ENCRYPTION_VERSION = 1;

export const API_KEY_UNLOCK_ERROR_MESSAGE =
  'Your saved API key could not be unlocked in this browser. Re-enter it in settings to continue.';

export interface EncryptedValue {
  ciphertext: string;
  iv: string;
  version: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getWebCrypto(): Crypto {
  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto is not available in this browser.');
  }

  return globalThis.crypto;
}

function getIndexedDb(): IDBFactory {
  if (typeof globalThis.indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this browser.');
  }

  return globalThis.indexedDB;
}

function encodeBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function openSecureStorageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(SECURE_STORAGE_DATABASE_NAME, 1);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open secure browser storage.'));
    };

    request.onupgradeneeded = () => {
      request.result.createObjectStore(SECURE_STORAGE_STORE_NAME);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function runObjectStoreRequest<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    void openSecureStorageDatabase()
      .then((database) => {
        const transaction = database.transaction(SECURE_STORAGE_STORE_NAME, mode);
        const store = transaction.objectStore(SECURE_STORAGE_STORE_NAME);
        const request = operation(store);

        request.onerror = () => {
          reject(request.error ?? new Error('Secure browser storage request failed.'));
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      })
      .catch(reject);
  });
}

async function getStoredEncryptionKey(): Promise<CryptoKey | null> {
  const storedValue = await runObjectStoreRequest<unknown>('readonly', (store) =>
    store.get(API_KEY_RECORD_ID),
  );

  return storedValue instanceof CryptoKey ? storedValue : null;
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const existingKey = await getStoredEncryptionKey();

  if (existingKey) {
    return existingKey;
  }

  const cryptoApi = getWebCrypto();
  const nextKey = await cryptoApi.subtle.generateKey(
    {
      length: 256,
      name: ENCRYPTION_ALGORITHM,
    },
    false,
    ['encrypt', 'decrypt'],
  );

  await runObjectStoreRequest<IDBValidKey>('readwrite', (store) =>
    store.put(nextKey, API_KEY_RECORD_ID),
  );

  return nextKey;
}

export function isEncryptedValue(value: unknown): value is EncryptedValue {
  return (
    isRecord(value) &&
    typeof value.ciphertext === 'string' &&
    typeof value.iv === 'string' &&
    value.version === ENCRYPTION_VERSION
  );
}

export async function encryptValue(value: string): Promise<EncryptedValue> {
  const cryptoApi = getWebCrypto();
  const encryptionKey = await getOrCreateEncryptionKey();
  const initializationVector = cryptoApi.getRandomValues(new Uint8Array(ENCRYPTION_IV_LENGTH));
  const encodedValue = new TextEncoder().encode(value);
  const ciphertextBuffer = await cryptoApi.subtle.encrypt(
    {
      iv: initializationVector,
      name: ENCRYPTION_ALGORITHM,
    },
    encryptionKey,
    encodedValue,
  );

  return {
    ciphertext: encodeBase64(new Uint8Array(ciphertextBuffer)),
    iv: encodeBase64(initializationVector),
    version: ENCRYPTION_VERSION,
  };
}

export async function decryptValue(encryptedValue: EncryptedValue): Promise<string> {
  const cryptoApi = getWebCrypto();
  const encryptionKey = await getStoredEncryptionKey();

  if (!encryptionKey) {
    throw new Error(API_KEY_UNLOCK_ERROR_MESSAGE);
  }

  try {
    const decryptedBuffer = await cryptoApi.subtle.decrypt(
      {
        iv: decodeBase64(encryptedValue.iv),
        name: ENCRYPTION_ALGORITHM,
      },
      encryptionKey,
      decodeBase64(encryptedValue.ciphertext),
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error(API_KEY_UNLOCK_ERROR_MESSAGE);
  }
}
