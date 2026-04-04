import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Korvo",
};

export default function TermsPage() {
  return (
    <div className="py-24 max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-serif font-semibold text-text-primary mb-4">
        Terms of Service
      </h1>
      <p className="text-text-muted text-sm mb-8">Last updated: April 2026</p>
      <div className="prose prose-slate max-w-none text-text-body space-y-6">
        <p>
          Please read these Terms of Service carefully before using Korvo. By
          creating an account or using our service, you agree to be bound by
          these terms.
        </p>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using Korvo (&quot;the Service&quot;), you confirm
          that you are at least 18 years of age, or that you have parental or
          guardian consent to use the Service. If you are using Korvo on behalf
          of an organisation, you confirm you have authority to bind that
          organisation to these terms.
        </p>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          2. Description of Service
        </h2>
        <p>
          Korvo is an AI-powered job outreach tool. It helps you identify
          professional contacts at companies, research personalisation hooks,
          and draft cold outreach emails for networking and job search purposes.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Contact data is sourced exclusively from publicly available
            information (company websites, engineering blogs, conference pages,
            public web results). We do not scrape LinkedIn or any private data
            source.
          </li>
          <li>
            Results are AI-generated and may not be 100% accurate. Contact
            details (especially email addresses) are best guesses based on
            publicly visible patterns.
          </li>
          <li>
            Korvo is a drafting tool — you are always responsible for reviewing
            content before sending.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          3. Account Responsibility
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            You are responsible for maintaining the security of your account
            credentials.
          </li>
          <li>
            You are responsible for all activity that occurs under your account,
            whether or not authorised by you.
          </li>
          <li>Do not share your login credentials or API keys with anyone.</li>
          <li>
            Notify us immediately at{" "}
            <a
              href="mailto:support@korvo.app"
              className="text-accent hover:underline"
            >
              support@korvo.app
            </a>{" "}
            if you suspect unauthorised access to your account.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          4. Prohibited Conduct
        </h2>
        <p>You must not use Korvo to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Spam</strong> — send unsolicited bulk email or use
            Korvo-generated drafts for mass outreach campaigns.
          </li>
          <li>
            <strong>Misuse the Service</strong> — use Korvo for any purpose
            other than professional networking and legitimate job search
            activities.
          </li>
          <li>
            <strong>Bulk data extraction</strong> — attempt to scrape, extract,
            or download contact data in bulk using automated means.
          </li>
          <li>
            <strong>Impersonation</strong> — misrepresent your identity in
            outreach emails or pretend to be someone you are not.
          </li>
          <li>
            <strong>Violate anti-spam laws</strong> — violate the Australian
            Spam Act 2003, CAN-SPAM Act, or any other applicable anti-spam
            legislation in your jurisdiction.
          </li>
          <li>
            <strong>Harm third parties</strong> — harass, threaten, or abuse the
            contacts found through Korvo.
          </li>
          <li>
            <strong>Circumvent security</strong> — attempt to bypass rate
            limits, access other users&apos; data, or reverse-engineer the
            Service.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          5. Email Sending Responsibility
        </h2>
        <p>This section is important. Please read it carefully.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            You are solely responsible for all emails sent through or with
            assistance from Korvo.
          </li>
          <li>
            Korvo provides drafting tools — you make the decision to send each
            email. We never auto-send on your behalf.
          </li>
          <li>
            Human-in-the-loop: every email requires your explicit action to
            send. This is by design and is non-negotiable.
          </li>
          <li>
            You must comply with all applicable laws in your jurisdiction
            regarding unsolicited commercial email.
          </li>
          <li>
            Korvo is not responsible for the content of emails once you have
            sent them or for any consequences of your outreach.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          6. Service Limitations
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Contact data is sourced from public information and may be
            incomplete, outdated, or inaccurate. Verify before relying on it.
          </li>
          <li>
            AI-generated email drafts are starting points for your outreach —
            review and personalise them before sending.
          </li>
          <li>
            We do not guarantee uptime. Korvo is provided on a best-effort
            basis. Planned maintenance will be announced where practicable.
          </li>
          <li>
            We reserve the right to modify or discontinue features with
            reasonable notice.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          7. Subscription and Payments
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Free tier:</strong> 5 searches per month, 5 email drafts per
            month.
          </li>
          <li>
            <strong>Pro tier:</strong> $19 AUD/month — 50 searches per month,
            unlimited drafts, Gmail API send integration.
          </li>
          <li>
            Subscriptions are managed via Stripe. You can cancel, upgrade, or
            downgrade at any time through your account Settings.
          </li>
          <li>
            Cancellation takes effect at the end of the current billing period.
            No partial refunds for unused time.
          </li>
          <li>
            We reserve the right to change pricing with 30 days&apos; notice to
            existing subscribers.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          8. Intellectual Property
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            The Korvo brand, logo, codebase, and design are owned by Korvo and
            protected by copyright and trademark law.
          </li>
          <li>
            The email drafts you create using Korvo are yours — we claim no
            ownership over them.
          </li>
          <li>
            You grant Korvo a limited licence to store and process your search
            queries and contact data solely to provide the Service.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          9. Termination
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            We may suspend or terminate accounts that violate these Terms, with
            or without notice depending on severity.
          </li>
          <li>
            You may delete your account at any time through Settings. Deletion
            is permanent and irreversible.
          </li>
          <li>
            Upon termination, your right to use the Service ceases immediately.
            Sections 5, 8, and 10 survive termination.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          10. Governing Law
        </h2>
        <p>
          These Terms of Service are governed by and construed in accordance
          with the laws of Australia. Any disputes arising from or in connection
          with these Terms shall be subject to the exclusive jurisdiction of the
          courts of Australia. If you are located outside Australia, you agree
          to submit to Australian jurisdiction for any dispute related to your
          use of the Service.
        </p>

        <h2 className="text-xl font-bold text-text-primary pt-4">
          11. Contact
        </h2>
        <p>
          For legal enquiries, contact us at{" "}
          <a
            href="mailto:legal@korvo.app"
            className="text-accent hover:underline"
          >
            legal@korvo.app
          </a>
          . For general support, contact us at{" "}
          <a
            href="mailto:support@korvo.app"
            className="text-accent hover:underline"
          >
            support@korvo.app
          </a>
          .
        </p>
      </div>
    </div>
  );
}
