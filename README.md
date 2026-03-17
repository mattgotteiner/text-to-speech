# Azure Text To Speech

A Vite + React + TypeScript SPA for experimenting locally with Azure Speech text-to-speech using a browser-direct Speech SDK workflow.

## What it does

- Accepts freeform text input
- Accepts a local Markdown (`.md`) file and merges its contents into the synthesis input
- Lets you configure an Azure Speech endpoint, API key, a common-voices preset dropdown with custom voice entry, output format, and playback speed
- Plays generated audio directly in the browser with native seek/play controls
- Provides a download action for the generated clip

## Important security note

This scaffold intentionally mirrors the browser-direct setup used by `responses-chat` so you can test quickly in local/dev environments.

That means:

- your Azure Speech API key is entered in the browser
- settings are persisted in localStorage on your machine
- this is not the right security posture for a hardened production deployment

If you need stronger secret handling, place the Azure request behind a trusted proxy or backend.

## Prerequisites

- Node.js 22+
- An Azure Speech resource
- Azure Speech endpoint and API key

## Getting started

```bash
npm install
npm run dev
```

Then open the local Vite URL, open settings, and enter:

- your Azure Speech endpoint
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

- The app validates against Azure Speech's documented 64 KB real-time SSML request limit, so the composer shows both raw character count and encoded payload size
- This app uses the `microsoft-cognitiveservices-speech-sdk` package directly in the browser and converts the returned `audioData` into a downloadable `Blob`
- If you previously used the Azure OpenAI flow, reset settings once so the app clears the old localStorage schema
