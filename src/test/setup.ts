import '@testing-library/jest-dom/vitest';
import { webcrypto } from 'node:crypto';
import { beforeEach, vi } from 'vitest';

interface FakeDatabaseState {
  stores: Map<string, Map<IDBValidKey, unknown>>;
  version: number;
}

class FakeDbRequest<T> {
  error: DOMException | null = null;
  onerror: ((event: Event) => void) | null = null;
  onsuccess: ((event: Event) => void) | null = null;
  result!: T;

  dispatchError(error: DOMException): void {
    this.error = error;
    this.onerror?.(new Event('error'));
  }

  dispatchSuccess(result: T): void {
    this.result = result;
    this.onsuccess?.(new Event('success'));
  }
}

class FakeObjectStore {
  constructor(private readonly records: Map<IDBValidKey, unknown>) {}

  get(key: IDBValidKey): IDBRequest<unknown> {
    const request = new FakeDbRequest<unknown>();

    queueMicrotask(() => {
      request.dispatchSuccess(this.records.get(key));
    });

    return request as unknown as IDBRequest<unknown>;
  }

  put(value: unknown, key: IDBValidKey): IDBRequest<IDBValidKey> {
    const request = new FakeDbRequest<IDBValidKey>();

    queueMicrotask(() => {
      this.records.set(key, value);
      request.dispatchSuccess(key);
    });

    return request as unknown as IDBRequest<IDBValidKey>;
  }
}

class FakeTransaction {
  constructor(private readonly records: Map<IDBValidKey, unknown>) {}

  objectStore(): IDBObjectStore {
    return new FakeObjectStore(this.records) as unknown as IDBObjectStore;
  }
}

class FakeDatabase {
  constructor(
    public readonly name: string,
    private readonly state: FakeDatabaseState,
  ) {}

  createObjectStore(storeName: string): IDBObjectStore {
    if (!this.state.stores.has(storeName)) {
      this.state.stores.set(storeName, new Map<IDBValidKey, unknown>());
    }

    return new FakeObjectStore(this.state.stores.get(storeName)!) as unknown as IDBObjectStore;
  }

  transaction(storeName: string): IDBTransaction {
    const records = this.state.stores.get(storeName);

    if (!records) {
      throw new DOMException(`The object store "${storeName}" does not exist.`, 'NotFoundError');
    }

    return new FakeTransaction(records) as unknown as IDBTransaction;
  }
}

class FakeOpenDbRequest extends FakeDbRequest<IDBDatabase> {
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null = null;

  dispatchUpgrade(result: IDBDatabase): void {
    this.result = result;
    this.onupgradeneeded?.(new Event('upgradeneeded') as IDBVersionChangeEvent);
  }
}

class FakeIndexedDbFactory {
  private readonly databases = new Map<string, FakeDatabaseState>();

  deleteDatabase(name: string): IDBOpenDBRequest {
    const request = new FakeOpenDbRequest();

    queueMicrotask(() => {
      this.databases.delete(name);
      request.dispatchSuccess(undefined as never);
    });

    return request as unknown as IDBOpenDBRequest;
  }

  open(name: string, version = 1): IDBOpenDBRequest {
    const request = new FakeOpenDbRequest();

    queueMicrotask(() => {
      const existingState = this.databases.get(name);

      if (!existingState) {
        const nextState: FakeDatabaseState = {
          stores: new Map<string, Map<IDBValidKey, unknown>>(),
          version,
        };
        const database = new FakeDatabase(name, nextState) as unknown as IDBDatabase;
        this.databases.set(name, nextState);
        request.dispatchUpgrade(database);
        request.dispatchSuccess(database);
        return;
      }

      if (version > existingState.version) {
        existingState.version = version;
        const database = new FakeDatabase(name, existingState) as unknown as IDBDatabase;
        request.dispatchUpgrade(database);
        request.dispatchSuccess(database);
        return;
      }

      request.dispatchSuccess(new FakeDatabase(name, existingState) as unknown as IDBDatabase);
    });

    return request as unknown as IDBOpenDBRequest;
  }

  reset(): void {
    this.databases.clear();
  }
}

const fakeIndexedDb = new FakeIndexedDbFactory();

Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: webcrypto,
});

Object.defineProperty(globalThis, 'indexedDB', {
  configurable: true,
  value: fakeIndexedDb,
});

beforeEach(() => {
  fakeIndexedDb.reset();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(
    (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      }) as MediaQueryList,
  ),
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(() => 'blob:generated-audio'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});
