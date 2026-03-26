"use client"

import { useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = { role: "user" | "assistant"; content: string }

type Fields = Record<string, string | undefined>

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
// Main component
// ---------------------------------------------------------------------------

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [fields, setFields] = useState<Fields>({})
  const [documentType, setDocumentType] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch greeting on mount
  useEffect(() => {
    fetch("/api/chat/greeting")
      .then((r) => r.json())
      .then((d) => setMessages([{ role: "assistant", content: d.message }]))
      .catch(() =>
        setMessages([{ role: "assistant", content: "Hi! What legal document would you like to create?" }])
      )
  }, [])

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

  // Preview content: NDA uses local renderer; others use backend HTML
  const previewSrcDoc =
    documentType === "Mutual NDA"
      ? ndaHtml(fields)
      : previewHtml || `<html><body style="font-family:sans-serif;color:#888;padding:48px;text-align:center"><p>Start chatting to build your document</p></body></html>`

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
            Download Document
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <aside className="w-[420px] flex-shrink-0 flex flex-col bg-white border-r" style={{ borderColor: "#e2e8f0" }}>
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
                Live Preview
              </span>
              <span className="text-xs" style={{ color: "#888" }}>
                Fields highlighted in amber are unfilled
              </span>
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

      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0)}
          40%{transform:translateY(-6px)}
        }
      `}</style>
    </div>
  )
}
