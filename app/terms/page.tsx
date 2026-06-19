import type { Metadata } from "next"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Terms of Service — Diligen",
  description:
    "Diligen's Terms of Service govern your use of our AI-powered due diligence platform. Please read these terms carefully before using our services.",
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const GRID_BG = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M56 0H0v56' stroke='%231ABEBD' stroke-width='0.35' fill='none' opacity='0.05'/%3E%3C/svg%3E")`,
} as const

function GridTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={GRID_BG}
    />
  )
}

function TealRule() {
  return (
    <div
      className="h-px w-14"
      style={{ background: "linear-gradient(90deg, #1ABEBD, transparent)" }}
    />
  )
}

function Eyebrow({ label }: { label: string }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ color: "rgba(26,190,189,0.60)" }}
    >
      {label}
    </p>
  )
}

// ─── TOC data ─────────────────────────────────────────────────────────────────

const TOC_SECTIONS = [
  { id: "acceptance-of-terms", label: "Acceptance of Terms" },
  { id: "description-of-service", label: "Description of Service" },
  { id: "account-registration-and-security", label: "Account Registration and Security" },
  { id: "subscription-terms", label: "Subscription Terms" },
  { id: "billing-and-payment", label: "Billing and Payment" },
  { id: "acceptable-use-policy", label: "Acceptable Use Policy" },
  { id: "ai-output-disclaimer", label: "AI Output Disclaimer" },
  { id: "no-investment-advice", label: "No Investment Advice" },
  { id: "no-legal-or-accounting-advice", label: "No Legal or Accounting Advice" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "limitation-of-liability", label: "Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "termination-and-account-suspension", label: "Termination and Account Suspension" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
]

// ─── Hero ─────────────────────────────────────────────────────────────────────

function TermsHero() {
  return (
    <section
      className="relative overflow-hidden pb-20 pt-40"
      style={{ background: "#06101C" }}
    >
      <GridTexture />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-[600px] -translate-x-1/2 -translate-y-1/4"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(26,190,189,0.10), transparent 72%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6">
        <Eyebrow label="Legal" />
        <h1
          className="mt-5 text-[40px] font-bold leading-[1.07] tracking-[-0.03em] sm:text-[54px]"
          style={{ color: "#EBF2FF" }}
        >
          Terms of Service
        </h1>
        <div className="mt-5 flex items-center gap-4">
          <TealRule />
          <span
            className="text-sm"
            style={{ color: "rgba(235,242,255,0.38)" }}
          >
            Last updated: June 2026
          </span>
        </div>
        <p
          className="mt-6 max-w-2xl text-base leading-relaxed"
          style={{ color: "rgba(235,242,255,0.52)" }}
        >
          These Terms of Service ("Terms") govern your access to and use of the Diligen
          platform and services provided by Diligen, Inc. ("Diligen," "we," "us," or
          "our"). Please read these Terms carefully before using the platform. By accessing
          or using Diligen, you agree to be bound by these Terms.
        </p>
      </div>
    </section>
  )
}

// ─── Section heading component ────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-5 border-l-2 pl-4 text-[22px] font-bold leading-snug tracking-[-0.01em]"
      style={{
        color: "#EBF2FF",
        borderColor: "#1ABEBD",
      }}
    >
      {children}
    </h2>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="space-y-4 text-[15px] leading-[1.75]"
      style={{ color: "rgba(235,242,255,0.62)" }}
    >
      {children}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function TermsContent() {
  return (
    <section
      className="relative border-b border-white/5 py-20"
      style={{ background: "#06101C" }}
    >
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-16 lg:flex-row lg:gap-20">

          {/* Sticky sidebar TOC */}
          <aside className="shrink-0 lg:w-60 xl:w-72">
            <div className="lg:sticky lg:top-24">
              <p
                className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(26,190,189,0.60)" }}
              >
                Contents
              </p>
              <nav>
                <ol className="space-y-1">
                  {TOC_SECTIONS.map((section, i) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="flex items-start gap-3 rounded py-1.5 text-[13px] leading-snug transition-colors hover:text-white"
                        style={{ color: "rgba(235,242,255,0.42)" }}
                      >
                        <span
                          className="mt-[1px] shrink-0 text-[11px] tabular-nums"
                          style={{ color: "rgba(26,190,189,0.50)" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          {/* Main prose content */}
          <main className="min-w-0 flex-1 space-y-16">

            {/* 1. Acceptance of Terms */}
            <div id="acceptance-of-terms">
              <SectionHeading>1. Acceptance of Terms</SectionHeading>
              <Prose>
                <p>
                  By creating an account, accessing, or using the Diligen platform in any
                  manner, you ("User," "you," or "your") acknowledge that you have read,
                  understood, and agree to be bound by these Terms of Service and our Privacy
                  Policy, which is incorporated into these Terms by reference. If you are using
                  Diligen on behalf of an organization, you represent and warrant that you have
                  the authority to bind that organization to these Terms, and all references to
                  "you" shall include both you individually and that organization.
                </p>
                <p>
                  If you do not agree to these Terms, you may not access or use the Diligen
                  platform. We reserve the right to modify these Terms at any time. When we make
                  material changes, we will provide notice as described in our Privacy Policy.
                  Your continued use of the platform after the effective date of any changes
                  constitutes your acceptance of the revised Terms.
                </p>
                <p>
                  Diligen accounts are provisioned manually following a live demonstration
                  session. By participating in that session and accepting a provisioned account,
                  you also agree to these Terms in their entirety.
                </p>
              </Prose>
            </div>

            {/* 2. Description of Service */}
            <div id="description-of-service">
              <SectionHeading>2. Description of Service</SectionHeading>
              <Prose>
                <p>
                  Diligen provides an AI-powered due diligence platform designed for use by
                  financial professionals engaged in private market investment activity. The
                  platform enables users to upload deal-related documents — including
                  confidential information memoranda, financial statements, management
                  presentations, and supporting schedules — and receive structured analytical
                  outputs generated through a combination of document parsing, structured data
                  extraction, financial calculation, and AI-assisted analysis.
                </p>
                <p>
                  The Diligen platform includes features such as document ingestion and
                  parsing, financial metric extraction and normalization, risk signal
                  identification, deal workspace management, and the generation of structured
                  analytical summaries. The specific features available to a given user depend
                  on their subscription plan and any customizations agreed upon during
                  onboarding.
                </p>
                <p>
                  Diligen reserves the right to modify, suspend, or discontinue any aspect of
                  the platform at any time, with or without notice. We will make reasonable
                  efforts to provide advance notice of material changes to platform
                  functionality. We are not liable to you or any third party for any
                  modification, suspension, or discontinuation of services.
                </p>
              </Prose>
            </div>

            {/* 3. Account Registration and Security */}
            <div id="account-registration-and-security">
              <SectionHeading>3. Account Registration and Security</SectionHeading>
              <Prose>
                <p>
                  Access to Diligen requires a registered account. Account registration is
                  completed by Diligen on your behalf following a completed demo session and
                  your agreement to these Terms. You are responsible for ensuring that the
                  account information we hold for you — including your name, firm name, and
                  email address — remains accurate and current. You may update this information
                  at any time through your account settings or by contacting us.
                </p>
                <p>
                  You are solely responsible for maintaining the confidentiality of your
                  account credentials and for all activity that occurs under your account.
                  You agree to use a strong, unique password and to enable any multi-factor
                  authentication options we make available. You must notify us immediately at
                  privacy@diligen.co if you become aware of any unauthorized use of your account
                  or any other security breach.
                </p>
                <p>
                  Accounts are issued to named individuals and are non-transferable. You may
                  not share your login credentials with colleagues, contractors, or any other
                  individuals. Organizations requiring access for multiple team members should
                  contact us to discuss team account arrangements. Unauthorized sharing of
                  account access may result in immediate account suspension.
                </p>
              </Prose>
            </div>

            {/* 4. Subscription Terms */}
            <div id="subscription-terms">
              <SectionHeading>4. Subscription Terms</SectionHeading>
              <Prose>
                <p>
                  Diligen is offered on a subscription basis. Subscriptions are available on
                  monthly and annual billing cycles. The specific plan, pricing, and features
                  applicable to your subscription are set out in the order form or proposal
                  agreed upon during your onboarding process. In the event of any conflict
                  between these Terms and a separately executed order form, the order form
                  shall control with respect to the specific terms stated therein.
                </p>
                <p>
                  Monthly subscriptions renew automatically on the same calendar date each
                  month unless cancelled at least 5 business days before the next renewal date.
                  Annual subscriptions renew automatically on the anniversary of the
                  subscription start date unless cancelled at least 30 days before the renewal
                  date. We will send a renewal reminder to the email address associated with
                  your account prior to each annual renewal.
                </p>
                <p>
                  You may cancel your subscription at any time through your account settings or
                  by contacting us at legal@diligen.co. Cancellation takes effect at the end
                  of the current billing period. You will retain access to the platform until
                  the end of the period for which you have paid, and no prorated refunds will
                  be issued for mid-period cancellations unless otherwise required by applicable
                  law or agreed in writing.
                </p>
                <p>
                  We reserve the right to modify subscription pricing with 60 days' advance
                  written notice. If you do not agree to a price change, you may cancel your
                  subscription before the new pricing takes effect. Continued use of the
                  platform after a price change takes effect constitutes acceptance of the
                  new pricing.
                </p>
              </Prose>
            </div>

            {/* 5. Billing and Payment */}
            <div id="billing-and-payment">
              <SectionHeading>5. Billing and Payment</SectionHeading>
              <Prose>
                <p>
                  Subscription fees are billed in advance of each billing period. Payment is
                  processed through our third-party payment processor using the payment method
                  you provide during account setup. By providing a payment method, you
                  authorize Diligen to charge that method for all subscription fees due under
                  your plan, including automatic renewal charges.
                </p>
                <p>
                  All fees are stated and charged in US dollars. You are responsible for any
                  applicable taxes, bank fees, or currency conversion charges associated with
                  your payment. If your payment method fails, we will attempt to charge it
                  again within 3 business days. If payment cannot be collected after two
                  attempts, we reserve the right to suspend your account until payment is
                  received. We will notify you via email if your payment fails.
                </p>
                <p>
                  Diligen does not issue refunds for subscription fees that have already been
                  charged, except where required by applicable consumer protection law or
                  expressly agreed in writing. If you believe you have been charged in error,
                  please contact us at legal@diligen.co within 30 days of the charge and we
                  will investigate and respond within 10 business days.
                </p>
              </Prose>
            </div>

            {/* 6. Acceptable Use Policy */}
            <div id="acceptable-use-policy">
              <SectionHeading>6. Acceptable Use Policy</SectionHeading>
              <Prose>
                <p>
                  Diligen is a professional tool intended exclusively for use in connection
                  with legitimate private market investment activity, mergers and acquisitions
                  due diligence, and related financial analysis. You agree to use the platform
                  only for lawful purposes and in accordance with these Terms.
                </p>
                <p>
                  You may not use the Diligen platform to: upload documents that you do not
                  have the legal right to share; attempt to circumvent the platform's access
                  controls or security measures; probe, scan, or test the vulnerability of any
                  Diligen system or network; introduce malicious code, viruses, or harmful data
                  into the platform; reverse engineer, decompile, or disassemble any part of
                  the platform; or use the platform in any manner that could damage, disable,
                  or impair our infrastructure or interfere with any other user's experience.
                </p>
                <p>
                  You may not use Diligen to process documents in connection with transactions
                  that are illegal under applicable law, to facilitate fraud, to launder money,
                  or to engage in market manipulation. You may not resell, sublicense, or
                  otherwise provide access to the platform to third parties without our prior
                  written consent.
                </p>
                <p>
                  We reserve the right to investigate suspected violations of this Acceptable
                  Use Policy and to suspend or terminate any account found to be in violation,
                  without prior notice. We may also refer violations to appropriate law
                  enforcement authorities.
                </p>
              </Prose>
            </div>

            {/* 7. AI Output Disclaimer */}
            <div id="ai-output-disclaimer">
              <SectionHeading>7. AI Output Disclaimer</SectionHeading>
              <Prose>
                <p>
                  The analytical outputs produced by Diligen — including but not limited to
                  extracted financial metrics, normalized figures, risk flags, comparison
                  analyses, and narrative summaries — are generated through a combination of
                  automated document parsing, structured extraction, financial calculation, and
                  AI-assisted reasoning. These outputs are provided for informational and
                  analytical assistance purposes only.
                </p>
                <p>
                  Diligen does not guarantee the accuracy, completeness, timeliness, or
                  fitness for any particular purpose of any AI-generated output. AI systems
                  can and do make errors, including errors in numerical extraction, financial
                  calculation, and analytical interpretation. Outputs may reflect errors present
                  in source documents, limitations in document parsing, or inherent limitations
                  of AI models used in generating the analysis.
                </p>
                <p>
                  All outputs produced by Diligen must be independently reviewed and verified
                  by a qualified professional before being relied upon for any investment
                  decision, underwriting determination, credit assessment, or other consequential
                  purpose. You assume all risk associated with your use of or reliance on any
                  output produced by the platform.
                </p>
                <p>
                  To the fullest extent permitted by applicable law, Diligen disclaims all
                  warranties — express or implied — with respect to the accuracy or reliability
                  of platform outputs, including any implied warranty of merchantability,
                  fitness for a particular purpose, or non-infringement.
                </p>
              </Prose>
            </div>

            {/* 8. No Investment Advice */}
            <div id="no-investment-advice">
              <SectionHeading>8. No Investment Advice</SectionHeading>
              <Prose>
                <p>
                  The Diligen platform is an analytical software tool. Nothing on the platform,
                  in any output it generates, or in any communication from Diligen or its
                  employees constitutes investment advice, a recommendation to buy or sell any
                  security or asset, an offer to enter into any transaction, or a solicitation
                  of any investment.
                </p>
                <p>
                  Diligen, Inc. is not a registered investment advisor, broker-dealer,
                  investment company, or financial planner under any applicable law. We do not
                  hold, and do not represent that we hold, any license or registration that
                  would permit us to provide investment advice to any person or entity.
                </p>
                <p>
                  Investment decisions involve significant risk, including the possible loss of
                  principal. All investment decisions should be made based on your own
                  independent assessment and, where appropriate, in consultation with qualified
                  financial advisors who are familiar with your specific circumstances and
                  investment objectives. The existence of an analytical output from Diligen
                  does not reduce, modify, or transfer any responsibility that you bear for the
                  investment decisions you make.
                </p>
              </Prose>
            </div>

            {/* 9. No Legal or Accounting Advice */}
            <div id="no-legal-or-accounting-advice">
              <SectionHeading>9. No Legal or Accounting Advice</SectionHeading>
              <Prose>
                <p>
                  Nothing on the Diligen platform, in any output it generates, or in any
                  communication from Diligen or its employees constitutes legal advice,
                  accounting advice, tax advice, or any other form of professional advice
                  regulated by applicable law. Diligen is not a law firm, accounting firm,
                  or tax advisory firm, and no attorney-client, accountant-client, or similar
                  professional relationship is created by your use of the platform.
                </p>
                <p>
                  Any outputs that touch upon legal, accounting, or tax matters — such as
                  summaries of contractual provisions, normalized accounting adjustments, or
                  observations about financial statement presentation — are provided purely as
                  analytical observations to assist your own review. They do not constitute
                  professional opinions and should not be treated as such. You should consult
                  qualified legal and accounting professionals for advice on any matter that
                  requires professional judgment or is subject to professional regulation.
                </p>
              </Prose>
            </div>

            {/* 10. Intellectual Property */}
            <div id="intellectual-property">
              <SectionHeading>10. Intellectual Property</SectionHeading>
              <Prose>
                <p>
                  The Diligen platform — including its software, algorithms, user interface,
                  design, branding, analytical models, documentation, and all other
                  technology and content developed by Diligen — is the exclusive intellectual
                  property of Diligen, Inc. and is protected by applicable copyright, trademark,
                  patent, trade secret, and other intellectual property laws. Nothing in these
                  Terms grants you any ownership interest in or license to Diligen's
                  intellectual property beyond the limited right to use the platform as
                  expressly set forth herein.
                </p>
                <p>
                  You retain all ownership rights in and to the documents you upload to the
                  Diligen platform. By uploading a document, you grant Diligen a limited,
                  non-exclusive, royalty-free license to access, process, and analyze that
                  document solely for the purpose of providing the services you have requested.
                  This license does not extend to any other use, including the use of your
                  documents to train AI models or to derive competitive intelligence about
                  your firm or its deal activity.
                </p>
                <p>
                  The analytical outputs generated by Diligen based on your uploaded documents
                  are provided to you for your use. You may incorporate these outputs into your
                  own work product, subject to the AI Output Disclaimer in Section 7 above.
                  You may not represent AI-generated outputs as having been prepared entirely
                  by a human analyst in any context where such a representation would be
                  misleading or material to the intended audience.
                </p>
              </Prose>
            </div>

            {/* 11. Confidentiality */}
            <div id="confidentiality">
              <SectionHeading>11. Confidentiality</SectionHeading>
              <Prose>
                <p>
                  We understand that the documents uploaded to Diligen — deal documents,
                  financial data packages, management presentations, and similar materials —
                  are highly confidential. Diligen treats all uploaded documents as
                  confidential information belonging to you and will not disclose the contents
                  of those documents to any third party except as set out in our Privacy Policy
                  and these Terms.
                </p>
                <p>
                  Our employees and contractors with access to customer data are bound by
                  confidentiality obligations. Access to your deal documents within our
                  organization is restricted on a need-to-know basis and is limited to
                  personnel required to maintain, support, or improve the platform.
                </p>
                <p>
                  You represent and warrant that you have the right to share with Diligen all
                  documents and information that you upload to the platform. If you have
                  received documents under a non-disclosure agreement or other confidentiality
                  arrangement, it is your responsibility to ensure that sharing those documents
                  with Diligen is permitted under the terms of that arrangement. Diligen is not
                  responsible for any breach of confidentiality obligations owed to third
                  parties that may result from your decision to upload documents to the platform.
                </p>
              </Prose>
            </div>

            {/* 12. Limitation of Liability */}
            <div id="limitation-of-liability">
              <SectionHeading>12. Limitation of Liability</SectionHeading>
              <Prose>
                <p>
                  To the fullest extent permitted by applicable law, Diligen and its officers,
                  directors, employees, agents, and licensors shall not be liable for any
                  indirect, incidental, special, consequential, punitive, or exemplary damages
                  — including but not limited to loss of profits, loss of revenue, loss of data,
                  or loss of goodwill — arising out of or in connection with your use of or
                  inability to use the platform, even if Diligen has been advised of the
                  possibility of such damages.
                </p>
                <p>
                  In no event shall Diligen's total aggregate liability to you for all claims
                  arising out of or related to these Terms or your use of the platform exceed
                  the greater of (i) the total amount paid by you to Diligen in the twelve
                  months preceding the event giving rise to the claim, or (ii) one hundred US
                  dollars ($100.00).
                </p>
                <p>
                  The limitations set forth in this section shall apply regardless of the form
                  of the action, whether in contract, tort (including negligence), strict
                  liability, or otherwise, and shall apply even if any limited remedy fails of
                  its essential purpose. Some jurisdictions do not allow the exclusion or
                  limitation of certain types of damages, so these limitations may not apply
                  to you in full.
                </p>
              </Prose>
            </div>

            {/* 13. Indemnification */}
            <div id="indemnification">
              <SectionHeading>13. Indemnification</SectionHeading>
              <Prose>
                <p>
                  You agree to indemnify, defend, and hold harmless Diligen, Inc. and its
                  officers, directors, employees, agents, successors, and assigns from and
                  against any and all claims, damages, losses, liabilities, costs, and expenses
                  (including reasonable attorneys' fees) arising out of or related to: (i) your
                  use of the platform; (ii) your violation of these Terms; (iii) your violation
                  of any applicable law or regulation; (iv) any content or documents you
                  upload to the platform; or (v) any claim by a third party that your use of
                  the platform infringed their rights.
                </p>
                <p>
                  Diligen reserves the right to assume exclusive control of the defense of any
                  claim for which you are obligated to indemnify us, at your expense. You agree
                  to cooperate fully with Diligen in the defense of any such claim and not to
                  settle any such claim without Diligen's prior written consent. This
                  indemnification obligation will survive the termination of your account and
                  these Terms.
                </p>
              </Prose>
            </div>

            {/* 14. Termination and Account Suspension */}
            <div id="termination-and-account-suspension">
              <SectionHeading>14. Termination and Account Suspension</SectionHeading>
              <Prose>
                <p>
                  Either party may terminate these Terms at any time. You may terminate by
                  cancelling your subscription and deleting your account as described in
                  Section 4. Diligen may terminate your account and these Terms at any time
                  for any reason with 30 days' written notice, or immediately in the event of
                  a material breach of these Terms that is not cured within 10 days of written
                  notice of such breach.
                </p>
                <p>
                  We reserve the right to suspend your access to the platform immediately and
                  without prior notice if we reasonably believe that: your account has been
                  compromised; you are engaging in activity that violates our Acceptable Use
                  Policy; your continued use poses a security risk to other users or to our
                  infrastructure; or you have failed to pay subscription fees when due.
                </p>
                <p>
                  Upon termination of your account for any reason, your right to access and
                  use the platform ceases immediately. We will handle your data in accordance
                  with the retention practices described in our Privacy Policy. Sections of
                  these Terms that by their nature should survive termination — including
                  Sections 7, 8, 9, 10, 12, 13, and 15 — shall survive the termination of
                  your account.
                </p>
              </Prose>
            </div>

            {/* 15. Governing Law */}
            <div id="governing-law">
              <SectionHeading>15. Governing Law</SectionHeading>
              <Prose>
                <p>
                  These Terms and any dispute arising out of or related to them or your use of
                  the Diligen platform shall be governed by and construed in accordance with
                  the laws of the State of Delaware, United States of America, without regard
                  to its conflict of law principles.
                </p>
                <p>
                  Any legal action or proceeding arising under or relating to these Terms shall
                  be brought exclusively in the federal or state courts located in the State
                  of Delaware, and each party hereby irrevocably consents to the personal
                  jurisdiction and venue of those courts. The United Nations Convention on
                  Contracts for the International Sale of Goods does not apply to these Terms.
                </p>
                <p>
                  If any provision of these Terms is found to be invalid, illegal, or
                  unenforceable under applicable law, the remaining provisions shall continue
                  in full force and effect. The failure of Diligen to enforce any right or
                  provision of these Terms shall not constitute a waiver of that right or
                  provision. These Terms, together with our Privacy Policy and any applicable
                  order form, constitute the entire agreement between you and Diligen with
                  respect to the subject matter hereof.
                </p>
              </Prose>
            </div>

            {/* 16. Contact */}
            <div id="contact">
              <SectionHeading>16. Contact</SectionHeading>
              <Prose>
                <p>
                  If you have questions about these Terms of Service, wish to report a
                  violation, or need to contact our legal team for any reason, please reach
                  out to us at:
                </p>
                <div
                  className="rounded-lg p-5"
                  style={{
                    background: "rgba(26,190,189,0.04)",
                    border: "1px solid rgba(26,190,189,0.12)",
                  }}
                >
                  <p className="font-medium" style={{ color: "#EBF2FF" }}>
                    Diligen, Inc.
                  </p>
                  <p className="mt-1">
                    Legal Team:{" "}
                    <a
                      href="mailto:legal@diligen.co"
                      className="transition-colors hover:text-white"
                      style={{ color: "#1ABEBD" }}
                    >
                      legal@diligen.co
                    </a>
                  </p>
                </div>
                <p>
                  We aim to respond to all legal inquiries within 5 business days. For urgent
                  matters involving suspected security incidents or potential violations of
                  these Terms, please indicate the urgency in the subject line of your message.
                </p>
              </Prose>
            </div>

          </main>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#06101C" }}>
      <SiteNav />
      <main>
        <TermsHero />
        <TermsContent />
      </main>
      <SiteFooter />
    </div>
  )
}
