"use client"

import { useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NDAFields = {
  purpose?: string
  effectiveDate?: string
  mndaTermType?: "expires" | "continuous"
  mndaTermYears?: string
  confidentialityType?: "years" | "perpetuity"
  confidentialityYears?: string
  governingLaw?: string
  jurisdiction?: string
  modifications?: string
  party1Name?: string
  party1Title?: string
  party1Company?: string
  party1Address?: string
  party2Name?: string
  party2Title?: string
  party2Company?: string
  party2Address?: string
}

type Message = { role: "user" | "assistant"; content: string }

// ---------------------------------------------------------------------------
// NDA HTML generator
// ---------------------------------------------------------------------------

function val(s: string | undefined, placeholder: string) {
  return s?.trim()
    ? s.trim()
    : `<span style="color:#b45309;background:#fef3c7;padding:0 3px;border-radius:2px;font-style:italic">${placeholder}</span>`
}

function ndaHtml(f: NDAFields): string {
  const mndaTerm =
    f.mndaTermType === "expires"
      ? `Expires ${val(f.mndaTermYears, "N")} year(s) from Effective Date.`
      : f.mndaTermType === "continuous"
      ? "Continues until terminated in accordance with the terms of the MNDA."
      : val(undefined, "MNDA Term")

  const confTerm =
    f.confidentialityType === "years"
      ? `${val(f.confidentialityYears, "N")} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
      : f.confidentialityType === "perpetuity"
      ? "In perpetuity."
      : val(undefined, "Confidentiality Period")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mutual NDA</title>
<style>
  body { font-family: Georgia, serif; font-size: 14px; line-height: 1.7; max-width: 780px; margin: 48px auto; padding: 0 48px; color: #1a1a1a; }
  h1 { font-size: 22px; text-align: center; margin-bottom: 4px; letter-spacing: -0.3px; }
  .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 32px; }
  h2 { font-size: 13px; font-family: Arial, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #444; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-top: 36px; margin-bottom: 20px; }
  h3 { font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 2px; }
  .hint { font-size: 12px; color: #777; font-style: italic; margin-bottom: 6px; display: block; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #f7f7f7; font-family: Arial, sans-serif; font-size: 12px; font-weight: 600; padding: 10px 12px; text-align: left; border: 1px solid #d0d0d0; }
  td { padding: 10px 12px; border: 1px solid #d0d0d0; vertical-align: top; font-size: 13px; }
  td:first-child { font-family: Arial, sans-serif; font-weight: 600; font-size: 12px; width: 130px; background: #fafafa; }
  ol { padding-left: 20px; margin-top: 8px; }
  li { margin-bottom: 14px; text-align: justify; }
  .signing { margin-top: 20px; font-size: 14px; color: #333; }
  .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
</style>
</head>
<body>
<h1>Mutual Non-Disclosure Agreement</h1>
<p class="subtitle">Cover Page &mdash; Common Paper Mutual NDA Standard Terms Version 1.0</p>

<h2>Cover Page</h2>

<h3>Purpose</h3>
<span class="hint">How Confidential Information may be used</span>
<p>${val(f.purpose, "Purpose")}</p>

<h3>Effective Date</h3>
<p>${val(f.effectiveDate, "Effective Date")}</p>

<h3>MNDA Term</h3>
<span class="hint">The length of this MNDA</span>
<p>${mndaTerm}</p>

<h3>Term of Confidentiality</h3>
<span class="hint">How long Confidential Information is protected</span>
<p>${confTerm}</p>

<h3>Governing Law &amp; Jurisdiction</h3>
<p>Governing Law: ${val(f.governingLaw, "State")}</p>
<p>Jurisdiction: ${val(f.jurisdiction, "City/County and State")}</p>

<h3>MNDA Modifications</h3>
<p>${f.modifications?.trim() ? f.modifications.trim() : "None"}</p>

<p class="signing">By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.</p>

<table>
  <tr>
    <th></th>
    <th>Party 1</th>
    <th>Party 2</th>
  </tr>
  <tr><td>Signature</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>Print Name</td><td>${val(f.party1Name, "Name")}</td><td>${val(f.party2Name, "Name")}</td></tr>
  <tr><td>Title</td><td>${val(f.party1Title, "Title")}</td><td>${val(f.party2Title, "Title")}</td></tr>
  <tr><td>Company</td><td>${val(f.party1Company, "Company")}</td><td>${val(f.party2Company, "Company")}</td></tr>
  <tr><td>Notice Address</td><td>${val(f.party1Address, "Email or postal address")}</td><td>${val(f.party2Address, "Email or postal address")}</td></tr>
</table>

<h2>Standard Terms</h2>

<ol>
  <li><strong>Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("<strong>MNDA</strong>") allows each party ("<strong>Disclosing Party</strong>") to disclose or make available information in connection with the Purpose which (1) the Disclosing Party identifies to the receiving party ("<strong>Receiving Party</strong>") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("<strong>Confidential Information</strong>").</li>
  <li><strong>Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.</li>
  <li><strong>Exceptions.</strong> The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.</li>
  <li><strong>Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure.</li>
  <li><strong>Term and Termination.</strong> This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Either party may terminate this MNDA for any or no reason upon written notice to the other party.</li>
  <li><strong>Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of ${val(f.governingLaw, "Governing Law")}, without regard to the conflict of laws provisions of such ${val(f.governingLaw, "Governing Law")}. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in ${val(f.jurisdiction, "Jurisdiction")}.</li>
  <li><strong>General.</strong> Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter.</li>
</ol>

<div class="footer">Common Paper Mutual Non-Disclosure Agreement Version 1.0 &mdash; free to use under CC BY 4.0.</div>
</body>
</html>`
}

function downloadHtml(f: NDAFields) {
  const blob = new Blob([ndaHtml(f)], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "mutual-nda.html"
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [fields, setFields] = useState<NDAFields>({})
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch greeting on mount
  useEffect(() => {
    fetch("/api/chat/greeting")
      .then((r) => r.json())
      .then((data) => {
        setMessages([{ role: "assistant", content: data.message }])
      })
      .catch(() => {
        setMessages([{ role: "assistant", content: "Hi! I'm here to help you create a Mutual NDA. What's the purpose of this agreement?" }])
      })
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-focus input after response
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
        body: JSON.stringify({ messages: newMessages, fields }),
      })
      const data = await res.json()
      setFields(data.fields)
      setIsComplete(data.isComplete)
      setMessages([...newMessages, { role: "assistant", content: data.message }])
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again." }])
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

  return (
    <div className="flex flex-col h-screen" style={{ background: "#f5f7fa" }}>
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: "#032147", borderColor: "#021736" }}
      >
        <div>
          <h1 className="text-base font-semibold" style={{ color: "#ecad0a" }}>
            PreLegal
          </h1>
          <p className="text-xs" style={{ color: "#7a9abf" }}>
            Mutual NDA Creator — Common Paper Standard Terms Version 1.0
          </p>
        </div>
        {isComplete && (
          <button
            onClick={() => downloadHtml(fields)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-colors"
            style={{ background: "#753991", color: "#ffffff" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download NDA
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <aside className="w-[420px] flex-shrink-0 flex flex-col bg-white border-r" style={{ borderColor: "#e2e8f0" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { background: "#209dd7", color: "#ffffff", borderBottomRightRadius: "4px" }
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
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: "#888888",
                          animation: "bounce 1s infinite",
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: "#e2e8f0" }}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-all"
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
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
                style={{ background: "#753991" }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "#888888" }}>
              Shift+Enter for new line
            </p>
          </div>
        </aside>

        {/* Preview panel */}
        <main className="flex-1 overflow-y-auto p-8" style={{ background: "#f5f7fa" }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#888888" }}>
                Live Preview
              </span>
              <span className="text-xs" style={{ color: "#888888" }}>
                Fields highlighted in amber are unfilled
              </span>
            </div>
            <iframe
              srcDoc={ndaHtml(fields)}
              title="NDA Preview"
              scrolling="no"
              className="w-full rounded-lg shadow-sm bg-white"
              style={{ height: "1800px", border: "1px solid #e2e8f0" }}
            />
          </div>
        </main>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
