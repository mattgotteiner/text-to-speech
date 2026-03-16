# Text Audio

A Vite + React + TypeScript SPA for experimenting locally with Azure OpenAI text-to-speech using a browser-direct `gpt-4o-mini-tts` workflow.

## What it does

- Accepts freeform text input
- Accepts a local Markdown (`.md`) file and merges its contents into the synthesis input
- Lets you configure Azure OpenAI endpoint, deployment, API key, voice, format, speed, and optional voice instructions
- Plays generated audio directly in the browser with native seek/play controls
- Provides a download action for the generated clip

## Important security note

This scaffold intentionally mirrors the browser-direct setup used by `responses-chat` so you can test quickly in local/dev environments.

That means:

- your Azure OpenAI API key is entered in the browser
- settings are persisted in localStorage on your machine
- this is not the right security posture for a hardened production deployment

If you need stronger secret handling, place the Azure request behind a trusted proxy or backend.

## Prerequisites

- Node.js 22+
- An Azure OpenAI resource with a deployed `gpt-4o-mini-tts` model
- Azure endpoint, deployment name, and API key

## Getting started

```bash
npm install
npm run dev
```

Then open the local Vite URL, open settings, and enter:

- your Azure OpenAI endpoint
- your deployment name
- your API key

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build the app |
| `npm run lint` | Run ESLint |
| `npm run test:run` | Run Vitest once |
| `npm run typecheck` | Run TypeScript without emitting |

## Local testing flow

1. Paste or type text into the composer
2. Optionally attach a Markdown file
3. Click `Generate audio`
4. Preview the result in the built-in audio player
5. Download the generated file if you want to keep it

## Notes

- Azure OpenAI TTS input is currently capped at 4096 characters, so the app shows a live combined character count
- This app uses the `openai` JavaScript SDK with `AzureOpenAI` and `dangerouslyAllowBrowser: true`
- The default API version is `2025-04-01-preview`, based on the current Azure TTS quickstart
