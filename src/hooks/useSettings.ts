import { useCallback, useMemo, useState } from 'react';
import {
  APP_SETTINGS_STORAGE_KEY,
  AUDIO_FORMATS,
  DEFAULT_SETTINGS,
  type AudioFormat,
  type AppSettings,
  type Theme,
  THEME_OPTIONS,
} from '../types';
import { getStoredValue, setStoredValue } from '../utils/localStorage';
import { findVoiceCatalogOption } from '../utils/voices';

const MIN_SPEECH_SPEED = 0.5;
const MAX_SPEECH_SPEED = 2;

function clampSpeed(speed: number): number {
  if (Number.isNaN(speed)) {
    return DEFAULT_SETTINGS.speed;
  }

  return Math.min(MAX_SPEECH_SPEED, Math.max(MIN_SPEECH_SPEED, speed));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isLegacyOpenAiSettings(settings: Record<string, unknown>): boolean {
  return 'deployment' in settings || 'instructions' in settings;
}

function isAudioFormat(value: unknown): value is AudioFormat {
  return typeof value === 'string' && AUDIO_FORMATS.includes(value as AudioFormat);
}

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && THEME_OPTIONS.includes(value as Theme);
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    apiKey: settings.apiKey.trim(),
    endpoint: settings.endpoint.trim(),
    format: isAudioFormat(settings.format) ? settings.format : DEFAULT_SETTINGS.format,
    speed: clampSpeed(settings.speed),
    theme: isTheme(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme,
    voice: settings.voice.trim() || DEFAULT_SETTINGS.voice,
    voiceOverride: settings.voiceOverride.trim(),
  };
}

function hydrateSettings(value: unknown): AppSettings {
  if (!isRecord(value) || isLegacyOpenAiSettings(value)) {
    return DEFAULT_SETTINGS;
  }

  const endpoint = typeof value.endpoint === 'string' ? value.endpoint : DEFAULT_SETTINGS.endpoint;
  const apiKey = typeof value.apiKey === 'string' ? value.apiKey : DEFAULT_SETTINGS.apiKey;
  const storedVoice = typeof value.voice === 'string' ? value.voice : DEFAULT_SETTINGS.voice;
  const voiceOverride =
    typeof value.voiceOverride === 'string' ? value.voiceOverride : DEFAULT_SETTINGS.voiceOverride;
  const format = isAudioFormat(value.format) ? value.format : DEFAULT_SETTINGS.format;
  const theme = isTheme(value.theme) ? value.theme : DEFAULT_SETTINGS.theme;
  const speed =
    typeof value.speed === 'number'
      ? value.speed
      : typeof value.speed === 'string'
        ? Number(value.speed)
        : DEFAULT_SETTINGS.speed;

  const normalizedStoredVoice = storedVoice.trim();
  const catalogVoice = findVoiceCatalogOption(normalizedStoredVoice)
    ? normalizedStoredVoice
    : DEFAULT_SETTINGS.voice;
  const normalizedVoiceOverride =
    voiceOverride.trim() || (normalizedStoredVoice && !findVoiceCatalogOption(normalizedStoredVoice)
      ? normalizedStoredVoice
      : DEFAULT_SETTINGS.voiceOverride);

  return normalizeSettings({
    apiKey,
    endpoint,
    format,
    speed,
    theme,
    voice: catalogVoice,
    voiceOverride: normalizedVoiceOverride,
  });
}

export interface UseSettingsReturn {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isConfigured: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const normalizedSettings = hydrateSettings(getStoredValue<unknown>(APP_SETTINGS_STORAGE_KEY, null));
    setStoredValue(APP_SETTINGS_STORAGE_KEY, normalizedSettings);
    return normalizedSettings;
  });

  const updateSettings = useCallback((updates: Partial<AppSettings>): void => {
    setSettings((currentSettings) => {
      const nextSettings = normalizeSettings({
        ...currentSettings,
        ...updates,
      });

      setStoredValue(APP_SETTINGS_STORAGE_KEY, nextSettings);

      return nextSettings;
    });
  }, []);

  const resetSettings = useCallback((): void => {
    setStoredValue(APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const isConfigured = useMemo(
    () =>
      settings.endpoint.length > 0 &&
      settings.apiKey.length > 0,
    [settings.apiKey.length, settings.endpoint.length],
  );

  return {
    isConfigured,
    resetSettings,
    settings,
    updateSettings,
  };
}
