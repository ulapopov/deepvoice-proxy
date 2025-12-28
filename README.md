# DeepVoice Proxy 🚀

The secure, high-performance bridge for DeepVoiceChat. Handles multi-provider LLM calls and Whisper transcription.

## ⚡ Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ulapopov/deepvoice-proxy)

---

## 🛠️ Features

- 🔄 **Unified API**: One interface for OpenAI, Anthropic, and Google Gemini.
- 🎙️ **Whisper Support**: Dedicated `/transcribe` endpoint for high-quality STT.
- 🛡️ **Secure**: Keeps API keys safe in environment variables, never on the client.
- ☁️ **Vercel Native**: Optimized for serverless deployment.

## ⚙️ Setup

### 1. Set Environment Variables
Set these in your Vercel dashboard or a local `.env` file:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

### 2. Local Development
```bash
npm install
npm start
```

---

## 📡 API Endpoints

### 🎤 POST `/transcribe`
Accepts multipart audio files and returns text via OpenAI Whisper.

### 💬 POST `/chat`
Standard chat endpoint supporting providers: `openai`, `anthropic`, `gemini`.

### 📋 GET `/models`
Lists available models for a specific provider.

## 🏷️ GitHub Topics
`node.js`, `express`, `proxy`, `openai`, `whisper`, `llm`, `gemini`, `claude`, `vercel`

## 📄 License
MIT
