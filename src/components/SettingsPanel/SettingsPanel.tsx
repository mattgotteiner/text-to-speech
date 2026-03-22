import { Button, FormField } from '@mattgotteiner/spa-ui-controls';
import {
  AUDIO_FORMATS,
  COMMON_VOICE_OPTIONS,
  THEME_OPTIONS,
  type AppSettings,
} from '../../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onReset: () => void;
}

const CUSTOM_VOICE_OPTION = '__custom_voice__';
const SUGGESTED_VOICE_VALUES = new Set(COMMON_VOICE_OPTIONS.map(({ value }) => value));

export function SettingsPanel({
  settings,
  onUpdate,
  onReset,
}: SettingsPanelProps): React.ReactElement {
  const selectedVoicePreset = SUGGESTED_VOICE_VALUES.has(settings.voice)
    ? settings.voice
    : CUSTOM_VOICE_OPTION;

  return (
    <div className="settings-panel">
      <section className="settings-section">
        <h3 className="settings-section__title">Appearance</h3>

        <div className="settings-field">
          <span className="settings-field__label">Theme</span>
          <div className="settings-field__radio-group">
            {THEME_OPTIONS.map((theme) => (
              <label key={theme} className="settings-field__radio-wrapper">
                <input
                  type="radio"
                  name="theme"
                  className="settings-field__radio"
                  value={theme}
                  checked={settings.theme === theme}
                  onChange={() => onUpdate({ theme })}
                />
                <span className="settings-field__radio-label">
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </span>
              </label>
            ))}
          </div>
          <span className="settings-field__hint">
            System follows your device preference. Light and dark override it in this browser.
          </span>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Required</h3>

        <FormField
          hint="Use your Azure Speech resource endpoint from the Azure portal."
          htmlFor="settings-endpoint"
          label="Endpoint URL"
        >
          <input
            id="settings-endpoint"
            type="url"
            placeholder="https://your-resource.cognitiveservices.azure.com"
            value={settings.endpoint}
            onChange={(event) => onUpdate({ endpoint: event.target.value })}
          />
        </FormField>

        <FormField htmlFor="settings-api-key" label="API key">
          <input
            id="settings-api-key"
            type="password"
            placeholder="Paste your Azure Speech key"
            value={settings.apiKey}
            onChange={(event) => onUpdate({ apiKey: event.target.value })}
          />
        </FormField>

        <p className="settings-section__notice">
          This browser-direct scaffold stores your key locally for dev/test use.
        </p>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Audio</h3>

        <FormField
          hint="The preset list uses broadly useful multilingual voices from the Azure Speech catalog."
          htmlFor="settings-voice-preset"
          label="Voice preset"
        >
          <select
            id="settings-voice-preset"
            value={selectedVoicePreset}
            onChange={(event) => {
              const nextVoice = event.target.value;

              if (nextVoice !== CUSTOM_VOICE_OPTION) {
                onUpdate({ voice: nextVoice });
              }
            }}
          >
            <optgroup label="Common voices">
              {COMMON_VOICE_OPTIONS.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </optgroup>
            <option value={CUSTOM_VOICE_OPTION}>Custom voice name</option>
          </select>
        </FormField>

        <FormField
          hint="You can still paste any Azure Speech voice name here if you want something outside the preset lists."
          htmlFor="settings-voice-name"
          label="Voice name"
        >
          <input
            id="settings-voice-name"
            type="text"
            placeholder={COMMON_VOICE_OPTIONS[0].value}
            value={settings.voice}
            onChange={(event) => onUpdate({ voice: event.target.value })}
          />
        </FormField>

        <FormField htmlFor="settings-format" label="Output format">
          <select
            id="settings-format"
            value={settings.format}
            onChange={(event) =>
              onUpdate({ format: event.target.value as AppSettings['format'] })
            }
          >
            {AUDIO_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          hint="Accepted range: 0.5 to 2.0."
          htmlFor="settings-speed"
          label="Speed"
        >
          <input
            id="settings-speed"
            type="number"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.speed}
            onChange={(event) => onUpdate({ speed: Number(event.target.value) })}
          />
        </FormField>
      </section>

      <section className="settings-section settings-section--clear">
        <h3 className="settings-section__title">Reset</h3>
        <Button variant="danger" onClick={onReset}>
          Reset defaults
        </Button>
      </section>
    </div>
  );
}
