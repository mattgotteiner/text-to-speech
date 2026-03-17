import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { AudioResult } from './components/AudioResult/AudioResult';
import { SettingsButton } from './components/SettingsButton/SettingsButton';
import { SettingsSidebar } from './components/SettingsSidebar/SettingsSidebar';
import { TtsInput } from './components/TtsInput/TtsInput';
import { SettingsProvider, useSettingsContext } from './context/SettingsContext';
import {
  MAX_TTS_SSML_BYTES,
  type MarkdownAttachment,
  type SpeechResult,
} from './types';
import {
  getSpeechRequestSizeBytes,
  synthesizeSpeech,
  toErrorMessage,
} from './utils/api';
import { buildSpeechInput, readMarkdownFile } from './utils/markdown';

function AppContent(): React.ReactElement {
  const { settings, updateSettings, resetSettings, isConfigured } = useSettingsContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(() => !isConfigured);
  const [freeText, setFreeText] = useState<string>('');
  const [attachment, setAttachment] = useState<MarkdownAttachment | null>(null);
  const [composerMessage, setComposerMessage] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<SpeechResult | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      setIsSettingsOpen(true);
    }
  }, [isConfigured]);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('theme-light', 'theme-dark');

    if (settings.theme === 'light') {
      root.classList.add('theme-light');
    } else if (settings.theme === 'dark') {
      root.classList.add('theme-dark');
    }

    return () => {
      root.classList.remove('theme-light', 'theme-dark');
    };
  }, [settings.theme]);

  useEffect(() => {
    return () => {
      if (result) {
        URL.revokeObjectURL(result.audioUrl);
      }
    };
  }, [result]);

  const combinedInput = useMemo(
    () => buildSpeechInput(freeText, attachment),
    [attachment, freeText],
  );
  const characterCount = combinedInput.length;
  const requestSizeBytes = useMemo(
    () => getSpeechRequestSizeBytes(settings, combinedInput),
    [combinedInput, settings],
  );
  const isOverCharacterLimit = requestSizeBytes > MAX_TTS_SSML_BYTES;
  const isGenerateDisabled =
    isGenerating ||
    !isConfigured ||
    combinedInput.trim().length === 0 ||
    isOverCharacterLimit;

  const handleAttachFile = async (file: File | null): Promise<void> => {
    if (!file) {
      return;
    }

    setComposerError(null);
    setComposerMessage(null);

    try {
      const nextAttachment = await readMarkdownFile(file);
      setAttachment(nextAttachment);
      setComposerMessage(`Attached ${nextAttachment.name}`);
    } catch (error) {
      setComposerError(toErrorMessage(error));
    }
  };

  const handleRemoveAttachment = (): void => {
    setAttachment(null);
    setComposerMessage('Removed Markdown attachment');
    setComposerError(null);
  };

  const handleClearInput = (): void => {
    setFreeText('');
    setAttachment(null);
    setComposerMessage(null);
    setComposerError(null);
  };

  const handleGenerate = async (): Promise<void> => {
    if (isGenerateDisabled) {
      console.info('[text-audio] Generate skipped because action is disabled', {
        characterCount,
        hasConfiguration: isConfigured,
        isGenerating,
        isOverCharacterLimit,
      });
      return;
    }

    const startedAt = performance.now();

    console.info('[text-audio] Generate requested', {
      attachmentName: attachment?.name ?? null,
      inputLength: combinedInput.length,
      voice: settings.voice,
    });

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await synthesizeSpeech(settings, combinedInput);
      const audioUrl = URL.createObjectURL(response.blob);

      console.info('[text-audio] Audio URL created', {
        audioUrl,
        blobSize: response.blob.size,
        elapsedMs: Math.round(performance.now() - startedAt),
        fileName: response.fileName,
      });

      setResult({
        audioBlob: response.blob,
        audioUrl,
        createdAt: new Date().toISOString(),
        fileName: response.fileName,
        format: settings.format,
        input: combinedInput,
        voice: settings.voice,
      });

      console.info('[text-audio] Generate completed successfully', {
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      console.error('[text-audio] Generate failed', error);
      setGenerationError(toErrorMessage(error));
    } finally {
      setIsGenerating(false);
      console.info('[text-audio] Generate finished', {
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    }
  };

  const handleDownload = (): void => {
    if (!result) {
      return;
    }

    const link = document.createElement('a');
    link.href = result.audioUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetSettings = (): void => {
    resetSettings();
    setComposerMessage('Settings reset to defaults.');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__title-area">
          <div>
            <p className="app-eyebrow">Browser-direct Azure Speech</p>
            <h1>Azure Text To Speech</h1>
            <p className="app-subtitle">
              Generate audio from freeform text or a local Markdown file using your
              Azure Speech resource.
            </p>
          </div>
        </div>
        <div className="app-header__actions">
          <SettingsButton
            isConfigured={isConfigured}
            onClick={() => setIsSettingsOpen(true)}
          />
        </div>
      </header>

      <div className="app-body">
        {!isConfigured && (
          <div className="configuration-banner" role="alert">
            <span className="configuration-banner__icon" aria-hidden="true">
              !
            </span>
            <span className="configuration-banner__text">
              Configure your Azure Speech settings to get started.
            </span>
            <button
              className="configuration-banner__button"
              type="button"
              onClick={() => setIsSettingsOpen(true)}
            >
              Open settings
            </button>
          </div>
        )}

        <main className="app-layout">
          <section className="panel panel--input">
            <TtsInput
              attachment={attachment}
              characterCount={characterCount}
              composerError={composerError}
              composerMessage={composerMessage}
              inputText={freeText}
              isConfigured={isConfigured}
              isGenerating={isGenerating}
              isOverCharacterLimit={isOverCharacterLimit}
              maxRequestBytes={MAX_TTS_SSML_BYTES}
              onAttachFile={handleAttachFile}
              onClear={handleClearInput}
              onGenerate={handleGenerate}
              onInputChange={setFreeText}
              onRemoveAttachment={handleRemoveAttachment}
              requestSizeBytes={requestSizeBytes}
            />
          </section>

          <section className="panel panel--result">
            <AudioResult
              error={generationError}
              hasConfiguration={isConfigured}
              isGenerating={isGenerating}
              onDownload={handleDownload}
              result={result}
            />
          </section>
        </main>
      </div>

      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReset={handleResetSettings}
        onUpdate={updateSettings}
        settings={settings}
      />
    </div>
  );
}

function App(): React.ReactElement {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
