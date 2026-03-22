import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APP_SETTINGS_STORAGE_KEY,
  AUDIO_FORMATS,
  DEFAULT_SETTINGS,
  SPEECH_REGION_OPTIONS,
  type AudioFormat,
  type AppSettings,
  type Theme,
  THEME_OPTIONS,
} from '../types';
import { getStoredValue, setStoredValue } from '../utils/localStorage';
import {
  API_KEY_UNLOCK_ERROR_MESSAGE,
  decryptValue,
  encryptValue,
  isEncryptedValue,
  type EncryptedValue,
} from '../utils/secureStorage';
import { findVoiceCatalogOption } from '../utils/voices';

const MIN_SPEECH_SPEED = 0.5;
const MAX_SPEECH_SPEED = 2;
const KNOWN_SPEECH_REGIONS = new Set<string>(SPEECH_REGION_OPTIONS);
const API_KEY_PERSISTENCE_ERROR_MESSAGE =
  'This browser could not securely persist your API key. It will stay available only until you refresh.';

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

function normalizeRegion(region: string): string {
  return region.trim().toLowerCase();
}

function inferRegionFromEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();
  const normalizedEndpoint = trimmed.toLowerCase();

  if (
    !trimmed ||
    normalizedEndpoint.includes('.openai.azure.com') ||
    normalizedEndpoint.includes('/openai')
  ) {
    return '';
  }

  try {
    const { hostname } = new URL(trimmed);
    const normalizedHost = hostname.toLowerCase();
    const apiRegionMatch = normalizedHost.match(/^([a-z0-9]+)\.api\.cognitive\.microsoft\.com$/);
    const speechRegionMatch = normalizedHost.match(/^([a-z0-9]+)\.(?:stt|tts)\.speech\.microsoft\.com$/);
    const candidateRegion = apiRegionMatch?.[1] ?? speechRegionMatch?.[1] ?? '';

    return KNOWN_SPEECH_REGIONS.has(candidateRegion) ? candidateRegion : '';
  } catch {
    return '';
  }
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    apiKey: settings.apiKey.trim(),
    format: isAudioFormat(settings.format) ? settings.format : DEFAULT_SETTINGS.format,
    region: normalizeRegion(settings.region),
    speed: clampSpeed(settings.speed),
    theme: isTheme(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme,
    voice: settings.voice.trim() || DEFAULT_SETTINGS.voice,
    voiceOverride: settings.voiceOverride.trim(),
  };
}

interface PersistedSettings {
  apiKey?: string;
  encryptedApiKey?: EncryptedValue;
  format?: unknown;
  region?: unknown;
  speed?: unknown;
  theme?: unknown;
  voice?: unknown;
  voiceOverride?: unknown;
}

interface SettingsSnapshot {
  encryptedApiKey: EncryptedValue | null;
  settings: AppSettings;
}

function getPersistedSettingsSnapshot(value: unknown): SettingsSnapshot {
  if (!isRecord(value) || isLegacyOpenAiSettings(value)) {
    return {
      encryptedApiKey: null,
      settings: DEFAULT_SETTINGS,
    };
  }

  const persistedSettings = value as PersistedSettings;
  const encryptedApiKey = isEncryptedValue(persistedSettings.encryptedApiKey)
    ? persistedSettings.encryptedApiKey
    : null;
  const apiKey =
    encryptedApiKey === null && typeof persistedSettings.apiKey === 'string'
      ? persistedSettings.apiKey
      : DEFAULT_SETTINGS.apiKey;
  const legacyEndpoint = typeof value.endpoint === 'string' ? value.endpoint : '';
  const region =
    typeof value.region === 'string' && value.region.trim().length > 0
      ? value.region
      : inferRegionFromEndpoint(legacyEndpoint);
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

  return {
    encryptedApiKey,
    settings: normalizeSettings({
      apiKey,
      format,
      region,
      speed,
      theme,
      voice: catalogVoice,
      voiceOverride: normalizedVoiceOverride,
    }),
  };
}

async function buildPersistedSettings(settings: AppSettings): Promise<AppSettings & {
  encryptedApiKey?: EncryptedValue;
}> {
  if (settings.apiKey.length === 0) {
    return settings;
  }

  return {
    ...settings,
    apiKey: '',
    encryptedApiKey: await encryptValue(settings.apiKey),
  };
}

function buildPersistedSettingsWithoutApiKey(settings: AppSettings): AppSettings {
  return {
    ...settings,
    apiKey: '',
  };
}

export interface UseSettingsReturn {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isConfigured: boolean;
  persistenceMessage: string | null;
}

export function useSettings(): UseSettingsReturn {
  const [{ encryptedApiKey: initialEncryptedApiKey, settings: initialSettings }] = useState<SettingsSnapshot>(
    () => getPersistedSettingsSnapshot(getStoredValue<unknown>(APP_SETTINGS_STORAGE_KEY, null)),
  );
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [pendingEncryptedApiKey, setPendingEncryptedApiKey] = useState<EncryptedValue | null>(
    initialEncryptedApiKey,
  );
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(null);
  const [hasUnlockFailure, setHasUnlockFailure] = useState<boolean>(false);
  const [isPersistenceReady, setIsPersistenceReady] = useState<boolean>(initialEncryptedApiKey === null);

  useEffect(() => {
    if (pendingEncryptedApiKey === null) {
      return undefined;
    }

    let isCancelled = false;

    void decryptValue(pendingEncryptedApiKey)
      .then((apiKey) => {
        if (isCancelled) {
          return;
        }

        setSettings((currentSettings) =>
          normalizeSettings({
            ...currentSettings,
            apiKey,
          }),
        );
        setHasUnlockFailure(false);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error('Failed to unlock the saved API key.', error);
        setPersistenceMessage(API_KEY_UNLOCK_ERROR_MESSAGE);
        setHasUnlockFailure(true);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsPersistenceReady(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pendingEncryptedApiKey]);

  useEffect(() => {
    if (!isPersistenceReady || hasUnlockFailure) {
      return undefined;
    }

    let isCancelled = false;

    void buildPersistedSettings(settings)
      .then((persistedSettings) => {
        if (isCancelled) {
          return;
        }

        setStoredValue(APP_SETTINGS_STORAGE_KEY, persistedSettings);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error('Failed to securely persist the API key.', error);
        setStoredValue(APP_SETTINGS_STORAGE_KEY, buildPersistedSettingsWithoutApiKey(settings));
        setPersistenceMessage(API_KEY_PERSISTENCE_ERROR_MESSAGE);
      });

    return () => {
      isCancelled = true;
    };
  }, [hasUnlockFailure, isPersistenceReady, settings]);

  const updateSettings = useCallback((updates: Partial<AppSettings>): void => {
    setSettings((currentSettings) => {
      const nextSettings = normalizeSettings({
        ...currentSettings,
        ...updates,
      });

      return nextSettings;
    });

    if (typeof updates.apiKey === 'string') {
      setPendingEncryptedApiKey(null);
      setHasUnlockFailure(false);
      setIsPersistenceReady(true);
      setPersistenceMessage(null);
    }
  }, []);

  const resetSettings = useCallback((): void => {
    setPendingEncryptedApiKey(null);
    setHasUnlockFailure(false);
    setIsPersistenceReady(true);
    setPersistenceMessage(null);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const isConfigured = useMemo(
    () =>
      settings.region.length > 0 &&
      settings.apiKey.length > 0,
    [settings.apiKey.length, settings.region.length],
  );

  return {
    isConfigured,
    persistenceMessage,
    resetSettings,
    settings,
    updateSettings,
  };
}
