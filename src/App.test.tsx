import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS } from './types';
import { synthesizeSpeech } from './utils/api';

vi.mock('./utils/api', async () => {
  const actual = await vi.importActual<typeof import('./utils/api')>('./utils/api');

  return {
    ...actual,
    synthesizeSpeech: vi.fn(),
    toErrorMessage: (error: unknown) =>
      error instanceof Error ? error.message : 'Something went wrong while processing the request.',
  };
});

const synthesizeSpeechMock = vi.mocked(synthesizeSpeech);

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    synthesizeSpeechMock.mockReset();
    synthesizeSpeechMock.mockResolvedValue({
      blob: new Blob(['audio'], { type: 'audio/mpeg' }),
      fileName: 'clip.mp3',
      mimeType: 'audio/mpeg',
    });
  });

  it('renders theme controls in settings and applies the selected root class', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByLabelText('Light')).toBeInTheDocument();
    expect(screen.getByLabelText('Dark')).toBeInTheDocument();
    expect(screen.getByLabelText('System')).toBeChecked();

    await user.click(screen.getByLabelText('Dark'));

    expect(screen.getByLabelText('Dark')).toBeChecked();
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('applies the light theme class from stored settings', () => {
    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, theme: 'light' }),
    );

    render(<App />);

    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
  });

  it('applies no explicit theme class when system theme is stored', () => {
    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, theme: 'system' }),
    );

    render(<App />);

    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
  });

  it('renders the scaffold and configuration prompt', () => {
    render(<App />);

    expect(screen.getByText('Azure Text To Speech')).toBeInTheDocument();
    expect(screen.getAllByText('Configure your Azure Speech settings to get started.')).toHaveLength(2);
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Close settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
  });

  it('offers grouped voice presets and keeps a custom voice field', async () => {
    const user = userEvent.setup();
    render(<App />);

    const voicePreset = screen.getByLabelText('Voice preset');
    const voiceName = screen.getByLabelText('Voice name');

    expect(screen.getByRole('option', { name: 'Ava (US, multilingual)' })).toBeInTheDocument();
    expect(voiceName).toHaveValue('en-US-AvaMultilingualNeural');

    await user.selectOptions(voicePreset, 'en-GB-AdaMultilingualNeural');
    expect(voiceName).toHaveValue('en-GB-AdaMultilingualNeural');

    fireEvent.change(voiceName, {
      target: { value: 'fr-FR-VivienneMultilingualNeural' },
    });

    expect(voicePreset).toHaveValue('__custom_voice__');
    expect(voiceName).toHaveValue('fr-FR-VivienneMultilingualNeural');
  });

  it('collapses and reopens the settings sidebar', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByPlaceholderText('https://your-resource.cognitiveservices.azure.com'),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close settings'));

    expect(
      screen.queryByPlaceholderText('https://your-resource.cognitiveservices.azure.com'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Open settings'));

    expect(
      screen.getByPlaceholderText('https://your-resource.cognitiveservices.azure.com'),
    ).toBeInTheDocument();
  });

  it('generates audio from freeform text', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByPlaceholderText('https://your-resource.cognitiveservices.azure.com'),
      'https://example.cognitiveservices.azure.com',
    );
    await user.type(
      screen.getByPlaceholderText('Paste your Azure Speech key'),
      'test-key',
    );
    await user.type(screen.getByLabelText('Message input'), 'Read this aloud');

    await user.click(screen.getByRole('button', { name: 'Generate audio' }));

    await waitFor(() => {
      expect(synthesizeSpeechMock).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-key',
          endpoint: 'https://example.cognitiveservices.azure.com',
          voice: 'en-US-AvaMultilingualNeural',
        }),
        'Read this aloud',
      );
    });

    expect(screen.getByLabelText('Generated audio player')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download audio' })).toBeInTheDocument();
  });

  it('reads attached markdown files and includes the contents in the request', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByPlaceholderText('https://your-resource.cognitiveservices.azure.com'),
      'https://example.cognitiveservices.azure.com',
    );
    await user.type(
      screen.getByPlaceholderText('Paste your Azure Speech key'),
      'test-key',
    );

    const file = new File(['# Heading\n\nMarkdown body'], 'notes.md', {
      type: 'text/markdown',
    });

    fireEvent.change(screen.getByLabelText(/Attach Markdown/i, { selector: 'input' }), {
      target: { files: [file] },
    });

    await screen.findByText('notes.md');

    await user.click(screen.getByRole('button', { name: 'Generate audio' }));

    await waitFor(() => {
      expect(synthesizeSpeechMock).toHaveBeenCalledWith(
        expect.anything(),
        '# Heading\n\nMarkdown body',
      );
    });

    expect(screen.getByText('notes.md')).toBeInTheDocument();
  });

  it('blocks requests that exceed the Azure Speech SSML payload limit', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByPlaceholderText('https://your-resource.cognitiveservices.azure.com'),
      'https://example.cognitiveservices.azure.com',
    );
    await user.type(
      screen.getByPlaceholderText('Paste your Azure Speech key'),
      'test-key',
    );

    fireEvent.change(screen.getByLabelText('Message input'), {
      target: { value: 'a'.repeat(70000) },
    });

    expect(
      screen.getByText(/Azure Speech real-time TTS caps each SSML request at 65,536 bytes/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate audio' })).toBeDisabled();
    expect(synthesizeSpeechMock).not.toHaveBeenCalled();
  });

  it('uses a selected preset voice when generating audio', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('Voice preset'), 'en-GB-AdaMultilingualNeural');
    await user.type(
      screen.getByPlaceholderText('https://your-resource.cognitiveservices.azure.com'),
      'https://example.cognitiveservices.azure.com',
    );
    await user.type(
      screen.getByPlaceholderText('Paste your Azure Speech key'),
      'test-key',
    );
    await user.type(screen.getByLabelText('Message input'), 'Use the selected voice');

    await user.click(screen.getByRole('button', { name: 'Generate audio' }));

    await waitFor(() => {
      expect(synthesizeSpeechMock).toHaveBeenCalledWith(
        expect.objectContaining({
          voice: 'en-GB-AdaMultilingualNeural',
        }),
        'Use the selected voice',
      );
    });
  });
});
