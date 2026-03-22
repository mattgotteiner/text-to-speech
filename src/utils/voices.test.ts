import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../types';
import {
  filterVoiceCatalogOptions,
  findVoiceCatalogOption,
  getEffectiveVoiceName,
} from './voices';

describe('voices', () => {
  it('finds a catalog voice by Azure voice name', () => {
    expect(findVoiceCatalogOption(' en-US-AvaMultilingualNeural ')).toEqual(
      expect.objectContaining({
        label: 'Ava (US, multilingual)',
        value: 'en-US-AvaMultilingualNeural',
      }),
    );
  });

  it('filters voices by prefix across labels and Azure voice names', () => {
    expect(filterVoiceCatalogOptions('ava')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'en-US-AvaMultilingualNeural' }),
      ]),
    );
    expect(filterVoiceCatalogOptions('en-us-j')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'en-US-JennyMultilingualNeural' }),
        expect.objectContaining({ value: 'en-US-JennyNeural' }),
      ]),
    );
  });

  it('returns no matches when no voice starts with the prefix', () => {
    expect(filterVoiceCatalogOptions('zzz-no-match')).toHaveLength(0);
  });

  it('prefers the override voice name when one is present', () => {
    expect(
      getEffectiveVoiceName({
        ...DEFAULT_SETTINGS,
        voiceOverride: 'fr-FR-VivienneMultilingualNeural',
      }),
    ).toBe('fr-FR-VivienneMultilingualNeural');
  });
});
