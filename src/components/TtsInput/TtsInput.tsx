import { useRef, useState, type ChangeEvent } from 'react';
import { Banner, Button, FormField } from '@mattgotteiner/spa-ui-controls';
import type { AuthoringMode, MarkdownAttachment } from '../../types';
import './TtsInput.css';

type ComposerTab = 'compose' | 'generatedSsml';

interface TtsInputProps {
  authoringMode: AuthoringMode;
  plainTextInput: string;
  ssmlInput: string;
  attachment: MarkdownAttachment | null;
  composerMessage: string | null;
  composerError: string | null;
  characterCount: number;
  requestSizeBytes: number;
  maxRequestBytes: number;
  generatedSsml: string;
  ssmlSettingsSourceLabel: string;
  ssmlContentSourceLabel: string;
  isConfigured: boolean;
  isGenerating: boolean;
  isGenerateDisabled: boolean;
  isOverCharacterLimit: boolean;
  onAuthoringModeChange: (mode: AuthoringMode) => void;
  onInputChange: (value: string) => void;
  onSsmlInputChange: (value: string) => void;
  onAttachFile: (file: File | null) => Promise<void>;
  onRemoveAttachment: () => void;
  onGenerate: () => void;
  onClear: () => void;
  onClearSsml: () => void;
}

export function TtsInput({
  authoringMode,
  plainTextInput,
  ssmlInput,
  attachment,
  composerMessage,
  composerError,
  characterCount,
  requestSizeBytes,
  maxRequestBytes,
  generatedSsml,
  ssmlSettingsSourceLabel,
  ssmlContentSourceLabel,
  isGenerating,
  isConfigured,
  isGenerateDisabled,
  isOverCharacterLimit,
  onAuthoringModeChange,
  onInputChange,
  onSsmlInputChange,
  onAttachFile,
  onRemoveAttachment,
  onGenerate,
  onClear,
  onClearSsml,
}: TtsInputProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<ComposerTab>('compose');

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onInputChange(event.target.value);
  };

  const handleSsmlChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onSsmlInputChange(event.target.value);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0] ?? null;
    await onAttachFile(file);
    event.target.value = '';
  };

  return (
    <div className="tts-input">
      <div className="tts-input__header">
        <div>
          <p className="tts-input__eyebrow">Composer</p>
          <h2>{authoringMode === 'plainText' ? 'Text and Markdown input' : 'Raw SSML input'}</h2>
        </div>
        <div className="tts-input__counter" data-over-limit={isOverCharacterLimit}>
          {characterCount.toLocaleString()} input chars • {requestSizeBytes.toLocaleString()} /{' '}
          {maxRequestBytes.toLocaleString()} SSML bytes
        </div>
      </div>

      <p className="tts-input__helper">
        {authoringMode === 'plainText'
          ? 'Paste freeform text, attach a local `.md` file, or combine both before generating speech. The byte counter tracks the generated SSML payload Azure Speech receives, not just raw character count.'
          : 'Author a full SSML document directly. The byte counter tracks the exact SSML payload Azure Speech receives after any default voice wrapping is applied.'}
      </p>

      <div className="tts-input__mode-switch" role="group" aria-label="Authoring mode">
        <button
          type="button"
          className="tts-input__mode-option"
          aria-pressed={authoringMode === 'plainText'}
          onClick={() => onAuthoringModeChange('plainText')}
        >
          Plain text
        </button>
        <button
          type="button"
          className="tts-input__mode-option"
          aria-pressed={authoringMode === 'ssml'}
          onClick={() => onAuthoringModeChange('ssml')}
        >
          SSML
        </button>
      </div>

      <div className="tts-input__tabs" role="tablist" aria-label="Composer views">
        <button
          id="tts-input-compose-tab"
          type="button"
          role="tab"
          className="tts-input__tab"
          aria-selected={activeTab === 'compose'}
          aria-controls="tts-input-compose-panel"
          onClick={() => setActiveTab('compose')}
        >
          Compose
        </button>
        <button
          id="tts-input-ssml-tab"
          type="button"
          role="tab"
          className="tts-input__tab"
          aria-selected={activeTab === 'generatedSsml'}
          aria-controls="tts-input-ssml-panel"
          onClick={() => setActiveTab('generatedSsml')}
        >
          Generated SSML
        </button>
      </div>

      {activeTab === 'compose' ? (
        <div
          id="tts-input-compose-panel"
          className="tts-input__tab-panel"
          role="tabpanel"
          aria-labelledby="tts-input-compose-tab"
        >
          {authoringMode === 'plainText' ? (
            <>
              <FormField htmlFor="tts-input-textarea" label="Message input">
                <textarea
                  id="tts-input-textarea"
                  className="tts-input__textarea"
                  aria-label="Message input"
                  placeholder="Type or paste the text you want to hear."
                  rows={12}
                  value={plainTextInput}
                  onChange={handleChange}
                />
              </FormField>

              <div className="tts-input__attachment-row">
                <input
                  ref={fileInputRef}
                  className="tts-input__file-input"
                  type="file"
                  accept=".md,text/markdown"
                  aria-label="Attach Markdown"
                  onChange={(event) => {
                    void handleFileChange(event);
                  }}
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Attach Markdown
                </Button>
                <Button variant="ghost" onClick={onClear}>
                  Clear input
                </Button>
              </div>

              {attachment && (
                <div className="tts-input__attachment-chip">
                  <div>
                    <strong>{attachment.name}</strong>
                    <span>{attachment.size.toLocaleString()} bytes</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={onRemoveAttachment}>
                    Remove
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <FormField htmlFor="tts-input-ssml-textarea" label="SSML input">
                <textarea
                  id="tts-input-ssml-textarea"
                  className="tts-input__textarea tts-input__textarea--code"
                  aria-label="SSML input"
                  placeholder={'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">\n  <voice name="en-US-AvaMultilingualNeural">Hello world.</voice>\n</speak>'}
                  rows={14}
                  spellCheck={false}
                  value={ssmlInput}
                  onChange={handleSsmlChange}
                />
              </FormField>

              <Banner className="tts-input__banner" tone="info">
                Attach Markdown is available only in plain-text mode. In SSML mode, author the full
                <code> &lt;speak&gt; </code>
                document directly.
              </Banner>

              <Button variant="ghost" onClick={onClearSsml}>
                Clear SSML
              </Button>
            </>
          )}
        </div>
      ) : (
        <section
          id="tts-input-ssml-panel"
          className="tts-input__tab-panel tts-input__ssml-preview"
          role="tabpanel"
          aria-labelledby="tts-input-ssml-tab"
        >
          <div className="tts-input__ssml-preview-header">
            <div>
              <p className="tts-input__eyebrow">Generated SSML</p>
              <h3 id="generated-ssml-heading">Preview of the Azure Speech payload</h3>
            </div>
            <span className="tts-input__ssml-preview-badge">Read-only</span>
          </div>

          <p className="tts-input__ssml-preview-helper">
            This preview shows the exact SSML document the app sends to Azure Speech for the current
            authoring mode.
          </p>

          <dl className="tts-input__ssml-sources">
            <div>
              <dt>From settings</dt>
              <dd>{ssmlSettingsSourceLabel}</dd>
            </div>
            <div>
              <dt>From content</dt>
              <dd>{ssmlContentSourceLabel}</dd>
            </div>
          </dl>

          {generatedSsml ? (
            <pre className="tts-input__ssml-code" aria-label="Generated SSML preview">
              {generatedSsml}
            </pre>
          ) : (
            <Banner className="tts-input__banner" role="status" tone="warning">
              Enter valid input to preview the exact SSML payload.
            </Banner>
          )}
        </section>
      )}

      {composerMessage && (
        <Banner className="tts-input__banner" tone="success">
          {composerMessage}
        </Banner>
      )}

      {composerError && (
        <Banner className="tts-input__banner" role="alert" tone="danger">
          {composerError}
        </Banner>
      )}

      {!isConfigured && (
        <Banner className="tts-input__banner" tone="info">
          Add your Azure Speech region and API key in settings before generating audio.
        </Banner>
      )}

      {isOverCharacterLimit && (
        <Banner className="tts-input__banner" role="alert" tone="danger">
          Azure Speech real-time TTS caps each SSML request at {maxRequestBytes.toLocaleString()}{' '}
          bytes. Shorten the input until the payload fits.
        </Banner>
      )}

      <Button
        disabled={isGenerateDisabled}
        fullWidth
        onClick={onGenerate}
      >
        {isGenerating ? 'Generating audio…' : 'Generate audio'}
      </Button>
    </div>
  );
}
