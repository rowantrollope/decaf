# Decaf 🌿

A browser extension that rewrites breathless, FOMO-inducing X posts into calm, grounded, factual text. Keep the signal. Lose the anxiety.

## How it works

1. Detects breathless posts using a keyword scorer (ALL CAPS, 🚨🔥 spam, FOMO phrases, hype words)
2. Rewrites them in real-time using a local AI model or Claude API
3. Replaced text gets a subtle green border + 🌿 indicator
4. Click 🌿 to toggle between original and rewritten

## Quick Start

### Option A: Local model (recommended — instant, free, private)

1. Install [Ollama](https://ollama.ai)
2. Pull the model: `ollama pull llama3.2:3b`
3. Start the proxy: `node proxy.js` (keep this running)
4. Load the extension in Chrome (see below)
5. In extension options, select "Ollama (local)" as provider

### Option B: Anthropic API (no setup)

1. Load the extension in Chrome (see below)
2. Get an [Anthropic API key](https://console.anthropic.com)
3. Paste it in extension options

## Install in Chrome

1. Go to `chrome://extensions`
2. Enable Developer Mode (top right toggle)
3. Click "Load unpacked"
4. Select this folder

## Install in Safari

Requires Xcode:
```bash
xcrun safari-web-extension-converter /path/to/decaf
```
Open the generated Xcode project, build it, then enable in Safari → Settings → Extensions.

## Settings

- **Provider**: Ollama / Anthropic API / Auto
- **Breathlessness threshold**: 1–5 (default 3). Lower = more rewrites.
- **Ollama model**: llama3.2:3b (fast) or phi4-mini (higher quality)
- **Show rewrite indicator**: toggle the 🌿 badge
