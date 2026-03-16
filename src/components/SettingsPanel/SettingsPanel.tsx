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
  onClose: () => void;
}

export function SettingsPanel({
  settings,
  defaultDeployment,
  onUpdate,
  onReset,
  onClose,
}: SettingsPanelProps): React.ReactElement {
  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <div>
          <p className="settings-panel__eyebrow">Configuration</p>
          <h2>Azure OpenAI settings</h2>
        </div>
        <button
          className="settings-panel__close"
          type="button"
          aria-label="Close settings"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="settings-panel__group">
        <label className="settings-panel__field">
          <span>Endpoint</span>
          <input
            type="url"
            placeholder="https://your-resource.openai.azure.com"
            value={settings.endpoint}
            onChange={(event) => onUpdate({ endpoint: event.target.value })}
          />
        </label>

        <label className="settings-panel__field">
          <span>Deployment name</span>
          <input
            type="text"
            placeholder={defaultDeployment}
            value={settings.deployment}
            onChange={(event) => onUpdate({ deployment: event.target.value })}
          />
        </label>

        <label className="settings-panel__field">
          <span>API key</span>
          <input
            type="password"
            placeholder="Paste your Azure OpenAI key"
            value={settings.apiKey}
            onChange={(event) => onUpdate({ apiKey: event.target.value })}
          />
        </label>
      </div>

      <div className="settings-panel__group settings-panel__group--split">
        <label className="settings-panel__field">
          <span>Voice</span>
          <select
            value={settings.voice}
            onChange={(event) => onUpdate({ voice: event.target.value as AppSettings['voice'] })}
          >
            {VOICE_OPTIONS.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </label>

        <label className="settings-panel__field">
          <span>Output format</span>
          <select
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
        </label>
      </div>

      <div className="settings-panel__group settings-panel__group--split">
        <label className="settings-panel__field">
          <span>Speed</span>
          <input
            type="number"
            min="0.25"
            max="4"
            step="0.25"
            value={settings.speed}
            onChange={(event) => onUpdate({ speed: Number(event.target.value) })}
          />
        </label>

        <div className="settings-panel__hint">
          <span className="settings-panel__hint-label">Security note</span>
          <p>
            This browser-direct scaffold stores your key locally for dev/test use,
            similar to `responses-chat`.
          </p>
        </div>
      </div>

      <label className="settings-panel__field">
        <span>Voice instructions</span>
        <textarea
          rows={4}
          placeholder="Optional guidance for the voice style."
          value={settings.instructions}
          onChange={(event) => onUpdate({ instructions: event.target.value })}
        />
      </label>

      <div className="settings-panel__actions">
        <button className="settings-panel__secondary" type="button" onClick={onReset}>
          Reset defaults
        </button>
        <button className="settings-panel__primary" type="button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
