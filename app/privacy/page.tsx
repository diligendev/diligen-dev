import type { Metadata } from "next"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Privacy Policy — Diligen",
  description:
    "Diligen's privacy policy explains how we collect, use, and protect your personal information and the documents you upload to our platform.",
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
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-your-information", label: "How We Use Your Information" },
  { id: "ai-processing-disclosure", label: "AI Processing Disclosure" },
  { id: "document-storage-and-retention", label: "Document Storage and Retention" },
  { id: "cookies-and-analytics", label: "Cookies and Analytics" },
  { id: "third-party-services", label: "Third-Party Services" },
  { id: "data-security", label: "Data Security" },
  { id: "user-rights", label: "User Rights" },
  { id: "international-data-transfers", label: "International Data Transfers" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "changes-to-this-policy", label: "Changes to This Policy" },
  { id: "contact-information", label: "Contact Information" },
]

// ─── Hero ─────────────────────────────────────────────────────────────────────

function PrivacyHero() {
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
          Privacy Policy
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
          This Privacy Policy describes how Diligen, Inc. ("Diligen," "we," "us," or "our")
          collects, uses, and protects information about you when you use our platform and
          services. We take your privacy seriously, particularly given the sensitive nature
          of the financial documents our customers share with us.
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

function PrivacyContent() {
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

            {/* 1. Information We Collect */}
            <div id="information-we-collect">
              <SectionHeading>1. Information We Collect</SectionHeading>
              <Prose>
                <p>
                  We collect information you provide directly to us when you create an account,
                  use our platform, communicate with our team, or request support. This includes
                  account registration data such as your name, work email address, firm name,
                  role, and any other information you choose to provide during onboarding.
                </p>
                <p>
                  Our platform is designed for the analysis of financial documents. When you
                  upload files to Diligen — including confidential information memoranda (CIMs),
                  financial statements, Excel workbooks, management presentations, legal
                  agreements, and other deal-related materials — we collect and process those
                  documents in order to deliver our services. These documents may contain highly
                  sensitive financial, operational, and personal data about companies and
                  individuals. We treat all uploaded documents as strictly confidential.
                </p>
                <p>
                  We also collect usage data about how you interact with the platform: which
                  features you use, how often, the sequence of actions taken during a session,
                  error events, and performance metrics. This data is collected in aggregate and
                  at the individual session level for purposes described in this Policy.
                </p>
                <p>
                  Technical data is collected automatically when you access Diligen, including
                  your IP address, browser type and version, operating system, device
                  identifiers, referral URLs, and session timestamps. This data helps us maintain
                  platform security, diagnose technical issues, and understand how the platform
                  is being accessed.
                </p>
              </Prose>
            </div>

            {/* 2. How We Use Your Information */}
            <div id="how-we-use-your-information">
              <SectionHeading>2. How We Use Your Information</SectionHeading>
              <Prose>
                <p>
                  The primary purpose for which we use your information is to provide,
                  operate, and improve the Diligen platform. This means using your account data
                  to authenticate you, using your uploaded documents to perform the analytical
                  functions you have requested, and using usage data to ensure the platform
                  operates as intended.
                </p>
                <p>
                  We use AI and machine learning models to process uploaded documents as part of
                  our core service. When you upload a document and request an analysis, your
                  document data is transmitted to our processing infrastructure and, in some
                  cases, to third-party AI model providers operating under strict data processing
                  agreements. This processing is described in more detail in the AI Processing
                  Disclosure section below.
                </p>
                <p>
                  We may use aggregated, de-identified usage data to improve the quality of our
                  analytical outputs, identify areas where the platform underperforms, and
                  prioritize product development. We do not use individual users' uploaded
                  documents to train AI models without explicit, affirmative consent.
                </p>
                <p>
                  We use your contact information to send you transactional communications
                  related to your account — confirmations, alerts, product updates relevant to
                  your subscription, and support responses. We will not send you unsolicited
                  marketing communications without your consent, and you may opt out of
                  non-essential communications at any time.
                </p>
                <p>
                  We may use your information to detect and prevent fraud, abuse, and security
                  incidents; to comply with applicable laws and regulations; and to enforce our
                  Terms of Service.
                </p>
              </Prose>
            </div>

            {/* 3. AI Processing Disclosure */}
            <div id="ai-processing-disclosure">
              <SectionHeading>3. AI Processing Disclosure</SectionHeading>
              <Prose>
                <p>
                  Diligen's analytical capabilities are powered in part by large language models
                  and other AI systems. When you upload a document and request an analysis,
                  relevant portions of that document — or structured data extracted from it —
                  may be transmitted to one or more third-party AI model providers in order to
                  complete the requested analysis. These providers operate under contractual
                  obligations that prohibit the use of your data for training their models.
                </p>
                <p>
                  Uploaded documents and the data derived from them are processed ephemerally
                  for the purpose of generating analytical outputs. We do not retain the raw
                  content of your documents in AI model provider systems beyond the duration
                  of a single inference request. Once a request is complete, the input data is
                  not stored by our AI processing infrastructure.
                </p>
                <p>
                  The structured outputs that Diligen generates from your documents — financial
                  summaries, extracted metrics, flagged risk items, and similar outputs — are
                  stored on your behalf within your account so that you can access and refer to
                  them over time. This storage is governed by our document retention practices
                  described in the next section.
                </p>
                <p>
                  We make no representations that AI-generated outputs are free from error. All
                  analytical outputs produced by Diligen should be independently reviewed by a
                  qualified professional before being used as the basis for any investment
                  decision. The platform is a tool to assist and accelerate analysis, not a
                  substitute for human judgment.
                </p>
              </Prose>
            </div>

            {/* 4. Document Storage and Retention */}
            <div id="document-storage-and-retention">
              <SectionHeading>4. Document Storage and Retention</SectionHeading>
              <Prose>
                <p>
                  Documents you upload to Diligen are stored on encrypted cloud infrastructure
                  for as long as your account remains active or until you delete them. You retain
                  full control over your uploaded files: you may delete individual documents,
                  entire deal workspaces, or all documents associated with your account at any
                  time from within the platform.
                </p>
                <p>
                  When you delete a document, it is marked for deletion and removed from active
                  storage within 30 days. Backup copies maintained for disaster recovery purposes
                  are purged on a rolling 90-day schedule. After that window, deleted documents
                  are no longer recoverable.
                </p>
                <p>
                  If your subscription lapses or your account is terminated, we will retain your
                  data for a period of 60 days to allow for account reactivation or data export.
                  After that period, your account data and uploaded documents will be
                  automatically and permanently deleted. We will notify you via the email address
                  associated with your account before initiating this purge.
                </p>
                <p>
                  Certain metadata — such as the names of files that were uploaded and the dates
                  on which analysis was performed — may be retained for longer periods for
                  internal audit and compliance purposes, even after the underlying document
                  content has been deleted. This metadata does not include the substantive
                  contents of your deal documents.
                </p>
              </Prose>
            </div>

            {/* 5. Cookies and Analytics */}
            <div id="cookies-and-analytics">
              <SectionHeading>5. Cookies and Analytics</SectionHeading>
              <Prose>
                <p>
                  Diligen uses a minimal set of cookies necessary for the platform to function.
                  These include session cookies that maintain your authenticated session while
                  you are logged in, preference cookies that remember settings you have
                  configured within the platform, and security cookies that help us detect and
                  prevent fraudulent access.
                </p>
                <p>
                  We use third-party analytics tools to understand aggregate usage patterns
                  across the platform. These tools collect information about page views, feature
                  interactions, session durations, and error events. Analytics data is collected
                  in a manner that does not expose the contents of your uploaded documents to
                  analytics providers. Where possible, we configure analytics tools to
                  anonymize IP addresses and limit the persistence of individual-level tracking.
                </p>
                <p>
                  You may opt out of analytics tracking by adjusting your browser settings to
                  block third-party cookies, by using browser extensions that block analytics
                  scripts, or by contacting us at privacy@diligen.co to request that your
                  account be excluded from analytics data collection. Opting out of analytics
                  does not affect the core functionality of the platform.
                </p>
              </Prose>
            </div>

            {/* 6. Third-Party Services */}
            <div id="third-party-services">
              <SectionHeading>6. Third-Party Services</SectionHeading>
              <Prose>
                <p>
                  Diligen relies on a carefully selected set of third-party service providers to
                  deliver our platform. These include AI model providers that power our
                  analytical capabilities, cloud infrastructure providers that host our platform
                  and store your data, authentication services that manage secure login, and
                  analytics providers that help us understand platform usage.
                </p>
                <p>
                  All third-party providers with access to your data are bound by data processing
                  agreements that restrict their ability to use your data for purposes other than
                  providing the services they have been engaged to provide. We select providers
                  based on their security practices and their contractual willingness to treat
                  customer data with the same confidentiality we commit to in this Policy.
                </p>
                <p>
                  We do not sell your personal information to third parties. We do not share your
                  uploaded documents with third parties except as necessary to deliver the
                  analytical services you have requested, or as required by law. In the event
                  that we are required by law, court order, or governmental authority to disclose
                  information, we will notify you to the extent permitted by law prior to making
                  any disclosure.
                </p>
                <p>
                  If Diligen is acquired, merged with another company, or undergoes a change of
                  control, your information may be transferred to the acquiring entity as part of
                  that transaction. In such an event, we will notify you via email and provide
                  you with an opportunity to delete your account and data before the transfer is
                  completed.
                </p>
              </Prose>
            </div>

            {/* 7. Data Security */}
            <div id="data-security">
              <SectionHeading>7. Data Security</SectionHeading>
              <Prose>
                <p>
                  We take the security of your data seriously, particularly given that our
                  customers routinely upload highly sensitive financial documents. We implement
                  technical and organizational measures designed to protect your information
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <p>
                  All data transmitted between your browser and our platform is encrypted in
                  transit using TLS. Data stored on our infrastructure — including uploaded
                  documents, extracted data, and account information — is encrypted at rest using
                  industry-standard encryption. Access to production systems and customer data
                  is restricted to a small number of authorized personnel and is governed by
                  role-based access controls and audit logging.
                </p>
                <p>
                  We conduct regular reviews of our security practices and infrastructure
                  configurations. Our team follows established security engineering practices
                  including dependency management, vulnerability scanning, and incident response
                  planning. In the event of a confirmed data breach that affects your personal
                  information, we will notify you and applicable regulatory authorities as
                  required by law.
                </p>
                <p>
                  No method of transmission over the internet or method of electronic storage is
                  100% secure. While we work hard to protect your information, we cannot
                  guarantee absolute security. We encourage you to use a strong, unique password
                  for your Diligen account and to contact us immediately at
                  privacy@diligen.co if you believe your account has been compromised.
                </p>
              </Prose>
            </div>

            {/* 8. User Rights */}
            <div id="user-rights">
              <SectionHeading>8. User Rights</SectionHeading>
              <Prose>
                <p>
                  You have meaningful rights with respect to the personal information we hold
                  about you. These rights include the right to access the personal information
                  we hold about your account; the right to correct inaccurate information; the
                  right to request deletion of your personal information and uploaded documents;
                  and the right to receive a copy of your data in a portable, machine-readable
                  format.
                </p>
                <p>
                  You may exercise most of these rights directly within the Diligen platform.
                  Your account settings allow you to update your profile information, delete
                  individual documents or entire workspaces, and export your account data. For
                  requests that cannot be fulfilled through the platform interface, you may
                  contact us at privacy@diligen.co and we will respond within 30 days.
                </p>
                <p>
                  If you are located in a jurisdiction that provides specific data protection
                  rights — such as the right to object to processing, the right to restriction
                  of processing, or rights under the GDPR or CCPA — you may exercise those
                  rights by contacting us at the address below. We will assess each request in
                  accordance with applicable law and respond within the timeframe required by
                  that law.
                </p>
                <p>
                  We will not discriminate against you for exercising any of these rights. If
                  you choose to delete your account and data, we will process that request
                  promptly and confirm completion in writing.
                </p>
              </Prose>
            </div>

            {/* 9. International Data Transfers */}
            <div id="international-data-transfers">
              <SectionHeading>9. International Data Transfers</SectionHeading>
              <Prose>
                <p>
                  Diligen is based in the United States, and our primary infrastructure is
                  located in US-based data centers. If you access the platform from outside the
                  United States, your information — including uploaded documents — will be
                  transferred to, stored, and processed in the United States.
                </p>
                <p>
                  United States data protection laws may differ from those in your country of
                  residence. By using the Diligen platform, you acknowledge that your
                  information will be processed in the United States in accordance with this
                  Privacy Policy and applicable US law. If you have questions about how we
                  handle cross-border data transfers or if your organization has specific
                  requirements regarding data residency, please contact us at
                  privacy@diligen.co to discuss available options.
                </p>
              </Prose>
            </div>

            {/* 10. Children's Privacy */}
            <div id="childrens-privacy">
              <SectionHeading>10. Children's Privacy</SectionHeading>
              <Prose>
                <p>
                  The Diligen platform is intended exclusively for use by professionals engaged
                  in private market investment activity. It is not directed at individuals under
                  the age of 18, and we do not knowingly collect personal information from
                  anyone under 18 years of age.
                </p>
                <p>
                  If we become aware that we have inadvertently collected personal information
                  from a person under 18, we will take prompt steps to delete that information
                  from our systems. If you believe we may have collected information from a
                  minor, please contact us at privacy@diligen.co.
                </p>
              </Prose>
            </div>

            {/* 11. Changes to This Policy */}
            <div id="changes-to-this-policy">
              <SectionHeading>11. Changes to This Policy</SectionHeading>
              <Prose>
                <p>
                  We may update this Privacy Policy from time to time as our practices evolve,
                  as we add new features to the platform, or as applicable law changes. When we
                  make material changes to this Policy, we will notify you by sending an email
                  to the address associated with your account and by displaying a prominent
                  notice within the platform at least 14 days before the changes take effect.
                </p>
                <p>
                  The "last updated" date at the top of this Policy indicates when it was most
                  recently revised. We encourage you to review this Policy periodically to stay
                  informed about how we handle your information. Your continued use of the
                  platform after the effective date of any changes constitutes your acceptance
                  of the updated Policy.
                </p>
                <p>
                  For material changes that significantly affect how we use your personal
                  information or uploaded documents, we will seek your affirmative consent
                  before applying those changes to information we have already collected.
                </p>
              </Prose>
            </div>

            {/* 12. Contact Information */}
            <div id="contact-information">
              <SectionHeading>12. Contact Information</SectionHeading>
              <Prose>
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or
                  how we handle your personal information, please contact our privacy team at:
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
                    Privacy Team:{" "}
                    <a
                      href="mailto:privacy@diligen.co"
                      className="transition-colors hover:text-white"
                      style={{ color: "#1ABEBD" }}
                    >
                      privacy@diligen.co
                    </a>
                  </p>
                </div>
                <p>
                  We aim to respond to all privacy-related inquiries within 5 business days.
                  For time-sensitive matters, such as suspected unauthorized access to your
                  account, please indicate the urgency in the subject line of your message.
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#06101C" }}>
      <SiteNav />
      <main>
        <PrivacyHero />
        <PrivacyContent />
      </main>
      <SiteFooter />
    </div>
  )
}
