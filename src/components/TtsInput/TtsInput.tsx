import { useRef, type ChangeEvent } from 'react';
import { Banner, Button, FormField } from '@mattgotteiner/spa-ui-controls';
import type { MarkdownAttachment } from '../../types';
import './TtsInput.css';

interface TtsInputProps {
  inputText: string;
  attachment: MarkdownAttachment | null;
  composerMessage: string | null;
  composerError: string | null;
  characterCount: number;
  requestSizeBytes: number;
  maxRequestBytes: number;
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
          {characterCount.toLocaleString()} chars • {requestSizeBytes.toLocaleString()} /{' '}
          {maxRequestBytes.toLocaleString()} bytes
        </div>
      </div>

      <p className="tts-input__helper">
        Paste freeform text, attach a local `.md` file, or combine both before generating speech.
        Azure Speech enforces the final SSML payload size, not just raw character count.
      </p>

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
