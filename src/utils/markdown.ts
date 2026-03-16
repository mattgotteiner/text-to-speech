import {
  MAX_MARKDOWN_FILE_BYTES,
  type MarkdownAttachment,
} from '../types';

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read the selected Markdown file.'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read the selected Markdown file.'));
    };

    reader.readAsText(file);
  });
}

export function isMarkdownFile(file: File): boolean {
  const name = file.name.toLowerCase();

  return (
    name.endsWith('.md') ||
    name.endsWith('.markdown') ||
    file.type === 'text/markdown' ||
    file.type === 'text/x-markdown'
  );
}

export async function readMarkdownFile(file: File): Promise<MarkdownAttachment> {
  if (!isMarkdownFile(file)) {
    throw new Error('Only Markdown (.md) files are supported.');
  }

  if (file.size > MAX_MARKDOWN_FILE_BYTES) {
    throw new Error('Markdown files must be 1 MB or smaller.');
  }

  const content = (await readFileText(file)).trim();

  if (!content) {
    throw new Error('The selected Markdown file is empty.');
  }

  return {
    content,
    name: file.name,
    size: file.size,
  };
}

export function buildSpeechInput(
  freeText: string,
  attachment: MarkdownAttachment | null,
): string {
  const trimmedText = freeText.trim();
  const markdownText = attachment?.content.trim() ?? '';

  return [trimmedText, markdownText].filter(Boolean).join('\n\n');
}
