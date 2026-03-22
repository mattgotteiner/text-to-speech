import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS } from '../types';
import { useSettings } from './useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resets legacy Azure OpenAI settings stored in localStorage', () => {
    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        apiKey: 'old-key',
        deployment: 'gpt-4o-mini-tts',
        endpoint: 'https://example.openai.azure.com',
        format: 'mp3',
        instructions: 'Speak warmly',
        speed: 1,
        voice: 'alloy',
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.isConfigured).toBe(false);
    expect(localStorage.getItem(APP_SETTINGS_STORAGE_KEY)).toBe(JSON.stringify(DEFAULT_SETTINGS));
  });

  it('normalizes Azure Speech setting updates', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({
        apiKey: ' speech-key ',
        region: ' WestEurope ',
        speed: 9,
        voice: ' en-US-JennyNeural ',
        voiceOverride: ' fr-FR-VivienneMultilingualNeural ',
      });
    });

    expect(result.current.settings.apiKey).toBe('speech-key');
    expect(result.current.settings.region).toBe('westeurope');
    expect(result.current.settings.speed).toBe(2);
    expect(result.current.settings.theme).toBe('system');
    expect(result.current.settings.voice).toBe('en-US-JennyNeural');
    expect(result.current.settings.voiceOverride).toBe('fr-FR-VivienneMultilingualNeural');
    expect(result.current.isConfigured).toBe(true);
  });

  it('defaults missing stored theme values to system', () => {
    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        apiKey: 'speech-key',
        format: 'mp3',
        region: 'eastus',
        speed: 1,
        voice: 'en-US-AvaMultilingualNeural',
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe('system');
    expect(localStorage.getItem(APP_SETTINGS_STORAGE_KEY)).toBe(
      JSON.stringify({ ...DEFAULT_SETTINGS, apiKey: 'speech-key', region: 'eastus' }),
    );
  });

  it('migrates stored regional speech endpoints into the region field', () => {
    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        endpoint: 'https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1',
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.region).toBe('westeurope');
  });

  it('leaves region empty when a saved endpoint does not encode it', () => {
    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        apiKey: 'speech-key',
        endpoint: 'https://example.cognitiveservices.azure.com/',
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.region).toBe('');
    expect(result.current.settings.apiKey).toBe('speech-key');
    expect(result.current.isConfigured).toBe(false);
  });

  it('migrates a previously saved custom voice into the override field', () => {
    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        voice: 'custom-voice-name',
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.voice).toBe(DEFAULT_SETTINGS.voice);
    expect(result.current.settings.voiceOverride).toBe('custom-voice-name');
  });

  it('normalizes invalid theme updates back to the default theme', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'midnight' as never });
    });

    expect(result.current.settings.theme).toBe(DEFAULT_SETTINGS.theme);
  });
});
