import { describe, expect, it } from 'vitest';
import { SpeechSynthesisOutputFormat } from 'microsoft-cognitiveservices-speech-sdk';
import { DEFAULT_SETTINGS, MAX_TTS_SSML_BYTES } from '../types';
import {
  buildAudioFileName,
  buildSpeechRequest,
  buildSpeechRequestPayload,
  getAudioMimeType,
  getSpeechRequestSizeBytes,
  getSpeechOutputFormat,
  getSpeechWebSocketUrl,
  isLegacyOpenAiEndpoint,
  isSpeechRequestOverLimit,
  looksLikeUrl,
  normalizeSpeechRegion,
} from './api';

describe('api helpers', () => {
  it('normalizes an Azure Speech region', () => {
    expect(normalizeSpeechRegion(' WestEurope ')).toBe('westeurope');
  });

  it('detects URL input when the user pastes an endpoint into the region field', () => {
    expect(looksLikeUrl('https://example.cognitiveservices.azure.com')).toBe(true);
  });

  it('detects legacy Azure OpenAI endpoints', () => {
    expect(isLegacyOpenAiEndpoint('https://example.openai.azure.com')).toBe(true);
  });

  it('builds the regional speech websocket URL', () => {
    expect(getSpeechWebSocketUrl('WestEurope')).toBe(
      'wss://westeurope.tts.speech.microsoft.com/cognitiveservices/websocket/v1',
    );
  });

  it('builds SSML from settings', () => {
    expect(buildSpeechRequest(DEFAULT_SETTINGS, 'Hello there')).toContain(
      '<voice name="en-US-AvaMultilingualNeural">',
    );
    expect(buildSpeechRequest(DEFAULT_SETTINGS, 'Hello there')).toContain(
      '<prosody rate="+0%">Hello there</prosody>',
    );
  });

  it('escapes XML special characters in SSML', () => {
    expect(buildSpeechRequest(DEFAULT_SETTINGS, 'Fish & Chips <3')).toContain(
      'Fish &amp; Chips &lt;3',
    );
  });

  it('measures the encoded SSML payload size', () => {
    const request = buildSpeechRequest(DEFAULT_SETTINGS, 'Hello there');

    expect(getSpeechRequestSizeBytes(DEFAULT_SETTINGS, 'Hello there')).toBe(
      new TextEncoder().encode(request).length,
    );
  });

  it('builds a reusable speech payload for plain-text authoring mode', () => {
    expect(buildSpeechRequestPayload(DEFAULT_SETTINGS, 'Hello there')).toEqual({
      authoringMode: 'plainText',
      ssml: buildSpeechRequest(DEFAULT_SETTINGS, 'Hello there'),
      ssmlByteLength: new TextEncoder().encode(buildSpeechRequest(DEFAULT_SETTINGS, 'Hello there'))
        .length,
    });
  });

  it('throws for the raw SSML mode before phase 2 is implemented', () => {
    expect(() => buildSpeechRequestPayload(DEFAULT_SETTINGS, 'Hello there', 'ssml')).toThrow(
      'Raw SSML authoring mode is not implemented yet.',
    );
  });

  it('flags requests that exceed the Speech SSML payload limit', () => {
    expect(isSpeechRequestOverLimit(DEFAULT_SETTINGS, 'a'.repeat(MAX_TTS_SSML_BYTES))).toBe(true);
  });

  it('maps output formats to MIME types', () => {
    expect(getAudioMimeType('wav')).toBe('audio/wav');
  });

  it('maps app formats to Azure Speech output formats', () => {
    expect(getSpeechOutputFormat('opus')).toBe(SpeechSynthesisOutputFormat.Ogg24Khz16BitMonoOpus);
  });

  it('creates a downloadable file name', () => {
    expect(buildAudioFileName(DEFAULT_SETTINGS)).toMatch(
      /^tts-en-US-AvaMultilingualNeural-.*\.mp3$/,
    );
  });

  it('uses the override voice when building SSML and file names', () => {
    const settingsWithOverride = {
      ...DEFAULT_SETTINGS,
      voiceOverride: 'fr-FR-VivienneMultilingualNeural',
    };

    expect(buildSpeechRequest(settingsWithOverride, 'Bonjour')).toContain(
      '<voice name="fr-FR-VivienneMultilingualNeural">',
    );
    expect(buildAudioFileName(settingsWithOverride)).toMatch(
      /^tts-fr-FR-VivienneMultilingualNeural-.*\.mp3$/,
    );
  });

});
