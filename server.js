import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const upload = multer({ dest: "/tmp/" });
const PORT = process.env.PORT || 3000;

// ---------- helpers ----------
function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function toOpenAIMessages(messages = []) {
  return messages.map(m => ({ role: m.role, content: m.content }));
}

function toAnthropicMessages(messages = []) {
  return messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role, content: m.content }));
}

function getSystem(messages = []) {
  return messages.find(m => m.role === "system")?.content || "";
}

// ---------- models ----------
app.get("/models", async (req, res) => {
  try {
    const provider = (req.query.provider || "").toString();

    if (provider === "openai") {
      const key = requireEnv("OPENAI_API_KEY");
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!r.ok) return res.status(r.status).send(await r.text());
      const j = await r.json();
      const models = (j.data || [])
        .map(m => ({ id: m.id }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return res.json(models);
    }

    if (provider === "anthropic") {
      const key = requireEnv("ANTHROPIC_API_KEY");
      const r = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
      });
      if (!r.ok) return res.status(r.status).send(await r.text());
      const j = await r.json();
      const models = (j.data || [])
        .map(m => ({ id: m.id }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return res.json(models);
    }

    if (provider === "gemini") {
      const key = requireEnv("GEMINI_API_KEY");
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
      const r = await fetch(url);
      if (!r.ok) return res.status(r.status).send(await r.text());
      const j = await r.json();
      const models = (j.models || [])
        .map(m => ({ id: m.name }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return res.json(models);
    }

    return res.status(400).json({ error: "Unknown provider" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ---------- chat ----------
app.post("/chat", async (req, res) => {
  try {
    const { provider, model, messages } = req.body || {};
    if (!provider || !model) return res.status(400).json({ error: "provider and model required" });

    if (provider === "openai") {
      const key = requireEnv("OPENAI_API_KEY");
      const body = {
        model,
        messages: toOpenAIMessages(messages),
      };
      if (!String(model).startsWith("gpt-5")) {
        body.temperature = typeof req.body.temperature === "number" ? req.body.temperature : 0.2;
      } 
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) return res.status(r.status).send(await r.text());
      const j = await r.json();
      const content = j.choices?.[0]?.message?.content ?? "";
      return res.json({ content });
    }

    if (provider === "anthropic") {
      const key = requireEnv("ANTHROPIC_API_KEY");
      const body = {
        model,
        system: getSystem(messages),
        messages: toAnthropicMessages(messages),
        max_tokens: 800,
        temperature: 0.2,
      };
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) return res.status(r.status).send(await r.text());
      const j = await r.json();
      const content = j.content?.map(x => x.text).join("") ?? "";
      return res.json({ content });
    }

    if (provider === "gemini") {
      const key = requireEnv("GEMINI_API_KEY");
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(key)}`;

      const contents = (messages || [])
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const system = getSystem(messages);
      const body = {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: { temperature: 0.2 },
      };

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) return res.status(r.status).send(await r.text());
      const j = await r.json();
      const content = j.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ?? "";
      return res.json({ content });
    }

    return res.status(400).json({ error: "Unknown provider" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ---------- transcribe ----------
app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    const key = requireEnv("OPENAI_API_KEY");
    const file = req.file;
    if (!file) return res.status(400).send("No file uploaded");

    const form = new FormData();
    form.append("file", fs.createReadStream(file.path), {
      filename: file.originalname,
      contentType: "audio/m4a",
    });
    form.append("model", "whisper-1");

    const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${key}`,
      },
    });

    // Cleanup local temp file
    fs.unlinkSync(file.path);

    res.send(response.data.text);
  } catch (error) {
    console.error("Transcription error:", error.response?.data || error.message);
    res.status(500).send("Transcription failed: " + (error.response?.data?.error?.message || error.message));
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy running on http://0.0.0.0:${PORT}`);
});
