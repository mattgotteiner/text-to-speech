import {
  CancellationDetails,
  ResultReason,
  SpeechConfig,
  SpeechSynthesisOutputFormat,
  type SpeechSynthesisResult,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk';
import { MAX_TTS_SSML_BYTES, type AppSettings, type AudioFormat } from '../types';

const AUDIO_MIME_TYPES: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  opus: 'audio/ogg; codecs=opus',
  wav: 'audio/wav',
};

const SPEECH_OUTPUT_FORMATS: Record<AudioFormat, SpeechSynthesisOutputFormat> = {
  mp3: SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3,
  opus: SpeechSynthesisOutputFormat.Ogg24Khz16BitMonoOpus,
  wav: SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm,
};

export interface SynthesizedSpeechResponse {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

export function normalizeSpeechEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();

  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    return url.toString().replace(/\/$/, '');
  } catch {
    return trimmed.replace(/\/$/, '');
  }
}

export function isLegacyOpenAiEndpoint(endpoint: string): boolean {
  const normalizedEndpoint = endpoint.trim().toLowerCase();

  return (
    normalizedEndpoint.includes('.openai.azure.com') ||
    normalizedEndpoint.includes('/openai')
  );
}

export function getAudioMimeType(format: AudioFormat): string {
  return AUDIO_MIME_TYPES[format];
}

export function getSpeechOutputFormat(format: AudioFormat): SpeechSynthesisOutputFormat {
  return SPEECH_OUTPUT_FORMATS[format];
}

export function buildAudioFileName(settings: AppSettings): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `tts-${settings.voice}-${timestamp}.${settings.format}`;
}

function escapeSsmlText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getVoiceLocale(voice: string): string {
  const localeMatch = voice.match(/^[a-z]{2}-[A-Z]{2}/);
  return localeMatch?.[0] ?? 'en-US';
}

function formatProsodyRate(speed: number): string {
  const percentage = Math.round((speed - 1) * 100);
  return `${percentage >= 0 ? '+' : ''}${percentage}%`;
}

export function buildSpeechRequest(settings: AppSettings, input: string): string {
  const normalizedVoice = settings.voice.trim();
  const locale = getVoiceLocale(normalizedVoice);
  const escapedInput = escapeSsmlText(input);

  return [
    `<speak version="1.0" xml:lang="${locale}" xmlns="http://www.w3.org/2001/10/synthesis">`,
    `  <voice name="${normalizedVoice}">`,
    `    <prosody rate="${formatProsodyRate(settings.speed)}">${escapedInput}</prosody>`,
    '  </voice>',
    '</speak>',
  ].join('\n');
}

export function getSpeechRequestSizeBytes(settings: AppSettings, input: string): number {
  return new TextEncoder().encode(buildSpeechRequest(settings, input)).length;
}

export function isSpeechRequestOverLimit(settings: AppSettings, input: string): boolean {
  return getSpeechRequestSizeBytes(settings, input) > MAX_TTS_SSML_BYTES;
}

export function createSpeechConfig(
  settings: Pick<AppSettings, 'endpoint' | 'apiKey' | 'voice' | 'format'>,
): SpeechConfig {
  const normalizedEndpoint = normalizeSpeechEndpoint(settings.endpoint);

  if (!normalizedEndpoint) {
    throw new Error('Add your Azure Speech endpoint in settings before generating audio.');
  }

  if (!settings.apiKey.trim()) {
    throw new Error('Add your Azure Speech API key in settings before generating audio.');
  }

  if (isLegacyOpenAiEndpoint(normalizedEndpoint)) {
    throw new Error(
      'Your saved settings still point to Azure OpenAI. Reset settings and enter an Azure Speech endpoint.',
    );
  }

  const speechConfig = SpeechConfig.fromEndpoint(
    new URL(normalizedEndpoint),
    settings.apiKey.trim(),
  );
  speechConfig.speechSynthesisOutputFormat = getSpeechOutputFormat(settings.format);
  speechConfig.speechSynthesisVoiceName = settings.voice.trim();

  return speechConfig;
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
  const normalizedEndpoint = normalizeSpeechEndpoint(settings.endpoint);
  const request = buildSpeechRequest(settings, input);
  const requestSizeBytes = new TextEncoder().encode(request).length;
  const startedAt = performance.now();

  if (requestSizeBytes > MAX_TTS_SSML_BYTES) {
    throw new Error(
      `Azure Speech real-time TTS supports SSML requests up to ${MAX_TTS_SSML_BYTES.toLocaleString()} bytes.`,
    );
  }

  logTtsEvent('Creating Azure Speech client', {
    endpoint: normalizedEndpoint,
    format: settings.format,
    inputLength: input.length,
    requestSizeBytes,
    speed: settings.speed,
    voice: settings.voice,
  });

  const speechConfig = createSpeechConfig(settings);
  const synthesizer = new SpeechSynthesizer(speechConfig, null);

  logTtsEvent('Sending speech request');
  const result = await new Promise<SpeechSynthesisResult>((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      request,
      (speechResult) => {
        synthesizer.close();
        resolve(speechResult);
      },
      (error) => {
        synthesizer.close();
        reject(new Error(error));
      },
    );
  });

  logTtsEvent('Speech response received', {
    elapsedMs: Math.round(performance.now() - startedAt),
  });

  if (result.reason === ResultReason.Canceled) {
    const cancellationDetails = CancellationDetails.fromResult(result);
    throw new Error(cancellationDetails.errorDetails || 'Speech synthesis was canceled.');
  }

  if (result.reason !== ResultReason.SynthesizingAudioCompleted || result.audioData.byteLength === 0) {
    throw new Error('Azure Speech did not return any audio data.');
  }

  const normalizedBlob = new Blob([result.audioData], {
    type: getAudioMimeType(settings.format),
  });

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
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while processing the request.';
}
