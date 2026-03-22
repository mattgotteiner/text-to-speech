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
  ssmlContainsVoiceTag,
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
      usesDocumentDefaultVoice: true,
      usesExplicitVoiceTags: false,
    });
  });

  it('detects explicit SSML voice tags', () => {
    expect(ssmlContainsVoiceTag('<voice name="en-US-AvaMultilingualNeural">Hi</voice>')).toBe(
      true,
    );
    expect(ssmlContainsVoiceTag('<prosody rate="+10%">Hi</prosody>')).toBe(false);
  });

  it('preserves explicit voice tags in raw SSML mode', () => {
    const ssml =
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-GuyNeural">Hello there</voice></speak>';

    expect(buildSpeechRequestPayload(DEFAULT_SETTINGS, ssml, 'ssml')).toEqual({
      authoringMode: 'ssml',
      ssml,
      ssmlByteLength: new TextEncoder().encode(ssml).length,
      usesDocumentDefaultVoice: false,
      usesExplicitVoiceTags: true,
    });
  });

  it('wraps SSML content in the default voice when no voice tag is present', () => {
    const payload = buildSpeechRequestPayload(
      DEFAULT_SETTINGS,
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><p>Hello there</p></speak>',
      'ssml',
    );

    expect(payload.authoringMode).toBe('ssml');
    expect(payload.usesDocumentDefaultVoice).toBe(true);
    expect(payload.usesExplicitVoiceTags).toBe(false);
    expect(payload.ssml).toContain('<voice name="en-US-AvaMultilingualNeural">');
    expect(payload.ssml).toContain('<p>Hello there</p>');
  });

  it('rejects malformed XML in raw SSML mode', () => {
    expect(() =>
      buildSpeechRequestPayload(
        DEFAULT_SETTINGS,
        '<speak version="1.0"><voice name="en-US-AvaMultilingualNeural">Hello',
        'ssml',
      ),
    ).toThrow(/not well-formed xml/i);
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
