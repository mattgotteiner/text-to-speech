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
  type AuthoringMode,
  type MarkdownAttachment,
  type SpeechResult,
  type Theme,
} from './types';
import {
  buildSpeechRequestPayload,
  ssmlContainsVoiceTag,
  synthesizeSpeech,
  toErrorMessage,
} from './utils/api';
import { buildSpeechInput, readMarkdownFile } from './utils/markdown';
import { getEffectiveVoiceName } from './utils/voices';

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
  const { settings, updateSettings, resetSettings, isConfigured, persistenceMessage } =
    useSettingsContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [freeText, setFreeText] = useState<string>('');
  const [ssmlText, setSsmlText] = useState<string>('');
  const [attachment, setAttachment] = useState<MarkdownAttachment | null>(null);
  const [composerMessage, setComposerMessage] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [authoringMode, setAuthoringMode] = useState<AuthoringMode>('plainText');

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
  const activeInput = authoringMode === 'plainText' ? combinedInput : ssmlText;
  const characterCount = activeInput.length;
  const speechRequestState = useMemo(() => {
    try {
      return {
        error: null,
        payload: buildSpeechRequestPayload(settings, activeInput, authoringMode),
      };
    } catch (error) {
      return {
        error: toErrorMessage(error),
        payload: null,
      };
    }
  }, [activeInput, authoringMode, settings]);
  const speechRequestPayload = speechRequestState.payload;
  const requestSizeBytes =
    speechRequestPayload?.ssmlByteLength ?? new TextEncoder().encode(activeInput).length;
  const isOverCharacterLimit = requestSizeBytes > MAX_TTS_SSML_BYTES;
  const isGenerateDisabled =
    isGenerating ||
    !isConfigured ||
    activeInput.trim().length === 0 ||
    isOverCharacterLimit ||
    speechRequestPayload === null;
  const ssmlDefinesVoice = authoringMode === 'ssml' && ssmlContainsVoiceTag(ssmlText);
  const generatedSsml = speechRequestPayload?.ssml ?? '';
  const ssmlSettingsSourceLabel =
    authoringMode === 'plainText'
      ? `The <voice> name resolves to ${getEffectiveVoiceName(settings)}, and the <prosody rate> value comes from your current speed setting.`
      : ssmlDefinesVoice
        ? 'Your SSML already includes one or more <voice> blocks, so the default voice selector is not injected. The speed setting is not injected in SSML mode.'
        : `Your SSML omits <voice> blocks, so the default voice selector resolves to ${getEffectiveVoiceName(settings)} and is added as the root <voice>. The speed setting is not injected in SSML mode.`;
  const ssmlContentSourceLabel =
    authoringMode === 'plainText'
      ? attachment
        ? 'The text inside <prosody> comes from your message input plus the attached Markdown file.'
        : 'The text inside <prosody> comes from your message input.'
      : speechRequestPayload
        ? 'This preview shows the exact SSML payload Azure Speech receives after any default voice wrapping is applied.'
        : 'Fix the SSML validation error to preview the exact payload Azure Speech would receive.';
  const activeComposerError = composerError ?? speechRequestState.error;

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

  const handleClearSsml = (): void => {
    setSsmlText('');
    setComposerMessage(null);
    setComposerError(null);
  };

  const handleGenerate = async (): Promise<void> => {
    if (isGenerateDisabled || !speechRequestPayload) {
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
        inputLength: activeInput.length,
        voice: speechRequestPayload.usesExplicitVoiceTags
          ? 'ssml-defined'
          : getEffectiveVoiceName(settings),
      });

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await synthesizeSpeech(settings, activeInput, authoringMode);
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
        input: speechRequestPayload.ssml,
        voice: speechRequestPayload.usesExplicitVoiceTags
          ? 'SSML-defined voices'
          : getEffectiveVoiceName(settings),
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
              authoringMode={authoringMode}
              characterCount={characterCount}
              composerError={activeComposerError}
              composerMessage={composerMessage}
              generatedSsml={generatedSsml}
              isConfigured={isConfigured}
              isGenerateDisabled={isGenerateDisabled}
              isGenerating={isGenerating}
              isOverCharacterLimit={isOverCharacterLimit}
              maxRequestBytes={MAX_TTS_SSML_BYTES}
              onAttachFile={handleAttachFile}
              onAuthoringModeChange={setAuthoringMode}
              onClear={handleClearInput}
              onClearSsml={handleClearSsml}
              onGenerate={handleGenerate}
              onInputChange={setFreeText}
              onSsmlInputChange={setSsmlText}
              onRemoveAttachment={handleRemoveAttachment}
              plainTextInput={freeText}
              requestSizeBytes={requestSizeBytes}
              ssmlContentSourceLabel={ssmlContentSourceLabel}
              ssmlInput={ssmlText}
              ssmlSettingsSourceLabel={ssmlSettingsSourceLabel}
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
          persistenceMessage={persistenceMessage}
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
