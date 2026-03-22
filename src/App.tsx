import { useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  Banner,
  Button,
  Panel,
  ThemeProvider,
  TopBar,
  useTheme,
} from '@mattgotteiner/spa-ui-controls';
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
  type Theme,
} from './types';
import {
  getSpeechRequestSizeBytes,
  synthesizeSpeech,
  toErrorMessage,
} from './utils/api';
import { buildSpeechInput, readMarkdownFile } from './utils/markdown';

interface ThemeSettingsSyncProps {
  theme: Theme;
}

function ThemeSettingsSync({ theme }: ThemeSettingsSyncProps): React.ReactElement | null {
  const { setTheme, theme: activeTheme } = useTheme();

  useEffect(() => {
    if (activeTheme !== theme) {
      setTheme(theme);
    }
  }, [activeTheme, setTheme, theme]);

  return null;
}

function AppContent(): React.ReactElement {
  const { settings, updateSettings, resetSettings, isConfigured } = useSettingsContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [freeText, setFreeText] = useState<string>('');
  const [attachment, setAttachment] = useState<MarkdownAttachment | null>(null);
  const [composerMessage, setComposerMessage] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<SpeechResult | null>(null);

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
    <ThemeProvider initialTheme={settings.theme} persist={false}>
      <ThemeSettingsSync theme={settings.theme} />
      <AppShell
        header={
          <TopBar
            subtitle="Generate audio from freeform text or a local Markdown file using your Azure Speech resource."
            title={
              <div className="app-title-block">
                <p className="app-eyebrow">Browser-direct Azure Speech</p>
                <h1>Azure Text To Speech</h1>
              </div>
            }
            trailing={
              <SettingsButton
                isConfigured={isConfigured}
                onClick={() => setIsSettingsOpen(true)}
              />
            }
          />
        }
      >
        {!isConfigured && (
          <Banner
            actions={
              <Button variant="secondary" onClick={() => setIsSettingsOpen(true)}>
                Open settings
              </Button>
            }
            heading="Configuration required"
            tone="warning"
          >
            Configure your Azure Speech settings to get started.
          </Banner>
        )}

        <div className="app-layout">
          <Panel as="section">
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
          </Panel>

          <Panel as="section">
            <AudioResult
              error={generationError}
              hasConfiguration={isConfigured}
              isGenerating={isGenerating}
              onDownload={handleDownload}
              result={result}
            />
          </Panel>
        </div>

        <SettingsSidebar
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onReset={handleResetSettings}
          onUpdate={updateSettings}
          settings={settings}
        />
      </AppShell>
    </ThemeProvider>
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
