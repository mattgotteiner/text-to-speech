import { useCallback, useMemo, useState } from 'react';
import {
  APP_SETTINGS_STORAGE_KEY,
  AUDIO_FORMATS,
  DEFAULT_SETTINGS,
  type AudioFormat,
  type AppSettings,
} from '../types';
import { getStoredValue, setStoredValue } from '../utils/localStorage';

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
  const endpoint = typeof settings.endpoint === 'string' ? settings.endpoint : '';

  return (
    'deployment' in settings ||
    'instructions' in settings ||
    endpoint.includes('.openai.azure.com') ||
    endpoint.includes('/openai')
  );
}

function isAudioFormat(value: unknown): value is AudioFormat {
  return typeof value === 'string' && AUDIO_FORMATS.includes(value as AudioFormat);
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    apiKey: settings.apiKey.trim(),
    endpoint: settings.endpoint.trim(),
    speed: clampSpeed(settings.speed),
    voice: settings.voice.trim() || DEFAULT_SETTINGS.voice,
    format: isAudioFormat(settings.format) ? settings.format : DEFAULT_SETTINGS.format,
  };
}

function hydrateSettings(value: unknown): AppSettings {
  if (!isRecord(value) || isLegacyOpenAiSettings(value)) {
    return DEFAULT_SETTINGS;
  }

  const endpoint = typeof value.endpoint === 'string' ? value.endpoint : DEFAULT_SETTINGS.endpoint;
  const apiKey = typeof value.apiKey === 'string' ? value.apiKey : DEFAULT_SETTINGS.apiKey;
  const voice = typeof value.voice === 'string' ? value.voice : DEFAULT_SETTINGS.voice;
  const format = isAudioFormat(value.format) ? value.format : DEFAULT_SETTINGS.format;
  const speed =
    typeof value.speed === 'number'
      ? value.speed
      : typeof value.speed === 'string'
        ? Number(value.speed)
        : DEFAULT_SETTINGS.speed;

  return normalizeSettings({
    apiKey,
    endpoint,
    format,
    speed,
    voice,
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
