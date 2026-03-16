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

export async function synthesizeSpeech(
  settings: AppSettings,
  input: string,
): Promise<SynthesizedSpeechResponse> {
  const client = createAzureClient(settings);
  const response = await client.audio.speech.create(buildSpeechRequest(settings, input));
  const blob = await response.blob();
  const normalizedBlob =
    blob.type.length > 0 ? blob : new Blob([await blob.arrayBuffer()], { type: getAudioMimeType(settings.format) });

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
