"use client"

import { useState } from "react"

type FormData = {
  purpose: string
  effectiveDate: string
  mndaTermType: "expires" | "continuous"
  mndaTermYears: string
  confidentialityType: "years" | "perpetuity"
  confidentialityYears: string
  governingLaw: string
  jurisdiction: string
  modifications: string
  party1Name: string
  party1Title: string
  party1Company: string
  party1Address: string
  party1Date: string
  party2Name: string
  party2Title: string
  party2Company: string
  party2Address: string
  party2Date: string
}

const defaults: FormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTermType: "expires",
  mndaTermYears: "1",
  confidentialityType: "years",
  confidentialityYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1Name: "",
  party1Title: "",
  party1Company: "",
  party1Address: "",
  party1Date: "",
  party2Name: "",
  party2Title: "",
  party2Company: "",
  party2Address: "",
  party2Date: "",
}

function val(s: string, placeholder: string) {
  return s.trim() ? s.trim() : `<span style="color:#b45309;background:#fef3c7;padding:0 2px">${placeholder}</span>`
}

function ndaHtml(f: FormData): string {
  const mndaTerm =
    f.mndaTermType === "expires"
      ? `Expires ${val(f.mndaTermYears, "N")} year(s) from Effective Date.`
      : "Continues until terminated in accordance with the terms of the MNDA."

  const confTerm =
    f.confidentialityType === "years"
      ? `${val(f.confidentialityYears, "N")} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
      : "In perpetuity."

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mutual NDA</title>
<style>
  body { font-family: Georgia, serif; font-size: 14px; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 40px; color: #111; }
  h1 { font-size: 20px; text-align: center; margin-bottom: 8px; }
  h2 { font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 28px; }
  h3 { font-size: 14px; margin-top: 20px; margin-bottom: 4px; }
  label.hint { font-size: 12px; color: #666; font-style: italic; display: block; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; font-size: 12px; }
  ol { padding-left: 24px; }
  li { margin-bottom: 12px; }
  .footer { margin-top: 32px; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
  .section-label { font-size: 12px; color: #666; font-style: italic; }
</style>
</head>
<body>

<h1>Mutual Non-Disclosure Agreement</h1>
<p style="text-align:center;font-size:12px;color:#555">Cover Page + Common Paper Mutual NDA Standard Terms Version 1.0</p>

<h2>Cover Page</h2>

<h3>Purpose</h3>
<span class="section-label">How Confidential Information may be used</span>
<p>${val(f.purpose, "Purpose")}</p>

<h3>Effective Date</h3>
<p>${val(f.effectiveDate, "Effective Date")}</p>

<h3>MNDA Term</h3>
<span class="section-label">The length of this MNDA</span>
<p>${mndaTerm}</p>

<h3>Term of Confidentiality</h3>
<span class="section-label">How long Confidential Information is protected</span>
<p>${confTerm}</p>

<h3>Governing Law &amp; Jurisdiction</h3>
<p>Governing Law: ${val(f.governingLaw, "State")}</p>
<p>Jurisdiction: ${val(f.jurisdiction, "City/County and State")}</p>

<h3>MNDA Modifications</h3>
<p>${f.modifications.trim() ? f.modifications.trim() : "None"}</p>

<p>By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.</p>

<table>
  <tr>
    <th></th>
    <th>Party 1</th>
    <th>Party 2</th>
  </tr>
  <tr>
    <td><strong>Signature</strong></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td><strong>Print Name</strong></td>
    <td>${val(f.party1Name, "Name")}</td>
    <td>${val(f.party2Name, "Name")}</td>
  </tr>
  <tr>
    <td><strong>Title</strong></td>
    <td>${val(f.party1Title, "Title")}</td>
    <td>${val(f.party2Title, "Title")}</td>
  </tr>
  <tr>
    <td><strong>Company</strong></td>
    <td>${val(f.party1Company, "Company")}</td>
    <td>${val(f.party2Company, "Company")}</td>
  </tr>
  <tr>
    <td><strong>Notice Address</strong></td>
    <td>${val(f.party1Address, "Email or postal address")}</td>
    <td>${val(f.party2Address, "Email or postal address")}</td>
  </tr>
  <tr>
    <td><strong>Date</strong></td>
    <td>${val(f.party1Date, "Date")}</td>
    <td>${val(f.party2Date, "Date")}</td>
  </tr>
</table>

<h2>Standard Terms</h2>

<ol>
  <li><strong>Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("<strong>MNDA</strong>") allows each party ("<strong>Disclosing Party</strong>") to disclose or make available information in connection with the Purpose which (1) the Disclosing Party identifies to the receiving party ("<strong>Receiving Party</strong>") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("<strong>Confidential Information</strong>"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("<strong>Cover Page</strong>"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.</li>

  <li><strong>Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the Purpose, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.</li>

  <li><strong>Exceptions.</strong> The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.</li>

  <li><strong>Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.</li>

  <li><strong>Term and Termination.</strong> This MNDA commences on the Effective Date and expires at the end of the MNDA Term. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the Term of Confidentiality, despite any expiration or termination of this MNDA.</li>

  <li><strong>Return or Destruction of Confidential Information.</strong> Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.</li>

  <li><strong>Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.</li>

  <li><strong>Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</li>

  <li><strong>Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of ${val(f.governingLaw, "Governing Law")}, without regard to the conflict of laws provisions of such ${val(f.governingLaw, "Governing Law")}. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in ${val(f.jurisdiction, "Jurisdiction")}. Each party irrevocably submits to the exclusive jurisdiction of such ${val(f.jurisdiction, "Jurisdiction")} in any such suit, action, or proceeding.</li>

  <li><strong>Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.</li>

  <li><strong>General.</strong> Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.</li>
</ol>

<div class="footer">Common Paper Mutual Non-Disclosure Agreement Version 1.0 free to use under CC BY 4.0.</div>
</body>
</html>`
}

function downloadHtml(f: FormData) {
  const html = ndaHtml(f)
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "mutual-nda.html"
  a.click()
  URL.revokeObjectURL(url)
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls =
  "w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"

export default function Home() {
  const [f, setF] = useState<FormData>(defaults)

  function set(k: keyof FormData, v: string) {
    setF((prev) => ({ ...prev, [k]: v }))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Form panel */}
      <aside className="w-96 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-6">
        <h1 className="text-lg font-semibold mb-1">Mutual NDA Creator</h1>
        <p className="text-xs text-gray-500 mb-6">
          Common Paper Mutual NDA Standard Terms Version 1.0
        </p>

        <Field label="Purpose" hint="How Confidential Information may be used">
          <textarea
            className={`${inputCls} h-20 resize-none`}
            value={f.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          />
        </Field>

        <Field label="Effective Date">
          <input
            type="date"
            className={inputCls}
            value={f.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </Field>

        <Field label="MNDA Term" hint="The length of this MNDA">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mndaTermType"
                checked={f.mndaTermType === "expires"}
                onChange={() => set("mndaTermType", "expires")}
              />
              Expires after
              <input
                type="number"
                min="1"
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                value={f.mndaTermYears}
                onChange={(e) => set("mndaTermYears", e.target.value)}
                disabled={f.mndaTermType !== "expires"}
              />
              year(s)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mndaTermType"
                checked={f.mndaTermType === "continuous"}
                onChange={() => set("mndaTermType", "continuous")}
              />
              Continues until terminated
            </label>
          </div>
        </Field>

        <Field label="Term of Confidentiality" hint="How long Confidential Information is protected">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="confidentialityType"
                checked={f.confidentialityType === "years"}
                onChange={() => set("confidentialityType", "years")}
              />
              <input
                type="number"
                min="1"
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                value={f.confidentialityYears}
                onChange={(e) => set("confidentialityYears", e.target.value)}
                disabled={f.confidentialityType !== "years"}
              />
              year(s) from Effective Date
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="confidentialityType"
                checked={f.confidentialityType === "perpetuity"}
                onChange={() => set("confidentialityType", "perpetuity")}
              />
              In perpetuity
            </label>
          </div>
        </Field>

        <Field label="Governing Law">
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Delaware"
            value={f.governingLaw}
            onChange={(e) => set("governingLaw", e.target.value)}
          />
        </Field>

        <Field label="Jurisdiction">
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. courts located in New Castle, DE"
            value={f.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
          />
        </Field>

        <Field label="MNDA Modifications">
          <textarea
            className={`${inputCls} h-20 resize-none`}
            placeholder="List any modifications, or leave blank for none"
            value={f.modifications}
            onChange={(e) => set("modifications", e.target.value)}
          />
        </Field>

        <hr className="my-4 border-gray-200" />
        <p className="text-sm font-medium text-gray-700 mb-4">Party 1</p>

        <Field label="Name">
          <input
            type="text"
            className={inputCls}
            value={f.party1Name}
            onChange={(e) => set("party1Name", e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            className={inputCls}
            value={f.party1Title}
            onChange={(e) => set("party1Title", e.target.value)}
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            className={inputCls}
            value={f.party1Company}
            onChange={(e) => set("party1Company", e.target.value)}
          />
        </Field>
        <Field label="Notice Address" hint="Email or postal address">
          <input
            type="text"
            className={inputCls}
            value={f.party1Address}
            onChange={(e) => set("party1Address", e.target.value)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className={inputCls}
            value={f.party1Date}
            onChange={(e) => set("party1Date", e.target.value)}
          />
        </Field>

        <hr className="my-4 border-gray-200" />
        <p className="text-sm font-medium text-gray-700 mb-4">Party 2</p>

        <Field label="Name">
          <input
            type="text"
            className={inputCls}
            value={f.party2Name}
            onChange={(e) => set("party2Name", e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            className={inputCls}
            value={f.party2Title}
            onChange={(e) => set("party2Title", e.target.value)}
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            className={inputCls}
            value={f.party2Company}
            onChange={(e) => set("party2Company", e.target.value)}
          />
        </Field>
        <Field label="Notice Address" hint="Email or postal address">
          <input
            type="text"
            className={inputCls}
            value={f.party2Address}
            onChange={(e) => set("party2Address", e.target.value)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className={inputCls}
            value={f.party2Date}
            onChange={(e) => set("party2Date", e.target.value)}
          />
        </Field>

        <button
          onClick={() => downloadHtml(f)}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Download NDA
        </button>
      </aside>

      {/* Preview panel */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-600">Live Preview</h2>
          </div>
          <div
            className="bg-white shadow rounded p-8"
            dangerouslySetInnerHTML={{ __html: ndaHtml(f) }}
          />
        </div>
      </main>
    </div>
  )
}
