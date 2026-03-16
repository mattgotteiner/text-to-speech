import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { synthesizeSpeech } from './utils/api';

vi.mock('./utils/api', async () => {
  const actual = await vi.importActual<typeof import('./utils/api')>('./utils/api');

  return {
    ...actual,
    synthesizeSpeech: vi.fn(),
  };
});

const synthesizeSpeechMock = vi.mocked(synthesizeSpeech);

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    synthesizeSpeechMock.mockReset();
    synthesizeSpeechMock.mockResolvedValue({
      blob: new Blob(['audio'], { type: 'audio/mpeg' }),
      fileName: 'clip.mp3',
      mimeType: 'audio/mpeg',
    });
  });

  it('renders the scaffold and configuration prompt', () => {
    render(<App />);

    expect(screen.getByText('Text Audio')).toBeInTheDocument();
    expect(screen.getAllByText('Configure your Azure OpenAI settings to get started.')).toHaveLength(2);
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Close settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
  });

  it('collapses and reopens the settings sidebar', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByPlaceholderText('https://your-resource.openai.azure.com')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close settings'));

    expect(
      screen.queryByPlaceholderText('https://your-resource.openai.azure.com'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Open settings'));

    expect(screen.getByPlaceholderText('https://your-resource.openai.azure.com')).toBeInTheDocument();
  });

  it('generates audio from freeform text', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByPlaceholderText('https://your-resource.openai.azure.com'),
      'https://example.openai.azure.com',
    );
    await user.type(
      screen.getByPlaceholderText('Paste your Azure OpenAI key'),
      'test-key',
    );
    await user.type(screen.getByLabelText('Message input'), 'Read this aloud');

    await user.click(screen.getByRole('button', { name: 'Generate audio' }));

    await waitFor(() => {
      expect(synthesizeSpeechMock).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-key',
          deployment: 'gpt-4o-mini-tts',
          endpoint: 'https://example.openai.azure.com',
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
      screen.getByPlaceholderText('https://your-resource.openai.azure.com'),
      'https://example.openai.azure.com',
    );
    await user.type(
      screen.getByPlaceholderText('Paste your Azure OpenAI key'),
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
});
