export const APP_SETTINGS_STORAGE_KEY = 'text-audio-settings';
export const MAX_TTS_INPUT_CHARS = 4096;
export const MAX_MARKDOWN_FILE_BYTES = 1024 * 1024;
export const AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'flac', 'opus', 'pcm'] as const;
export const VOICE_OPTIONS = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
] as const;

export type AudioFormat = (typeof AUDIO_FORMATS)[number];
export type VoiceOption = (typeof VOICE_OPTIONS)[number];

export interface AppSettings {
  endpoint: string;
  apiKey: string;
  deployment: string;
  voice: VoiceOption;
  format: AudioFormat;
  speed: number;
  instructions: string;
}

export interface MarkdownAttachment {
  name: string;
  content: string;
  size: number;
}

export interface SpeechResult {
  audioBlob: Blob;
  audioUrl: string;
  createdAt: string;
  fileName: string;
  format: AudioFormat;
  input: string;
  voice: VoiceOption;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  deployment: 'gpt-4o-mini-tts',
  endpoint: '',
  format: 'mp3',
  instructions: '',
  speed: 1,
  voice: 'alloy',
};
