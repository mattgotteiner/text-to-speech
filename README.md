# Azure Text To Speech

A Vite + React + TypeScript SPA for experimenting locally with Azure Speech text-to-speech using a browser-direct Speech SDK workflow.

## What it does

- Accepts freeform text input
- Accepts a local Markdown (`.md`) file and merges its contents into the synthesis input
- Lets you configure an Azure Speech region, API key, a common-voices preset dropdown with custom voice entry, output format, and playback speed
- Plays generated audio directly in the browser with native seek/play controls
- Provides a download action for the generated clip

## Important security note

This scaffold intentionally mirrors the browser-direct setup used by `responses-chat` so you can test quickly in local/dev environments.

That means:

- your Azure Speech API key is entered in the browser
- non-secret settings are persisted in localStorage, and the API key is encrypted before it is written there
- this is not the right security posture for a hardened production deployment

The browser-managed encryption key is kept outside localStorage, which helps against casual inspection of browser storage but is still not equivalent to a backend secret store.

If you need stronger secret handling, place the Azure request behind a trusted proxy or backend.

## Prerequisites

- Node.js 22+
- An Azure Speech resource
- Azure Speech region and API key

## Getting started

```bash
npm login --scope=@mattgotteiner --auth-type=legacy --registry=https://npm.pkg.github.com
npm install
npm run dev
```

Then open the local Vite URL, open settings, and enter:

- your Azure Speech region (for example `westeurope` or `eastus`)
- your API key

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build the app |
| `npm run generate-icons` | Regenerate favicon and PWA icon assets |
| `npm run lint` | Run ESLint |
| `npm run test:run` | Run Vitest once |
| `npm run typecheck` | Run TypeScript without emitting |

Because the app consumes `@mattgotteiner/spa-ui-controls` from GitHub Packages, `npm login` for the `@mattgotteiner` scope is required before install unless your environment already has package read access configured.

## Local testing flow

1. Paste or type text into the composer
2. Optionally attach a Markdown file
3. Click `Generate audio`
4. Preview the result in the built-in audio player
5. Download the generated file if you want to keep it

## Notes

- The app validates against Azure Speech's documented 64 KB real-time SSML request limit, so the composer shows both raw character count and encoded payload size
- Azure Speech real-time text-to-speech also has a separate hard limit of 10 minutes of audio produced per request. If a request stays under the SSML byte cap but would synthesize to more than 10 minutes of audio, Azure can fail with an error such as `The processed audio has exceeded the configured maximum media duration of 600000ms`.
- Longer content is a known limitation of the current browser-direct workflow. Supporting it would require additional work such as splitting synthesis into smaller requests and merging the results, or moving long-form jobs to Azure Batch Synthesis.
- This app uses the `microsoft-cognitiveservices-speech-sdk` package directly in the browser and converts the returned `audioData` into a downloadable `Blob`
- If you previously used the endpoint-based setup, reopen settings and add your Azure Speech region before generating audio
- If you previously used the Azure OpenAI flow, reset settings once so the app clears the old localStorage schema
