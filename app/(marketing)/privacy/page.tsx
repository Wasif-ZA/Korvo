import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Korvo",
};

export default function PrivacyPage() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-serif font-semibold text-text-primary mb-4">
        Privacy Policy
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: April 2026</p>
      <div className="prose prose-slate max-w-none text-text-body space-y-6">
        <p>
          We wrote this in plain English because you are probably a uni student
          or career changer, not a lawyer. This policy explains what data Korvo
          collects, why we collect it, and how we protect it. Korvo is governed
          by the Australian Privacy Act 1988 and the Australian Privacy
          Principles (APPs).
        </p>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          1. Information We Collect (APP 1 — Collection Purposes)
        </h2>
        <p>We collect the following information:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Google account info</strong> — your name, email address, and
            profile avatar, collected via Google OAuth when you sign up or log
            in.
          </li>
          <li>
            <strong>Gmail send scope</strong> — for Pro users who connect their
            Gmail account, we request the <code>gmail.send</code> scope
            (send-only access). We never read your inbox.
          </li>
          <li>
            <strong>Search queries</strong> — the company name, target role, and
            location you enter when running a search. These are stored so you
            can revisit your search history.
          </li>
          <li>
            <strong>Contact data</strong> — names, job titles, and publicly
            available contact information sourced from public websites (company
            pages, engineering blogs, conference listings). We do not scrape
            LinkedIn or any private source.
          </li>
          <li>
            <strong>Usage data</strong> — anonymised event data collected via
            PostHog analytics (for example: which features you use, how often
            you search). You can opt out in Settings.
          </li>
          <li>
            <strong>Error data</strong> — technical error reports collected via
            Sentry to help us fix bugs. We minimise personal data in error
            reports.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          2. Notification of Collection (APP 5)
        </h2>
        <p>We collect data at these points — and we tell you at each one:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Signup</strong> — Google OAuth screen shows exactly what we
            request before you authorise.
          </li>
          <li>
            <strong>Search submission</strong> — you enter data directly and see
            it used immediately.
          </li>
          <li>
            <strong>Gmail connection</strong> — OAuth screen shows the
            gmail.send scope before you authorise.
          </li>
          <li>
            <strong>Email send</strong> — you review and approve each email
            before it is sent. We never auto-send.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          3. How We Use Your Information (APP 6 — Use and Disclosure)
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Search data (company, role, location) is used to find relevant
            contacts and generate personalised outreach emails.
          </li>
          <li>
            Contact data is processed by Claude AI (Anthropic) to research and
            draft emails. Anthropic&apos;s API does not use your data to train
            their models.
          </li>
          <li>
            The Gmail API is used only to send emails you have reviewed and
            explicitly approved. There is always a human in the loop — you
            decide what gets sent.
          </li>
          <li>
            Analytics data (PostHog) is used to understand which features are
            useful and to improve the product.
          </li>
          <li>
            <strong>
              We do not sell your personal information to any third parties.
            </strong>
          </li>
          <li>
            We do not share your data with third parties except the service
            providers listed in Section 7 below, and only to the extent needed
            to provide our service.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          4. Data Retention
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Contact data</strong> — retained for 90 days, then
            automatically deleted. People change jobs — stale data is not
            useful.
          </li>
          <li>
            <strong>User account data</strong> (name, email, subscription
            status) — retained for the lifetime of your account.
          </li>
          <li>
            <strong>Search history</strong> — retained for the lifetime of your
            account so you can revisit past searches.
          </li>
          <li>
            <strong>Gmail tokens</strong> — stored encrypted and deleted
            immediately when you disconnect Gmail in Settings.
          </li>
          <li>
            You can request deletion of your account and all associated data at
            any time (see Section 6).
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          5. Data Security (APP 11)
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>AES-256 encryption</strong> for sensitive data at rest
            (Gmail tokens, API keys).
          </li>
          <li>
            <strong>Row Level Security (RLS)</strong> is enforced on every
            database table. Your data is mathematically invisible to other users
            — even database administrators cannot query across user boundaries.
          </li>
          <li>
            <strong>HTTPS everywhere</strong> — all traffic between your browser
            and our servers is encrypted in transit.
          </li>
          <li>
            <strong>Secure cookies</strong> — session tokens are stored in
            httpOnly, SameSite=Strict cookies.
          </li>
          <li>
            We conduct regular security reviews and patch dependencies promptly.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          6. Access and Correction (APP 13)
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            You can view and update your profile information in{" "}
            <strong>Settings</strong> at any time.
          </li>
          <li>
            You can disconnect Gmail access in Settings — this immediately
            revokes our send permissions.
          </li>
          <li>
            To request a full export of your data or deletion of your account,
            email us at{" "}
            <a
              href="mailto:privacy@korvo.app"
              className="text-accent hover:underline"
            >
              privacy@korvo.app
            </a>
            .
          </li>
          <li>
            We will respond to access and correction requests within 30 days, as
            required by the Australian Privacy Act.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          7. Third-Party Services
        </h2>
        <p>We use the following third-party services to provide Korvo:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Supabase</strong> — database and authentication. Your data
            is stored on PostgreSQL servers accessible from Australia.
          </li>
          <li>
            <strong>Anthropic Claude API</strong> — AI processing for contact
            research and email drafting. Anthropic does not use API data to
            train their models. See{" "}
            <a
              href="https://www.anthropic.com/legal/privacy"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>PostHog</strong> — anonymised product analytics. You can opt
            out in Settings. See{" "}
            <a
              href="https://posthog.com/privacy"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              PostHog&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Sentry</strong> — error tracking for debugging. We minimise
            personal data in error reports.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing. We never see your card
            number — Stripe is PCI-DSS compliant and handles all payment data
            directly.
          </li>
          <li>
            <strong>Google Gmail API</strong> — Pro users can send emails
            directly from their own Gmail account via the gmail.send scope
            (send-only, no inbox access).
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          8. Changes to This Policy
        </h2>
        <p>
          We will notify registered users by email of any material changes to
          this Privacy Policy before they take effect. Continued use of Korvo
          after changes are notified constitutes acceptance of the updated
          policy.
        </p>

        <p className="text-text-muted text-sm pt-4">
          Questions? Email us at{" "}
          <a
            href="mailto:privacy@korvo.app"
            className="text-accent hover:underline"
          >
            privacy@korvo.app
          </a>
        </p>
      </div>
    </div>
  );
}
