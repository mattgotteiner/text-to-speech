import { useMemo, useState } from 'react';
import { Button, FormField } from '@mattgotteiner/spa-ui-controls';
import {
  AUDIO_FORMATS,
  SPEECH_REGION_OPTIONS,
  THEME_OPTIONS,
  VOICE_CATALOG_OPTIONS,
  type AppSettings,
  type VoiceCatalogOption,
} from '../../types';
import { filterVoiceCatalogOptions } from '../../utils/voices';
import './SettingsPanel.css';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onReset: () => void;
  persistenceMessage: string | null;
}

function groupCatalogVoices(
  voices: readonly VoiceCatalogOption[],
): Array<[string, VoiceCatalogOption[]]> {
  const voiceGroups = new Map<string, VoiceCatalogOption[]>();

  for (const voice of voices) {
    const existingGroup = voiceGroups.get(voice.group);

    if (existingGroup) {
      existingGroup.push(voice);
      continue;
    }

    voiceGroups.set(voice.group, [voice]);
  }

  return Array.from(voiceGroups.entries());
}

export function SettingsPanel({
  settings,
  onUpdate,
  onReset,
  persistenceMessage,
}: SettingsPanelProps): React.ReactElement {
  const [voiceSearch, setVoiceSearch] = useState<string>('');

  const matchedCatalogVoices = useMemo(
    () => filterVoiceCatalogOptions(voiceSearch),
    [voiceSearch],
  );
  const groupedCatalogVoices = useMemo(
    () => groupCatalogVoices(matchedCatalogVoices),
    [matchedCatalogVoices],
  );
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
          hint="Enter your Azure Speech region identifier, such as westus, eastus, or westeurope."
          htmlFor="settings-region"
          label="Region"
        >
          <input
            id="settings-region"
            className="settings-panel__control"
            type="text"
            list="settings-region-options"
            placeholder="westeurope"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={settings.region}
            onChange={(event) => onUpdate({ region: event.target.value })}
          />
          <datalist id="settings-region-options">
            {SPEECH_REGION_OPTIONS.map((region) => (
              <option key={region} value={region} />
            ))}
          </datalist>
        </FormField>

        <FormField htmlFor="settings-api-key" label="API key">
          <input
            id="settings-api-key"
            className="settings-panel__control"
            type="password"
            placeholder="Paste your Azure Speech key"
            value={settings.apiKey}
            onChange={(event) => onUpdate({ apiKey: event.target.value })}
          />
        </FormField>

        {persistenceMessage && (
          <p className="settings-section__notice settings-section__notice--warning" role="alert">
            {persistenceMessage}
          </p>
        )}

        <p className="settings-section__notice">
          This browser-direct scaffold encrypts your API key before writing it to localStorage and
          keeps the browser-managed encryption key outside localStorage for dev/test use.
        </p>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Audio</h3>

        <FormField
          hint={`Prefix search across labels, locales, and Azure voice names. Showing ${matchedCatalogVoices.length} of ${VOICE_CATALOG_OPTIONS.length} voices.`}
          htmlFor="settings-voice-search"
          label="Voice catalog"
        >
          <div className="settings-voice-catalog">
            <input
              id="settings-voice-search"
              className="settings-voice-catalog__search"
              type="search"
              placeholder="Try ava, en-US, fr-FR, xia..."
              value={voiceSearch}
              onChange={(event) => setVoiceSearch(event.target.value)}
            />

            {matchedCatalogVoices.length > 0 ? (
              <div className="settings-voice-catalog__groups" aria-label="Voice catalog results">
                {groupedCatalogVoices.map(([group, voices]) => (
                  <section key={group} className="settings-voice-catalog__group">
                    <h4 className="settings-voice-catalog__group-title">{group}</h4>
                    <div className="settings-voice-catalog__list">
                      {voices.map((voice) => {
                        const isSelected =
                          settings.voiceOverride.trim().length === 0 &&
                          settings.voice.trim() === voice.value;

                        return (
                          <button
                            key={voice.value}
                            type="button"
                            className={`settings-voice-catalog__item${isSelected ? ' settings-voice-catalog__item--selected' : ''}`}
                            aria-pressed={isSelected}
                            onClick={() =>
                              onUpdate({
                                voice: voice.value,
                                voiceOverride: '',
                              })
                            }
                          >
                            <span className="settings-voice-catalog__item-label">{voice.label}</span>
                            <span className="settings-voice-catalog__item-value">{voice.value}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="settings-voice-catalog__empty" role="status">
                No voices match that prefix yet. Keep typing or paste a custom Azure voice name below.
              </p>
            )}
          </div>
        </FormField>

        <FormField
          hint="Optional override. When this has a value, the catalog selection is deselected and the specified voice name is used."
          htmlFor="settings-voice-name"
          label="Voice name override"
        >
          <input
            id="settings-voice-name"
            className="settings-panel__control"
            type="text"
            placeholder={VOICE_CATALOG_OPTIONS[0].value}
            value={settings.voiceOverride}
            onChange={(event) => onUpdate({ voiceOverride: event.target.value })}
          />
        </FormField>

        <FormField htmlFor="settings-format" label="Output format">
          <select
            id="settings-format"
            className="settings-panel__control"
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
            className="settings-panel__control"
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
