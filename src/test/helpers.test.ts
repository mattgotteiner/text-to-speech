import { describe, expect, it } from 'vitest';
import { getFixturePath, loadJsonFixture, loadTextFixture } from './helpers';

describe('test helpers', () => {
  it('resolves fixture paths from the shared fixtures directory', () => {
    expect(getFixturePath('example.json')).toMatch(/src[\\/]test[\\/]fixtures[\\/]example\.json$/);
  });

  it('loads fixture text', () => {
    expect(loadTextFixture('example.json')).toContain('"name": "Template User"');
  });

  it('loads fixture JSON', () => {
    expect(loadJsonFixture<{ name: string; roles: string[] }>('example.json')).toEqual({
      name: 'Template User',
      roles: ['developer', 'tester'],
    });
  });

  it('throws a helpful error when the fixture is missing', () => {
    expect(() => loadTextFixture('missing.json')).toThrow(/Fixture not found:/);
  });
});
