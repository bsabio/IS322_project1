// app/api/study/route.js
// Server-side API route that calls a local Ollama model

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

/**
 * Build the prompt that forces structured JSON output from the model.
 */
function buildPrompt(notes, mode) {
  const modeInstructions = {
    concise:
      "Be extremely concise. Summaries ≤ 3 sentences. Key points ≤ 5 bullet items. 3 quiz questions. 5 flashcards.",
    detailed:
      "Be thorough and detailed. Summaries can be a full paragraph. Key points ≤ 10 items with explanations. 5 quiz questions. 8 flashcards.",
    exam_prep:
      "Focus on likely exam material. Summaries should highlight testable concepts. Key points should be fact-dense. 7 quiz questions (mix of conceptual and applied). 10 flashcards.",
  };

  const instruction = modeInstructions[mode] || modeInstructions.concise;

  return `You are a study-assistant AI. A student has given you their study notes.
Your task: analyse the notes and return a JSON object with exactly this schema:

{
  "summary": "string – a plain-text summary of the notes",
  "key_points": ["string", "string"],
  "quiz_questions": [{"q": "question string", "a": "answer string"}],
  "flashcards": [{"front": "term or question", "back": "definition or answer"}]
}

RULES:
- Output valid JSON only. No markdown. No extra text. No code fences.
- Do not invent facts not present in the notes. If information is missing, use "Not in notes".
- ${instruction}

STUDENT NOTES:
"""
${notes}
"""

Respond with the JSON object only:`;
}

/**
 * Safely extract a JSON object from a string that may contain extra text.
 */
function extractJSON(raw) {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }
  const candidate = raw.substring(first, last + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

/**
 * Validate that the parsed object has the expected shape.
 */
function validateShape(obj) {
  if (typeof obj.summary !== "string") return false;
  if (!Array.isArray(obj.key_points)) return false;
  if (!Array.isArray(obj.quiz_questions)) return false;
  if (!Array.isArray(obj.flashcards)) return false;
  return true;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { notes, mode } = body;

    // --- Input validation ---------------------------------------------------
    if (!notes || typeof notes !== "string" || notes.trim().length < 20) {
      return Response.json(
        { error: "Notes must be at least 20 characters long." },
        { status: 400 }
      );
    }

    const safeMode = ["concise", "detailed", "exam_prep"].includes(mode)
      ? mode
      : "concise";

    // --- Call Ollama ---------------------------------------------------------
    const prompt = buildPrompt(notes.trim(), safeMode);

    let ollamaRes;
    try {
      ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: { temperature: 0.3 },
        }),
      });
    } catch (fetchErr) {
      return Response.json(
        {
          error: `Could not reach Ollama at ${OLLAMA_BASE_URL}. Is it running?`,
          details: fetchErr.message,
        },
        { status: 500 }
      );
    }

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      return Response.json(
        {
          error: `Ollama returned status ${ollamaRes.status}`,
          details: text,
        },
        { status: 500 }
      );
    }

    const ollamaData = await ollamaRes.json();
    const rawResponse = ollamaData.response || "";

    // --- Parse JSON from model output ----------------------------------------
    const parsed = extractJSON(rawResponse);

    if (!parsed) {
      return Response.json(
        {
          error:
            "The model did not return valid JSON. Try again or use shorter notes.",
          raw: rawResponse.substring(0, 2000),
        },
        { status: 500 }
      );
    }

    if (!validateShape(parsed)) {
      return Response.json(
        {
          error: "The model returned JSON but it was missing required fields.",
          raw: rawResponse.substring(0, 2000),
        },
        { status: 500 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json(
      { error: "Unexpected server error.", details: err.message },
      { status: 500 }
    );
  }
}
