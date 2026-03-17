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
        <h3 className="settings-section__title">Required</h3>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-endpoint">
            Endpoint URL
          </label>
          <input
            id="settings-endpoint"
            className="settings-field__input"
            type="url"
            placeholder="https://your-resource.cognitiveservices.azure.com"
            value={settings.endpoint}
            onChange={(event) => onUpdate({ endpoint: event.target.value })}
          />
          <span className="settings-field__hint">
            Use your Azure Speech resource endpoint from the Azure portal.
          </span>
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-api-key">
            API key
          </label>
          <input
            id="settings-api-key"
            className="settings-field__input"
            type="password"
            placeholder="Paste your Azure Speech key"
            value={settings.apiKey}
            onChange={(event) => onUpdate({ apiKey: event.target.value })}
          />
        </div>

        <span className="settings-section__notice">
          This browser-direct scaffold stores your key locally for dev/test use.
        </span>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Audio</h3>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-voice-preset">
            Voice preset
          </label>
          <select
            id="settings-voice-preset"
            className="settings-field__select"
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
          <span className="settings-field__hint">
            The preset list uses broadly useful multilingual voices from the Azure Speech
            catalog.
          </span>
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-voice-name">
            Voice name
          </label>
          <input
            id="settings-voice-name"
            className="settings-field__input"
            type="text"
            placeholder={COMMON_VOICE_OPTIONS[0].value}
            value={settings.voice}
            onChange={(event) => onUpdate({ voice: event.target.value })}
          />
          <span className="settings-field__hint">
            You can still paste any Azure Speech voice name here if you want something outside
            the preset lists.
          </span>
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-format">
            Output format
          </label>
          <select
            id="settings-format"
            className="settings-field__select"
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
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-speed">
            Speed
          </label>
          <input
            id="settings-speed"
            className="settings-field__input"
            type="number"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.speed}
            onChange={(event) => onUpdate({ speed: Number(event.target.value) })}
          />
          <span className="settings-field__hint">Accepted range: 0.5 to 2.0.</span>
        </div>
      </section>

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

      <section className="settings-section settings-section--clear">
        <h3 className="settings-section__title">Reset</h3>
        <button className="settings-storage__clear-btn" type="button" onClick={onReset}>
          Reset defaults
        </button>
      </section>
    </div>
  );
}
