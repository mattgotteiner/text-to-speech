import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../types';
import {
  buildAudioFileName,
  buildSpeechRequest,
  getAudioMimeType,
  normalizeAzureEndpoint,
} from './api';

describe('api helpers', () => {
  it('normalizes an Azure resource endpoint', () => {
    expect(normalizeAzureEndpoint('https://example.openai.azure.com/')).toBe(
      'https://example.openai.azure.com',
    );
  });

  it('strips openai path segments from endpoints', () => {
    expect(
      normalizeAzureEndpoint(
        'https://example.openai.azure.com/openai/deployments/gpt-4o-mini-tts',
      ),
    ).toBe('https://example.openai.azure.com');
  });

  it('builds the speech request payload from settings', () => {
    expect(buildSpeechRequest(DEFAULT_SETTINGS, 'Hello there')).toEqual({
      input: 'Hello there',
      model: 'gpt-4o-mini-tts',
      response_format: 'mp3',
      speed: 1,
      voice: 'alloy',
    });
  });

  it('includes optional instructions when provided', () => {
    expect(
      buildSpeechRequest(
        {
          ...DEFAULT_SETTINGS,
          instructions: 'Speak like a calm narrator.',
        },
        'Hello there',
      ),
    ).toEqual({
      input: 'Hello there',
      instructions: 'Speak like a calm narrator.',
      model: 'gpt-4o-mini-tts',
      response_format: 'mp3',
      speed: 1,
      voice: 'alloy',
    });
  });

  it('maps output formats to MIME types', () => {
    expect(getAudioMimeType('wav')).toBe('audio/wav');
  });

  it('creates a downloadable file name', () => {
    expect(buildAudioFileName(DEFAULT_SETTINGS)).toMatch(/^tts-alloy-.*\.mp3$/);
  });
});
