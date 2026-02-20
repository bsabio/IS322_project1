# 📖 Study Buddy

An AI-powered study assistant that turns your notes into structured study materials using a **local Ollama model**. No cloud APIs — everything runs on your machine.

## Features

- Paste study notes and choose a mode: **Concise**, **Detailed**, or **Exam Prep**
- AI generates 4 sections: **Summary**, **Key Points**, **Quiz Questions**, **Flashcards**
- Interactive flashcards (click to flip)
- Collapsible quiz answers
- Copy All button for easy export
- Runs 100% locally via Ollama

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Ollama](https://ollama.com/) installed and running

## Quick Start

```bash
# 1. Pull the model (only needed once)
ollama pull llama3.1:8b

# 2. Make sure Ollama is running
ollama serve

# 3. Install dependencies
cd study-buddy
npm install

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file (already included) with:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

Change `OLLAMA_MODEL` to any model you have pulled (e.g. `deepseek-coder:1.3b`, `mistral`, etc.).

## Project Structure

```
study-buddy/
├── app/
│   ├── api/study/route.js   # Server route — calls Ollama
│   ├── globals.css           # Minimal global styles
│   ├── layout.js             # Root layout
│   └── page.js               # Main UI (client component)
├── .env.local                # Environment config
└── package.json
```

## Troubleshooting

| Problem | Fix |
|---|---|
| "Could not reach Ollama" | Run `ollama serve` in a separate terminal |
| "Model not found" | Run `ollama pull llama3.1:8b` first |
| Slow responses | Normal for local models — try a smaller model like `deepseek-coder:1.3b` |
| JSON parse errors | Try again — sometimes the model returns imperfect JSON |
