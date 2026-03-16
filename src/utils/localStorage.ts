function logStorageError(action: string, key: string, error: unknown): void {
  console.error(`Failed to ${action} localStorage key "${key}"`, error);
}

/**
 * Retrieves and parses a JSON value from localStorage.
 */
export function getStoredValue<T>(key: string, fallback: T): T {
  try {
    const storedValue = localStorage.getItem(key);

    if (storedValue === null) {
      return fallback;
    }

    return JSON.parse(storedValue) as T;
  } catch (error) {
    logStorageError('read', key, error);
    return fallback;
  }
}

/**
 * Stores a JSON-serializable value in localStorage.
 */
export function setStoredValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logStorageError('write', key, error);
  }
}

/**
 * Removes a single localStorage key.
 */
export function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logStorageError('remove', key, error);
  }
}

/**
 * Removes a group of localStorage keys.
 */
export function clearStoredValues(keys: readonly string[]): void {
  for (const key of keys) {
    removeStoredValue(key);
  }
}
