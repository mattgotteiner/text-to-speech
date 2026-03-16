import {
  AUDIO_FORMATS,
  VOICE_OPTIONS,
  type AppSettings,
} from '../../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: AppSettings;
  defaultDeployment: string;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onReset: () => void;
}

export function SettingsPanel({
  settings,
  defaultDeployment,
  onUpdate,
  onReset,
}: SettingsPanelProps): React.ReactElement {
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
            placeholder="https://your-resource.openai.azure.com"
            value={settings.endpoint}
            onChange={(event) => onUpdate({ endpoint: event.target.value })}
          />
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-deployment">
            Deployment name
          </label>
          <input
            id="settings-deployment"
            className="settings-field__input"
            type="text"
            placeholder={defaultDeployment}
            value={settings.deployment}
            onChange={(event) => onUpdate({ deployment: event.target.value })}
          />
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-api-key">
            API key
          </label>
          <input
            id="settings-api-key"
            className="settings-field__input"
            type="password"
            placeholder="Paste your Azure OpenAI key"
            value={settings.apiKey}
            onChange={(event) => onUpdate({ apiKey: event.target.value })}
          />
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Audio</h3>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-voice">
            Voice
          </label>
          <select
            id="settings-voice"
            className="settings-field__select"
            value={settings.voice}
            onChange={(event) => onUpdate({ voice: event.target.value as AppSettings['voice'] })}
          >
            {VOICE_OPTIONS.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
              ))}
          </select>
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
            min="0.25"
            max="4"
            step="0.25"
            value={settings.speed}
            onChange={(event) => onUpdate({ speed: Number(event.target.value) })}
          />
          <span className="settings-field__hint">Accepted range: 0.25 to 4.0.</span>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Instructions</h3>
        <span className="settings-section__notice">
          This browser-direct scaffold stores your key locally for dev/test use, similar to
          `responses-chat`.
        </span>
        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-instructions">
            Voice instructions
          </label>
          <textarea
            id="settings-instructions"
            className="settings-field__textarea"
            rows={4}
            placeholder="Optional guidance for the voice style."
            value={settings.instructions}
            onChange={(event) => onUpdate({ instructions: event.target.value })}
          />
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
