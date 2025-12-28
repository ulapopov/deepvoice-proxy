# DeepVoice Proxy

A simple proxy server for DeepVoiceChat that handles API calls to OpenAI, Anthropic, and Google Gemini.

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ulapopov/deepvoice-proxy)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/ulapopov/deepvoice-proxy.git
cd deepvoice-proxy
npm install
```

### 2. Set Environment Variables

Create a `.env` file (or set in Vercel dashboard):

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

You only need keys for the providers you want to use.

### 3. Run Locally

```bash
npm start
```

Server runs on `http://localhost:3000`

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add your API keys in the Vercel dashboard under Settings → Environment Variables.

## API Endpoints

### GET /models?provider=openai|anthropic|gemini

Returns available models for the provider.

### POST /chat

```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```

Returns:
```json
{
  "content": "Hi there! How can I help you?"
}
```

### GET /health

Returns `{"ok": true}`

## Supported Models

- **OpenAI**: GPT-5 family, GPT-4o
- **Anthropic**: Claude 3.x, Claude 4.x
- **Gemini**: Gemini 2.x, 2.5, 3.x

## Security Notes

- Never commit `.env` files
- Use HTTPS in production
- Consider adding rate limiting for public deployments

## License

MIT
