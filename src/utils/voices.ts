import { VOICE_CATALOG_OPTIONS, type AppSettings, type VoiceCatalogOption } from '../types';

function normalizeVoiceValue(value: string): string {
  return value.trim().toLowerCase();
}

function getPrefixCandidates(voice: VoiceCatalogOption): string[] {
  const normalizedLabel = normalizeVoiceValue(voice.label);
  const normalizedValue = normalizeVoiceValue(voice.value);
  const normalizedGroup = normalizeVoiceValue(voice.group);
  const normalizedLocale = normalizeVoiceValue(voice.locale);

  return [
    normalizedLabel,
    normalizedValue,
    normalizedGroup,
    normalizedLocale,
    ...normalizedLabel.split(/[^a-z0-9]+/).filter(Boolean),
    ...normalizedValue.split(/[^a-z0-9]+/).filter(Boolean),
  ];
}

export function findVoiceCatalogOption(voiceName: string): VoiceCatalogOption | undefined {
  const normalizedVoiceName = normalizeVoiceValue(voiceName);

  if (!normalizedVoiceName) {
    return undefined;
  }

  return VOICE_CATALOG_OPTIONS.find(
    (voice) => normalizeVoiceValue(voice.value) === normalizedVoiceName,
  );
}

export function filterVoiceCatalogOptions(query: string): readonly VoiceCatalogOption[] {
  const normalizedQuery = normalizeVoiceValue(query);

  if (!normalizedQuery) {
    return VOICE_CATALOG_OPTIONS;
  }

  return VOICE_CATALOG_OPTIONS.filter((voice) =>
    getPrefixCandidates(voice).some((candidate) => candidate.startsWith(normalizedQuery)),
  );
}

export function getEffectiveVoiceName(
  settings: Pick<AppSettings, 'voice' | 'voiceOverride'>,
): string {
  return settings.voiceOverride.trim() || settings.voice.trim();
}
