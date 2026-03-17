import { describe, expect, it } from 'vitest';
import { SpeechSynthesisOutputFormat } from 'microsoft-cognitiveservices-speech-sdk';
import { DEFAULT_SETTINGS, MAX_TTS_SSML_BYTES } from '../types';
import {
  buildAudioFileName,
  buildSpeechRequest,
  getAudioMimeType,
  getSpeechRequestSizeBytes,
  getSpeechOutputFormat,
  isSpeechRequestOverLimit,
  normalizeSpeechEndpoint,
} from './api';

describe('api helpers', () => {
  it('normalizes an Azure Speech endpoint', () => {
    expect(normalizeSpeechEndpoint('https://example.cognitiveservices.azure.com/')).toBe(
      'https://example.cognitiveservices.azure.com',
    );
  });

  it('preserves non-root Speech endpoint paths', () => {
    expect(normalizeSpeechEndpoint('https://example.cognitiveservices.azure.com/custom/')).toBe(
      'https://example.cognitiveservices.azure.com/custom',
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
});
