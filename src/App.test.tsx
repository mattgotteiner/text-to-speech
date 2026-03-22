import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS } from './types';
import { encryptValue } from './utils/secureStorage';
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

async function openSettings(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByLabelText('Open settings'));
}

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

    await openSettings(user);

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
    expect(screen.queryByText('Browser-direct Azure Speech')).not.toBeInTheDocument();
    expect(screen.getAllByText('Configure your Azure Speech settings to get started.')).toHaveLength(2);
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    expect(screen.queryByLabelText('Close settings')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('westeurope')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
  });

  it('uses the voice catalog and deselects it when a manual override is entered', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSettings(user);

    const voiceOverride = screen.getByLabelText('Voice name override');
    const adaButton = screen.getByRole('button', { name: /Ada \(UK, multilingual\)/i });

    expect(adaButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(adaButton);

    expect(adaButton).toHaveAttribute('aria-pressed', 'true');
    expect(voiceOverride).toHaveValue('');

    fireEvent.change(voiceOverride, {
      target: { value: 'fr-FR-VivienneMultilingualNeural' },
    });

    expect(voiceOverride).toHaveValue('fr-FR-VivienneMultilingualNeural');
    expect(adaButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('offers a searchable voice catalog with broader availability', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSettings(user);

    const voiceSearch = screen.getByLabelText('Voice catalog');
    const voiceOverride = screen.getByLabelText('Voice name override');

    expect(screen.getByText(/showing 34 of 34 voices/i)).toBeInTheDocument();

    await user.type(voiceSearch, 'xia');

    const xiaoxiaoButton = screen.getByRole('button', { name: /Xiaoxiao \(China\)/i });
    expect(xiaoxiaoButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ava \(US, multilingual\)/i })).not.toBeInTheDocument();

    await user.click(xiaoxiaoButton);

    expect(voiceOverride).toHaveValue('');
    expect(screen.getByRole('button', { name: /Xiaoxiao \(China\)/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('collapses and reopens the settings sidebar', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByPlaceholderText('westeurope')).not.toBeInTheDocument();

    await openSettings(user);

    expect(screen.getByPlaceholderText('westeurope')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close settings'));

    expect(screen.queryByPlaceholderText('westeurope')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
  });

  it('persists an updated region after closing and reopening settings', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSettings(user);

    const regionInput = screen.getByPlaceholderText('westeurope');

    await user.click(regionInput);
    await user.paste('WestEurope');

    await user.click(screen.getByLabelText('Close settings'));
    await openSettings(user);

    expect(screen.getByPlaceholderText('westeurope')).toHaveValue('westeurope');
    expect(localStorage.getItem(APP_SETTINGS_STORAGE_KEY)).toContain('"region":"westeurope"');
  });

  it('asks for the API key again when the saved encrypted key cannot be unlocked', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const encryptedApiKey = await encryptValue('test-key');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('text-audio-secure-storage');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    localStorage.setItem(
      APP_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        apiKey: '',
        encryptedApiKey,
        region: 'westeurope',
      }),
    );

    const user = userEvent.setup();
    render(<App />);

    await openSettings(user);

    expect(
      screen.getByText(/saved api key could not be unlocked in this browser/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your Azure Speech key')).toHaveValue('');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('generates audio from freeform text', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSettings(user);

    await user.type(screen.getByPlaceholderText('westeurope'), 'westeurope');
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
          region: 'westeurope',
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

    await openSettings(user);

    await user.type(screen.getByPlaceholderText('westeurope'), 'westeurope');
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

    await openSettings(user);

    await user.type(screen.getByPlaceholderText('westeurope'), 'westeurope');
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

    await openSettings(user);

    await user.click(screen.getByRole('button', { name: /Ada \(UK, multilingual\)/i }));
    await user.type(screen.getByPlaceholderText('westeurope'), 'westeurope');
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

  it('prefers the manual voice override when generating audio', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSettings(user);

    await user.type(screen.getByLabelText('Voice name override'), 'fr-FR-VivienneMultilingualNeural');
    await user.type(screen.getByPlaceholderText('westeurope'), 'westeurope');
    await user.type(
      screen.getByPlaceholderText('Paste your Azure Speech key'),
      'test-key',
    );
    await user.type(screen.getByLabelText('Message input'), 'Use the override voice');

    await user.click(screen.getByRole('button', { name: 'Generate audio' }));

    await waitFor(() => {
      expect(synthesizeSpeechMock).toHaveBeenCalledWith(
        expect.objectContaining({
          voice: 'en-US-AvaMultilingualNeural',
          voiceOverride: 'fr-FR-VivienneMultilingualNeural',
        }),
        'Use the override voice',
      );
    });
  });
});
