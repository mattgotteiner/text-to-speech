import { AzureOpenAI } from 'openai';
import type { SpeechCreateParams } from 'openai/resources/audio/speech';
import type { AppSettings, AudioFormat } from '../types';

const OPENAI_API_VERSION = '2025-04-01-preview';

const AUDIO_MIME_TYPES: Record<AudioFormat, string> = {
  aac: 'audio/aac',
  flac: 'audio/flac',
  mp3: 'audio/mpeg',
  opus: 'audio/ogg; codecs=opus',
  pcm: 'application/octet-stream',
  wav: 'audio/wav',
};

export interface SynthesizedSpeechResponse {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

export function normalizeAzureEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();

  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);

    if (url.pathname.startsWith('/openai')) {
      url.pathname = '';
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return trimmed.replace(/\/openai(?:\/.*)?$/i, '').replace(/\/$/, '');
  }
}

export function getAudioMimeType(format: AudioFormat): string {
  return AUDIO_MIME_TYPES[format];
}

export function buildAudioFileName(settings: AppSettings): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `tts-${settings.voice}-${timestamp}.${settings.format}`;
}

export function createAzureClient(settings: Pick<AppSettings, 'endpoint' | 'apiKey' | 'deployment'>): AzureOpenAI {
  return new AzureOpenAI({
    apiKey: settings.apiKey.trim(),
    apiVersion: OPENAI_API_VERSION,
    deployment: settings.deployment.trim(),
    dangerouslyAllowBrowser: true,
    endpoint: normalizeAzureEndpoint(settings.endpoint),
    maxRetries: 2,
  });
}

export function buildSpeechRequest(
  settings: AppSettings,
  input: string,
): SpeechCreateParams {
  const request: SpeechCreateParams = {
    input,
    model: settings.deployment.trim(),
    response_format: settings.format,
    speed: settings.speed,
    voice: settings.voice,
  };

  if (settings.instructions.trim()) {
    request.instructions = settings.instructions.trim();
  }

  return request;
}

function logTtsEvent(message: string, details?: Record<string, unknown>): void {
  if (details) {
    console.info(`[text-audio] ${message}`, details);
    return;
  }

  console.info(`[text-audio] ${message}`);
}

export async function synthesizeSpeech(
  settings: AppSettings,
  input: string,
): Promise<SynthesizedSpeechResponse> {
  const normalizedEndpoint = normalizeAzureEndpoint(settings.endpoint);
  const request = buildSpeechRequest(settings, input);
  const startedAt = performance.now();

  logTtsEvent('Creating Azure OpenAI client', {
    deployment: settings.deployment.trim(),
    endpoint: normalizedEndpoint,
    format: settings.format,
    hasInstructions: settings.instructions.trim().length > 0,
    inputLength: input.length,
    speed: settings.speed,
    voice: settings.voice,
  });

  const client = createAzureClient(settings);
  logTtsEvent('Sending speech request');
  const response = await client.audio.speech.create(request);
  logTtsEvent('Speech response received', {
    elapsedMs: Math.round(performance.now() - startedAt),
  });

  logTtsEvent('Reading response blob');
  const blob = await response.blob();
  logTtsEvent('Blob read complete', {
    blobSize: blob.size,
    blobType: blob.type || '(empty)',
    elapsedMs: Math.round(performance.now() - startedAt),
  });

  const normalizedBlob =
    blob.type.length > 0
      ? blob
      : new Blob([await blob.arrayBuffer()], { type: getAudioMimeType(settings.format) });

  logTtsEvent('Speech synthesis completed', {
    elapsedMs: Math.round(performance.now() - startedAt),
    normalizedBlobSize: normalizedBlob.size,
    normalizedBlobType: normalizedBlob.type,
  });

  return {
    blob: normalizedBlob,
    fileName: buildAudioFileName(settings),
    mimeType: getAudioMimeType(settings.format),
  };
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while processing the request.';
}
