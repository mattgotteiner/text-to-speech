import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * Resolves a file within the shared test fixtures directory.
 */
export function getFixturePath(...pathSegments: string[]): string {
  return resolve(FIXTURES_DIR, ...pathSegments);
}

/**
 * Loads a text fixture from src/test/fixtures.
 */
export function loadTextFixture(...pathSegments: string[]): string {
  const fixturePath = getFixturePath(...pathSegments);

  try {
    return readFileSync(fixturePath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Fixture not found: ${fixturePath}`);
    }

    throw error;
  }
}

/**
 * Loads and parses a JSON fixture from src/test/fixtures.
 */
export function loadJsonFixture<T>(...pathSegments: string[]): T {
  return JSON.parse(loadTextFixture(...pathSegments)) as T;
}
