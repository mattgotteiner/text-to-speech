import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { AudioResult } from './components/AudioResult/AudioResult';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { TtsInput } from './components/TtsInput/TtsInput';
import { SettingsProvider, useSettingsContext } from './context/SettingsContext';
import {
  DEFAULT_SETTINGS,
  MAX_TTS_INPUT_CHARS,
  type MarkdownAttachment,
  type SpeechResult,
} from './types';
import { synthesizeSpeech, toErrorMessage } from './utils/api';
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
  const isOverCharacterLimit = characterCount > MAX_TTS_INPUT_CHARS;
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
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await synthesizeSpeech(settings, combinedInput);
      const audioUrl = URL.createObjectURL(response.blob);

      setResult({
        audioBlob: response.blob,
        audioUrl,
        createdAt: new Date().toISOString(),
        fileName: response.fileName,
        format: settings.format,
        input: combinedInput,
        voice: settings.voice,
      });
    } catch (error) {
      setGenerationError(toErrorMessage(error));
    } finally {
      setIsGenerating(false);
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
        <div>
          <p className="app-eyebrow">Azure OpenAI Text to Speech</p>
          <h1>Text Audio</h1>
          <p className="app-subtitle">
            Generate audio from freeform text or a local Markdown file using your
            Azure OpenAI `gpt-4o-mini-tts` deployment.
          </p>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Open settings"
          onClick={() => setIsSettingsOpen((current) => !current)}
        >
          {isSettingsOpen ? 'Hide settings' : 'Open settings'}
        </button>
      </header>

      {!isConfigured && (
        <div className="configuration-banner" role="alert">
          Configure your Azure OpenAI settings to get started.
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
            maxCharacters={MAX_TTS_INPUT_CHARS}
            onAttachFile={handleAttachFile}
            onClear={handleClearInput}
            onGenerate={handleGenerate}
            onInputChange={setFreeText}
            onRemoveAttachment={handleRemoveAttachment}
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

      {isSettingsOpen && (
        <aside className="settings-drawer">
          <SettingsPanel
            defaultDeployment={DEFAULT_SETTINGS.deployment}
            onClose={() => setIsSettingsOpen(false)}
            onReset={handleResetSettings}
            onUpdate={updateSettings}
            settings={settings}
          />
        </aside>
      )}
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
