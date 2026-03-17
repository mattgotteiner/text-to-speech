import { describe, expect, it } from 'vitest';
import { buildSpeechInput, isMarkdownFile, readMarkdownFile } from './markdown';

describe('markdown helpers', () => {
  it('recognizes markdown files', () => {
    expect(isMarkdownFile(new File(['# Notes'], 'notes.md', { type: 'text/markdown' }))).toBe(
      true,
    );
  });

  it('rejects non-markdown files', async () => {
    await expect(
      readMarkdownFile(new File(['hello'], 'notes.txt', { type: 'text/plain' })),
    ).rejects.toThrow('Only Markdown (.md) files are supported.');
  });

  it('rejects empty markdown files', async () => {
    await expect(
      readMarkdownFile(new File(['   '], 'empty.md', { type: 'text/markdown' })),
    ).rejects.toThrow('The selected Markdown file is empty.');
  });

  it('returns parsed markdown attachment data', async () => {
    const file = new File(['# Heading'], 'notes.md', { type: 'text/markdown' });

    await expect(readMarkdownFile(file)).resolves.toEqual({
      content: '# Heading',
      name: 'notes.md',
      size: file.size,
    });
  });

  it('combines free text and attachment text', () => {
    expect(
      buildSpeechInput('Read this intro', {
        content: '# Heading',
        name: 'notes.md',
        size: 10,
      }),
    ).toBe('Read this intro\n\n# Heading');
  });
});
