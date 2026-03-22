import { Banner, Button } from '@mattgotteiner/spa-ui-controls';
import type { SpeechResult } from '../../types';
import './AudioResult.css';

interface AudioResultProps {
  result: SpeechResult | null;
  isGenerating: boolean;
  error: string | null;
  hasConfiguration: boolean;
  onDownload: () => void;
}

export function AudioResult({
  result,
  isGenerating,
  error,
  hasConfiguration,
  onDownload,
}: AudioResultProps): React.ReactElement {
  if (!hasConfiguration) {
    return (
      <div className="audio-result audio-result--empty">
        <p className="audio-result__eyebrow">Output</p>
        <h2>Ready when you are</h2>
        <p>Configure your Azure Speech settings to get started.</p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="audio-result audio-result--empty">
        <p className="audio-result__eyebrow">Output</p>
        <h2>Generating audio</h2>
        <p>Your browser will show a playable preview here as soon as the response returns.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="audio-result audio-result--empty">
        <p className="audio-result__eyebrow">Output</p>
        <h2>No audio generated yet</h2>
        <p>Use the composer to send plain text, Markdown content, or both.</p>
        {error && (
          <Banner role="alert" tone="danger">
            {error}
          </Banner>
        )}
      </div>
    );
  }

  const excerpt = result.input.length > 320 ? `${result.input.slice(0, 320)}…` : result.input;

  return (
    <div className="audio-result">
      <div className="audio-result__header">
        <div>
          <p className="audio-result__eyebrow">Latest audio</p>
          <h2>Your generated clip</h2>
        </div>
        <Button
          variant="secondary"
          aria-label="Download audio"
          onClick={onDownload}
        >
          Download audio
        </Button>
      </div>

      {error && (
        <Banner role="alert" tone="danger">
          {error}
        </Banner>
      )}

      <audio
        className="audio-result__player"
        controls
        preload="metadata"
        src={result.audioUrl}
        aria-label="Generated audio player"
      />

      <dl className="audio-result__meta">
        <div>
          <dt>Voice</dt>
          <dd>{result.voice}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{result.format}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{new Date(result.createdAt).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="audio-result__excerpt">
        <h3>Source excerpt</h3>
        <pre>{excerpt}</pre>
      </div>
    </div>
  );
}
