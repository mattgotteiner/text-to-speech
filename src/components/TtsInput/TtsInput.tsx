import { useRef, useState, type ChangeEvent } from 'react';
import { Banner, Button, FormField } from '@mattgotteiner/spa-ui-controls';
import type { MarkdownAttachment } from '../../types';
import './TtsInput.css';

type ComposerTab = 'compose' | 'generatedSsml';

interface TtsInputProps {
  inputText: string;
  attachment: MarkdownAttachment | null;
  composerMessage: string | null;
  composerError: string | null;
  characterCount: number;
  requestSizeBytes: number;
  maxRequestBytes: number;
  generatedSsml: string;
  ssmlContentSourceLabel: string;
  voiceName: string;
  isConfigured: boolean;
  isGenerating: boolean;
  isOverCharacterLimit: boolean;
  onInputChange: (value: string) => void;
  onAttachFile: (file: File | null) => Promise<void>;
  onRemoveAttachment: () => void;
  onGenerate: () => void;
  onClear: () => void;
}

export function TtsInput({
  inputText,
  attachment,
  composerMessage,
  composerError,
  characterCount,
  requestSizeBytes,
  maxRequestBytes,
  generatedSsml,
  ssmlContentSourceLabel,
  voiceName,
  isConfigured,
  isGenerating,
  isOverCharacterLimit,
  onInputChange,
  onAttachFile,
  onRemoveAttachment,
  onGenerate,
  onClear,
}: TtsInputProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<ComposerTab>('compose');

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onInputChange(event.target.value);
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
          <h2>Text and Markdown input</h2>
        </div>
        <div className="tts-input__counter" data-over-limit={isOverCharacterLimit}>
          {characterCount.toLocaleString()} input chars • {requestSizeBytes.toLocaleString()} /{' '}
          {maxRequestBytes.toLocaleString()} SSML bytes
        </div>
      </div>

      <p className="tts-input__helper">
        Paste freeform text, attach a local `.md` file, or combine both before generating speech.
        The byte counter tracks the generated SSML payload Azure Speech receives, not just raw
        character count.
      </p>

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
          <FormField htmlFor="tts-input-textarea" label="Message input">
            <textarea
              id="tts-input-textarea"
              className="tts-input__textarea"
              aria-label="Message input"
              placeholder="Type or paste the text you want to hear."
              rows={12}
              value={inputText}
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
            This preview shows the exact SSML document the app sends to Azure Speech for plain-text
            generation.
          </p>

          <dl className="tts-input__ssml-sources">
            <div>
              <dt>From settings</dt>
              <dd>
                The <code>&lt;voice&gt;</code> name resolves to <code>{voiceName}</code>, and the{' '}
                <code>&lt;prosody rate&gt;</code> value comes from your current speed setting.
              </dd>
            </div>
            <div>
              <dt>From content</dt>
              <dd>{ssmlContentSourceLabel}</dd>
            </div>
          </dl>

          <pre className="tts-input__ssml-code" aria-label="Generated SSML preview">
            {generatedSsml}
          </pre>
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
        disabled={
          isGenerating ||
          !isConfigured ||
          characterCount === 0 ||
          isOverCharacterLimit
        }
        fullWidth
        onClick={onGenerate}
      >
        {isGenerating ? 'Generating audio…' : 'Generate audio'}
      </Button>
    </div>
  );
}
