import { useCallback, useMemo, useState } from 'react';
import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS,
  type AppSettings,
} from '../types';
import { getStoredValue, setStoredValue } from '../utils/localStorage';

function clampSpeed(speed: number): number {
  return Math.min(4, Math.max(0.25, speed));
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    apiKey: settings.apiKey.trim(),
    deployment: settings.deployment.trim(),
    endpoint: settings.endpoint.trim(),
    instructions: settings.instructions.trim(),
    speed: clampSpeed(settings.speed),
  };
}

export interface UseSettingsReturn {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isConfigured: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(() =>
    normalizeSettings(getStoredValue(APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS)),
  );

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
      settings.apiKey.length > 0 &&
      settings.deployment.length > 0,
    [settings.apiKey.length, settings.deployment.length, settings.endpoint.length],
  );

  return {
    isConfigured,
    resetSettings,
    settings,
    updateSettings,
  };
}
