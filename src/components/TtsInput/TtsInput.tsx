import { useRef, type ChangeEvent } from 'react';
import type { MarkdownAttachment } from '../../types';
import './TtsInput.css';

interface TtsInputProps {
  inputText: string;
  attachment: MarkdownAttachment | null;
  composerMessage: string | null;
  composerError: string | null;
  characterCount: number;
  maxCharacters: number;
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
  maxCharacters,
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
          {characterCount} / {maxCharacters}
        </div>
      </div>

      <p className="tts-input__helper">
        Paste freeform text, attach a local `.md` file, or combine both before generating speech.
      </p>

      <label className="tts-input__label" htmlFor="tts-input-textarea">
        Message input
      </label>
      <textarea
        id="tts-input-textarea"
        className="tts-input__textarea"
        aria-label="Message input"
        placeholder="Type or paste the text you want to hear."
        rows={12}
        value={inputText}
        onChange={handleChange}
      />

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
        <button
          className="tts-input__button tts-input__button--secondary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Attach Markdown
        </button>
        <button
          className="tts-input__button tts-input__button--ghost"
          type="button"
          onClick={onClear}
        >
          Clear input
        </button>
      </div>

      {attachment && (
        <div className="tts-input__attachment-chip">
          <div>
            <strong>{attachment.name}</strong>
            <span>{attachment.size.toLocaleString()} bytes</span>
          </div>
          <button type="button" onClick={onRemoveAttachment}>
            Remove
          </button>
        </div>
      )}

      {composerMessage && (
        <div className="tts-input__notice" role="status">
          {composerMessage}
        </div>
      )}

      {composerError && (
        <div className="tts-input__error" role="alert">
          {composerError}
        </div>
      )}

      {!isConfigured && (
        <div className="tts-input__notice">
          Add your endpoint, deployment, and API key in settings before generating audio.
        </div>
      )}

      {isOverCharacterLimit && (
        <div className="tts-input__error" role="alert">
          Azure OpenAI TTS input currently supports up to {maxCharacters} characters.
        </div>
      )}

      <button
        className="tts-input__button tts-input__button--primary"
        type="button"
        disabled={
          isGenerating ||
          !isConfigured ||
          characterCount === 0 ||
          isOverCharacterLimit
        }
        onClick={onGenerate}
      >
        {isGenerating ? 'Generating audio…' : 'Generate audio'}
      </button>
    </div>
  );
}
