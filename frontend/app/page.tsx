"use client"

import { useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = { role: "user" | "assistant"; content: string }
type Fields = Record<string, string | undefined>
type User = { id: number; email: string }
type SavedDoc = { id: number; title: string; document_type: string; updated_at: string; content: string }

// ---------------------------------------------------------------------------
// Mutual NDA HTML renderer (kept for best NDA preview experience)
// ---------------------------------------------------------------------------

function val(s: string | undefined, placeholder: string) {
  return s?.trim()
    ? s.trim()
    : `<span style="color:#b45309;background:#fef3c7;padding:0 3px;border-radius:2px;font-style:italic">${placeholder}</span>`
}

function ndaHtml(f: Fields): string {
  const mndaTerm = f.mndaTerm
    ? f.mndaTerm
    : val(undefined, "MNDA Term")

  const confTerm = f.termOfConfidentiality
    ? f.termOfConfidentiality
    : val(undefined, "Term of Confidentiality")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mutual NDA</title>
<style>
  body{font-family:Georgia,serif;font-size:14px;line-height:1.7;max-width:780px;margin:48px auto;padding:0 48px;color:#1a1a1a}
  h1{font-size:22px;text-align:center;margin-bottom:4px}
  .subtitle{text-align:center;font-size:12px;color:#666;margin-bottom:32px}
  h2{font-size:13px;font-family:Arial,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#444;border-bottom:2px solid #1a1a1a;padding-bottom:6px;margin-top:36px;margin-bottom:20px}
  h3{font-size:14px;font-weight:700;margin-top:20px;margin-bottom:2px}
  .hint{font-size:12px;color:#777;font-style:italic;margin-bottom:6px;display:block}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th{background:#f7f7f7;font-family:Arial,sans-serif;font-size:12px;font-weight:600;padding:10px 12px;text-align:left;border:1px solid #d0d0d0}
  td{padding:10px 12px;border:1px solid #d0d0d0;vertical-align:top;font-size:13px}
  td:first-child{font-family:Arial,sans-serif;font-weight:600;font-size:12px;width:130px;background:#fafafa}
  ol{padding-left:20px;margin-top:8px}
  li{margin-bottom:14px;text-align:justify}
  .footer{margin-top:40px;font-size:11px;color:#888;border-top:1px solid #ddd;padding-top:10px}
</style>
</head>
<body>
<h1>Mutual Non-Disclosure Agreement</h1>
<p class="subtitle">Cover Page &mdash; Common Paper Mutual NDA Standard Terms Version 1.0</p>
<h2>Cover Page</h2>
<h3>Purpose</h3><span class="hint">How Confidential Information may be used</span>
<p>${val(f.purpose, "Purpose")}</p>
<h3>Effective Date</h3><p>${val(f.effectiveDate, "Effective Date")}</p>
<h3>MNDA Term</h3><span class="hint">The length of this MNDA</span><p>${mndaTerm}</p>
<h3>Term of Confidentiality</h3><span class="hint">How long Confidential Information is protected</span><p>${confTerm}</p>
<h3>Governing Law &amp; Jurisdiction</h3>
<p>Governing Law: ${val(f.governingLaw, "State")}</p>
<p>Jurisdiction: ${val(f.jurisdiction, "City/County and State")}</p>
<p style="margin-top:20px;font-size:14px;color:#333">By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.</p>
<table>
  <tr><th></th><th>Party 1</th><th>Party 2</th></tr>
  <tr><td>Signature</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>Print Name</td><td>${val(f.party1Name, "Name")}</td><td>${val(f.party2Name, "Name")}</td></tr>
  <tr><td>Title</td><td>${val(f.party1Title, "Title")}</td><td>${val(f.party2Title, "Title")}</td></tr>
  <tr><td>Company</td><td>${val(f.party1Company, "Company")}</td><td>${val(f.party2Company, "Company")}</td></tr>
  <tr><td>Notice Address</td><td>${val(f.party1Address, "Address")}</td><td>${val(f.party2Address, "Address")}</td></tr>
</table>
<h2>Standard Terms</h2>
<ol>
  <li><strong>Introduction.</strong> This MNDA allows each party to disclose Confidential Information in connection with the Purpose.</li>
  <li><strong>Use and Protection.</strong> The Receiving Party shall use Confidential Information solely for the Purpose and protect it with at least a reasonable standard of care.</li>
  <li><strong>Exceptions.</strong> Obligations do not apply to information that is publicly available, was rightfully known prior to disclosure, or was independently developed.</li>
  <li><strong>Term and Termination.</strong> This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Either party may terminate upon written notice.</li>
  <li><strong>Governing Law.</strong> Governed by the laws of ${val(f.governingLaw, "Governing Law")}. Disputes in ${val(f.jurisdiction, "Jurisdiction")}.</li>
</ol>
<div class="footer">Common Paper Mutual Non-Disclosure Agreement Version 1.0 &mdash; free to use under CC BY 4.0.</div>
</body></html>`
}

function downloadHtml(docType: string, fields: Fields, previewHtml: string) {
  const html = docType === "Mutual NDA" ? ndaHtml(fields) : previewHtml
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${docType.toLowerCase().replace(/\s+/g, "-")}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Auth form (shown when user is not logged in)
// ---------------------------------------------------------------------------

function AuthForm({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || "Something went wrong. Please try again.")
      } else {
        onAuth(data)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "12px", padding: "48px", width: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ color: "#032147", fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>PreLegal</h1>
          <p style={{ color: "#888", fontSize: "13px" }}>Legal Document Creator — Common Paper Standard Terms</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "28px" }}>
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError("") }}
              style={{
                flex: 1, padding: "10px", fontSize: "14px", fontWeight: 600,
                border: "none", background: "none", cursor: "pointer",
                color: mode === m ? "#032147" : "#888",
                borderBottom: mode === m ? "2px solid #209dd7" : "2px solid transparent",
                marginBottom: "-2px",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#032147", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d7de", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#032147", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d7de", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {error && (
            <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px", padding: "10px 12px", background: "#fef2f2", borderRadius: "6px" }}>
              {error}
            </p>
          )}
          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "12px", background: "#753991", color: "#fff",
              border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Saved documents modal
// ---------------------------------------------------------------------------

function SavedDocsModal({
  docs,
  onClose,
  onView,
}: {
  docs: SavedDoc[]
  onClose: () => void
  onView: (html: string) => void
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "12px", padding: "32px", width: "580px", maxHeight: "72vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ color: "#032147", fontSize: "18px", fontWeight: 700, margin: 0 }}>My Documents</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "22px", lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>

        {docs.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", padding: "40px 0", fontSize: "14px" }}>
            No saved documents yet. Complete a document to save it automatically.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {docs.map((doc) => (
              <div
                key={doc.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", gap: "12px" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: "#032147", fontSize: "14px", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {doc.title}
                  </p>
                  <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>
                    {doc.document_type} &middot; {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => { onView(doc.content); onClose() }}
                  style={{ padding: "6px 16px", background: "#209dd7", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Home() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [fields, setFields] = useState<Fields>({})
  const [documentType, setDocumentType] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Document saving
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  // My Documents modal
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>([])
  const [showDocs, setShowDocs] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check auth on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => { setUser(u); setAuthChecked(true) })
      .catch(() => setAuthChecked(true))
  }, [])

  // Fetch greeting when user is authenticated
  useEffect(() => {
    if (!user) return
    fetch("/api/chat/greeting")
      .then((r) => r.json())
      .then((d) => setMessages([{ role: "assistant", content: d.message }]))
      .catch(() =>
        setMessages([{ role: "assistant", content: "Hi! What legal document would you like to create?" }])
      )
  }, [user])

  // Update preview whenever fields or documentType change
  useEffect(() => {
    if (!documentType || documentType === "Mutual NDA") return
    fetch("/api/document/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentType, fields }),
    })
      .then((r) => r.json())
      .then((d) => setPreviewHtml(d.html ?? ""))
      .catch(() => {})
  }, [documentType, fields])

  // Auto-save when document is complete
  useEffect(() => {
    if (!isComplete || !user || !documentType || saveStatus !== "idle") return
    setSaveStatus("saving")
    const html = documentType === "Mutual NDA" ? ndaHtml(fields) : previewHtml
    fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: documentType,
        document_type: documentType,
        content: html,
        fields,
      }),
    })
      .then((r) => { setSaveStatus(r.ok ? "saved" : "idle") })
      .catch(() => setSaveStatus("idle"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Re-focus input after response
  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, documentType, fields }),
      })
      const data = await res.json()
      if (data.documentType) setDocumentType(data.documentType)
      if (data.fields) setFields(data.fields)
      setIsComplete(data.isComplete ?? false)
      setMessages([...newMessages, { role: "assistant", content: data.message }])
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function startNewDocument() {
    setFields({})
    setDocumentType(null)
    setPreviewHtml("")
    setInput("")
    setIsComplete(false)
    setSaveStatus("idle")
    setViewingDoc(null)
    fetch("/api/chat/greeting")
      .then((r) => r.json())
      .then((d) => setMessages([{ role: "assistant", content: d.message }]))
      .catch(() =>
        setMessages([{ role: "assistant", content: "Hi! What legal document would you like to create?" }])
      )
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    setUser(null)
    setMessages([])
    setFields({})
    setDocumentType(null)
    setPreviewHtml("")
    setIsComplete(false)
    setSaveStatus("idle")
    setViewingDoc(null)
  }

  async function openMyDocuments() {
    const res = await fetch("/api/documents")
    if (res.ok) setSavedDocs(await res.json())
    setShowDocs(true)
  }

  // Preview content: viewing a saved doc overrides live preview
  const previewSrcDoc =
    viewingDoc ??
    (documentType === "Mutual NDA"
      ? ndaHtml(fields)
      : previewHtml || `<html><body style="font-family:sans-serif;color:#888;padding:48px;text-align:center"><p>Start chatting to build your document</p></body></html>`)

  // ── Loading / auth check ──
  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#888", fontSize: "14px" }}>Loading…</div>
      </div>
    )
  }

  // ── Auth gate ──
  if (!user) {
    return <AuthForm onAuth={setUser} />
  }

  // ── Main app ──
  return (
    <div className="flex flex-col h-screen" style={{ background: "#f5f7fa" }}>
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: "#032147", borderColor: "#021736" }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold" style={{ color: "#ecad0a" }}>
              PreLegal
            </h1>
            <p className="text-xs" style={{ color: "#7a9abf" }}>
              {documentType ?? "Legal Document Creator"} — Common Paper Standard Terms
            </p>
          </div>
          {documentType && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#209dd7", color: "#fff" }}
            >
              {documentType}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          {saveStatus === "saving" && (
            <span className="text-xs" style={{ color: "#7a9abf" }}>Saving…</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs" style={{ color: "#4ade80" }}>Saved</span>
          )}

          {/* My Documents */}
          <button
            onClick={openMyDocuments}
            className="text-xs font-medium px-3 py-1.5 rounded-md"
            style={{ background: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
          >
            My Documents
          </button>

          {/* Download */}
          {isComplete && (
            <button
              onClick={() => downloadHtml(documentType ?? "", fields, previewHtml)}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-colors"
              style={{ background: "#753991", color: "#ffffff" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          )}

          {/* User info + sign out */}
          <div className="flex items-center gap-2 pl-3" style={{ borderLeft: "1px solid rgba(255,255,255,0.15)" }}>
            <span className="text-xs" style={{ color: "#7a9abf" }}>{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs font-medium px-3 py-1.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.08)", color: "#e2e8f0" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <aside className="w-[420px] flex-shrink-0 flex flex-col bg-white border-r" style={{ borderColor: "#e2e8f0" }}>
          {/* New Document button */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b" style={{ borderColor: "#e2e8f0" }}>
            <button
              onClick={startNewDocument}
              className="w-full text-sm font-medium py-2 rounded-lg"
              style={{ background: "#f1f5f9", color: "#032147", border: "1px solid #e2e8f0" }}
            >
              + New Document
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { background: "#209dd7", color: "#fff", borderBottomRightRadius: "4px" }
                      : { background: "#f1f5f9", color: "#1e293b", borderBottomLeftRadius: "4px" }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3" style={{ background: "#f1f5f9", borderBottomLeftRadius: "4px" }}>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full"
                        style={{ background: "#888", animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: "#e2e8f0" }}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "#209dd7", minHeight: "40px", maxHeight: "120px" }}
                rows={1}
                placeholder="Type a message… (Enter to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
                style={{ background: "#753991" }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "#888" }}>Shift+Enter for new line</p>
          </div>
        </aside>

        {/* Preview panel */}
        <main className="flex-1 overflow-y-auto p-8" style={{ background: "#f5f7fa" }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#888" }}>
                {viewingDoc ? "Saved Document" : "Live Preview"}
              </span>
              <div className="flex items-center gap-3">
                {viewingDoc && (
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="text-xs font-medium px-3 py-1 rounded-md"
                    style={{ background: "#e2e8f0", color: "#032147" }}
                  >
                    ← Back to Live Preview
                  </button>
                )}
                {!viewingDoc && (
                  <span className="text-xs" style={{ color: "#888" }}>
                    Fields highlighted in amber are unfilled
                  </span>
                )}
              </div>
            </div>
            <iframe
              srcDoc={previewSrcDoc}
              title="Document Preview"
              scrolling="no"
              className="w-full rounded-lg shadow-sm bg-white"
              style={{ height: "1800px", border: "1px solid #e2e8f0" }}
            />
          </div>
        </main>
      </div>

      {/* My Documents modal */}
      {showDocs && (
        <SavedDocsModal
          docs={savedDocs}
          onClose={() => setShowDocs(false)}
          onView={(html) => setViewingDoc(html)}
        />
      )}

      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0)}
          40%{transform:translateY(-6px)}
        }
      `}</style>
    </div>
  )
}
