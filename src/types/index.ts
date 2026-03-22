export const APP_SETTINGS_STORAGE_KEY = 'text-audio-settings';
export const MAX_TTS_SSML_BYTES = 64 * 1024;
export const MAX_MARKDOWN_FILE_BYTES = 1024 * 1024;
export const AUDIO_FORMATS = ['mp3', 'wav', 'opus'] as const;
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

export interface VoicePresetOption {
  label: string;
  value: string;
}

export interface VoiceCatalogOption extends VoicePresetOption {
  group: string;
  locale: string;
  featured?: boolean;
}

export const VOICE_CATALOG_OPTIONS: readonly VoiceCatalogOption[] = [
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'Ava (US, multilingual)',
    locale: 'en-US',
    value: 'en-US-AvaMultilingualNeural',
  },
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'Andrew (US, multilingual)',
    locale: 'en-US',
    value: 'en-US-AndrewMultilingualNeural',
  },
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'Jenny (US, multilingual)',
    locale: 'en-US',
    value: 'en-US-JennyMultilingualNeural',
  },
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'Ryan (US, multilingual)',
    locale: 'en-US',
    value: 'en-US-RyanMultilingualNeural',
  },
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'Ada (UK, multilingual)',
    locale: 'en-GB',
    value: 'en-GB-AdaMultilingualNeural',
  },
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'Ollie (UK, multilingual)',
    locale: 'en-GB',
    value: 'en-GB-OllieMultilingualNeural',
  },
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'William (Australia, multilingual)',
    locale: 'en-AU',
    value: 'en-AU-WilliamMultilingualNeural',
  },
  {
    featured: true,
    group: 'Featured multilingual voices',
    label: 'Vivienne (France, multilingual)',
    locale: 'fr-FR',
    value: 'fr-FR-VivienneMultilingualNeural',
  },
  {
    group: 'English voices',
    label: 'Aria (US)',
    locale: 'en-US',
    value: 'en-US-AriaNeural',
  },
  {
    group: 'English voices',
    label: 'Jenny (US)',
    locale: 'en-US',
    value: 'en-US-JennyNeural',
  },
  {
    group: 'English voices',
    label: 'Guy (US)',
    locale: 'en-US',
    value: 'en-US-GuyNeural',
  },
  {
    group: 'English voices',
    label: 'Libby (UK)',
    locale: 'en-GB',
    value: 'en-GB-LibbyNeural',
  },
  {
    group: 'English voices',
    label: 'Ryan (UK)',
    locale: 'en-GB',
    value: 'en-GB-RyanNeural',
  },
  {
    group: 'English voices',
    label: 'Natasha (Australia)',
    locale: 'en-AU',
    value: 'en-AU-NatashaNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Denise (France)',
    locale: 'fr-FR',
    value: 'fr-FR-DeniseNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Henri (France)',
    locale: 'fr-FR',
    value: 'fr-FR-HenriNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Elvira (Spain)',
    locale: 'es-ES',
    value: 'es-ES-ElviraNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Alvaro (Spain)',
    locale: 'es-ES',
    value: 'es-ES-AlvaroNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Elsa (Italy)',
    locale: 'it-IT',
    value: 'it-IT-ElsaNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Diego (Italy)',
    locale: 'it-IT',
    value: 'it-IT-DiegoNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Francisca (Brazil)',
    locale: 'pt-BR',
    value: 'pt-BR-FranciscaNeural',
  },
  {
    group: 'Romance language voices',
    label: 'Antonio (Brazil)',
    locale: 'pt-BR',
    value: 'pt-BR-AntonioNeural',
  },
  {
    group: 'Central European voices',
    label: 'Katja (Germany)',
    locale: 'de-DE',
    value: 'de-DE-KatjaNeural',
  },
  {
    group: 'Central European voices',
    label: 'Conrad (Germany)',
    locale: 'de-DE',
    value: 'de-DE-ConradNeural',
  },
  {
    group: 'Central European voices',
    label: 'Colette (Netherlands)',
    locale: 'nl-NL',
    value: 'nl-NL-ColetteNeural',
  },
  {
    group: 'Central European voices',
    label: 'Maarten (Netherlands)',
    locale: 'nl-NL',
    value: 'nl-NL-MaartenNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'Nanami (Japan)',
    locale: 'ja-JP',
    value: 'ja-JP-NanamiNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'Keita (Japan)',
    locale: 'ja-JP',
    value: 'ja-JP-KeitaNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'SunHi (Korea)',
    locale: 'ko-KR',
    value: 'ko-KR-SunHiNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'InJoon (Korea)',
    locale: 'ko-KR',
    value: 'ko-KR-InJoonNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'Xiaoxiao (China)',
    locale: 'zh-CN',
    value: 'zh-CN-XiaoxiaoNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'Yunxi (China)',
    locale: 'zh-CN',
    value: 'zh-CN-YunxiNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'Swara (India)',
    locale: 'hi-IN',
    value: 'hi-IN-SwaraNeural',
  },
  {
    group: 'Asia Pacific voices',
    label: 'Madhur (India)',
    locale: 'hi-IN',
    value: 'hi-IN-MadhurNeural',
  },
];

export const COMMON_VOICE_OPTIONS: readonly VoicePresetOption[] = VOICE_CATALOG_OPTIONS.filter(
  ({ featured }) => featured,
).map(({ label, value }) => ({ label, value }));

export type AudioFormat = (typeof AUDIO_FORMATS)[number];
export type Theme = (typeof THEME_OPTIONS)[number];
export type VoiceOption = string;

export interface AppSettings {
  endpoint: string;
  apiKey: string;
  voice: VoiceOption;
  voiceOverride: VoiceOption;
  format: AudioFormat;
  speed: number;
  theme: Theme;
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
  theme: 'system',
  voice: 'en-US-AvaMultilingualNeural',
  voiceOverride: '',
};
