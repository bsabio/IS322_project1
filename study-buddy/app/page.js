"use client";

import { useState } from "react";

/* ─────────────────────── Modes ─────────────────────── */
const MODES = [
  { key: "concise", label: "⚡ Concise" },
  { key: "detailed", label: "📚 Detailed" },
  { key: "exam_prep", label: "🎯 Exam Prep" },
];

/* ─────────────────────── Main Page ─────────────────────── */
export default function Home() {
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("concise");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const tooShort = notes.trim().length < 20;

  /* ── Submit ───────────────────────────────────────────── */
  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  /* ── Copy All ─────────────────────────────────────────── */
  function handleCopy() {
    if (!result) return;

    const lines = [];
    lines.push("=== SUMMARY ===");
    lines.push(result.summary);
    lines.push("");

    lines.push("=== KEY POINTS ===");
    result.key_points.forEach((pt, i) => lines.push(`${i + 1}. ${pt}`));
    lines.push("");

    lines.push("=== QUIZ QUESTIONS ===");
    result.quiz_questions.forEach((qq, i) => {
      lines.push(`Q${i + 1}: ${qq.q}`);
      lines.push(`A${i + 1}: ${qq.a}`);
      lines.push("");
    });

    lines.push("=== FLASHCARDS ===");
    result.flashcards.forEach((fc, i) => {
      lines.push(`Card ${i + 1} — Front: ${fc.front}`);
      lines.push(`           Back:  ${fc.back}`);
    });

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div style={pageStyles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <header style={pageStyles.header}>
        <h1 style={pageStyles.title}>📖 Study Buddy</h1>
        <p style={pageStyles.subtitle}>
          Paste your notes, pick a mode, and let AI create summaries, key
          points, quizzes &amp; flashcards.
        </p>
      </header>

      <div style={pageStyles.columns}>
        {/* ─── Left Column ───────────────────────────────── */}
        <section style={pageStyles.left}>
          <label style={pageStyles.label}>Your Study Notes</label>
          <textarea
            style={pageStyles.textarea}
            rows={16}
            placeholder="Paste or type your study notes here (minimum 20 characters)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <small style={pageStyles.charCount}>
            {notes.trim().length} characters
            {tooShort && notes.length > 0 && (
              <span style={{ color: "#e74c3c" }}> — need at least 20</span>
            )}
          </small>

          {/* Mode selector */}
          <label style={{ ...pageStyles.label, marginTop: 16 }}>Study Mode</label>
          <div style={pageStyles.modeRow}>
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  ...pageStyles.modeBtn,
                  ...(mode === m.key ? pageStyles.modeBtnActive : {}),
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={tooShort || loading}
            style={{
              ...pageStyles.generateBtn,
              opacity: tooShort || loading ? 0.5 : 1,
              cursor: tooShort || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "⏳ Generating…" : "🚀 Generate Study Materials"}
          </button>
        </section>

        {/* ─── Right Column ──────────────────────────────── */}
        <section style={pageStyles.right}>
          {/* Loading state */}
          {loading && (
            <div style={pageStyles.statusCard}>
              <div style={pageStyles.spinner} />
              <p style={{ marginTop: 12 }}>
                Thinking… this may take a moment on a local model.
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{ ...pageStyles.card, borderLeft: "4px solid #e74c3c" }}>
              <h3 style={{ color: "#e74c3c", marginTop: 0 }}>Error</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              <div style={pageStyles.copyRow}>
                <button onClick={handleCopy} style={pageStyles.copyBtn}>
                  {copied ? "✅ Copied!" : "📋 Copy All"}
                </button>
              </div>

              {/* Summary */}
              <div style={pageStyles.card}>
                <h3 style={pageStyles.cardTitle}>📝 Summary</h3>
                <p style={pageStyles.cardText}>{result.summary}</p>
              </div>

              {/* Key Points */}
              <div style={pageStyles.card}>
                <h3 style={pageStyles.cardTitle}>🔑 Key Points</h3>
                <ul style={pageStyles.list}>
                  {result.key_points.map((pt, i) => (
                    <li key={i} style={pageStyles.listItem}>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quiz Questions */}
              <div style={pageStyles.card}>
                <h3 style={pageStyles.cardTitle}>❓ Quiz Questions</h3>
                {result.quiz_questions.map((qq, i) => (
                  <details key={i} style={pageStyles.details}>
                    <summary style={pageStyles.question}>
                      Q{i + 1}: {qq.q}
                    </summary>
                    <p style={pageStyles.answer}>
                      <strong>A:</strong> {qq.a}
                    </p>
                  </details>
                ))}
              </div>

              {/* Flashcards */}
              <div style={pageStyles.card}>
                <h3 style={pageStyles.cardTitle}>🃏 Flashcards</h3>
                <div style={pageStyles.flashcardGrid}>
                  {result.flashcards.map((fc, i) => (
                    <FlashCard key={i} front={fc.front} back={fc.back} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && !error && !result && (
            <div style={pageStyles.statusCard}>
              <p style={{ fontSize: 48, margin: 0 }}>🎓</p>
              <p style={{ color: "#888" }}>
                Your study materials will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────── Flashcard Component ─────────────────────── */
function FlashCard({ front, back }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        ...pageStyles.flashcard,
        background: flipped ? "#e8f5e9" : "#fff",
        cursor: "pointer",
      }}
    >
      <small style={{ color: "#999", fontSize: 11 }}>
        {flipped ? "BACK — click to flip" : "FRONT — click to flip"}
      </small>
      <p style={{ margin: "8px 0 0", fontWeight: flipped ? 400 : 600 }}>
        {flipped ? back : front}
      </p>
    </div>
  );
}

/* ─────────────────────── Styles ─────────────────────── */
const pageStyles = {
  page: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 16px",
    color: "#1a1a1a",
    minHeight: "100vh",
    background: "#f8f9fa",
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    margin: 0,
  },
  subtitle: {
    color: "#555",
    fontSize: 16,
    marginTop: 8,
  },
  columns: {
    display: "flex",
    gap: 32,
    alignItems: "flex-start",
  },
  left: {
    flex: "0 0 380px",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 24,
  },
  right: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 6,
    display: "block",
  },
  textarea: {
    width: "100%",
    padding: 12,
    fontSize: 14,
    border: "2px solid #ddd",
    borderRadius: 8,
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.5,
    boxSizing: "border-box",
    outline: "none",
  },
  charCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  modeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    padding: "10px 8px",
    fontSize: 13,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#ddd",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  modeBtnActive: {
    borderColor: "#2563eb",
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: 600,
  },
  generateBtn: {
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
    background: "#2563eb",
    border: "none",
    borderRadius: 10,
    transition: "opacity 0.15s",
  },
  statusCard: {
    textAlign: "center",
    padding: 48,
    background: "#fff",
    borderRadius: 12,
    border: "2px dashed #ddd",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    margin: "0 0 12px",
    fontSize: 18,
  },
  cardText: {
    margin: 0,
    lineHeight: 1.6,
  },
  list: {
    margin: 0,
    paddingLeft: 20,
  },
  listItem: {
    marginBottom: 6,
    lineHeight: 1.5,
  },
  details: {
    marginBottom: 10,
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: 10,
  },
  question: {
    cursor: "pointer",
    fontWeight: 500,
    lineHeight: 1.5,
  },
  answer: {
    margin: "8px 0 0 16px",
    color: "#2d6a4f",
    lineHeight: 1.5,
  },
  copyRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  copyBtn: {
    padding: "8px 16px",
    fontSize: 14,
    border: "2px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  },
  flashcardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  },
  flashcard: {
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    transition: "background 0.2s",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
};
