export const APP_SETTINGS_STORAGE_KEY = 'text-audio-settings';
export const MAX_TTS_SSML_BYTES = 64 * 1024;
export const MAX_MARKDOWN_FILE_BYTES = 1024 * 1024;
export const AUDIO_FORMATS = ['mp3', 'wav', 'opus'] as const;

export interface VoicePresetOption {
  label: string;
  value: string;
}

export const COMMON_VOICE_OPTIONS: readonly VoicePresetOption[] = [
  { label: 'Ava (US, multilingual)', value: 'en-US-AvaMultilingualNeural' },
  { label: 'Andrew (US, multilingual)', value: 'en-US-AndrewMultilingualNeural' },
  { label: 'Jenny (US, multilingual)', value: 'en-US-JennyMultilingualNeural' },
  { label: 'Ryan (US, multilingual)', value: 'en-US-RyanMultilingualNeural' },
  { label: 'Ada (UK, multilingual)', value: 'en-GB-AdaMultilingualNeural' },
  { label: 'Ollie (UK, multilingual)', value: 'en-GB-OllieMultilingualNeural' },
  { label: 'William (AU, multilingual)', value: 'en-AU-WilliamMultilingualNeural' },
] as const;

export type AudioFormat = (typeof AUDIO_FORMATS)[number];
export type VoiceOption = string;

export interface AppSettings {
  endpoint: string;
  apiKey: string;
  voice: VoiceOption;
  format: AudioFormat;
  speed: number;
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
  endpoint: '',
  format: 'mp3',
  speed: 1,
  voice: 'en-US-AvaMultilingualNeural',
};
