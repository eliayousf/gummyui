import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts } from "../data/commercial";

export const metadata: Metadata = {
  title: "Gummy UI privacy notice",
  description:
    "Read how Kreyd Labs handles Gummy UI account, purchase, download, support, security and website data, including providers, retention and rights.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <PublicTextPage
      eyebrow={`Privacy Notice v1.0 · effective ${commercialFacts.effectiveDate}`}
      title="Your data is for access, delivery and support."
      lede={`${commercialFacts.legalName}, trading as ${commercialFacts.tradingName}, is the controller for Gummy UI account, entitlement, support and website data. Stripe and Link are separately responsible for payment and transaction-support data they handle through Managed Payments.`}
    >
      <section>
        <h2>1. Contact and scope</h2>
        <p>Controller: {commercialFacts.legalName}, company {commercialFacts.companyNumber}, {commercialFacts.registeredAddress}. Privacy requests: <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a>.</p>
        <p>This notice covers gummyui.dev, Gummy UI accounts, paid entitlements, downloads and support. The public GitHub repository and third-party services have their own notices where you use them directly.</p>
      </section>
      <section>
        <h2>2. Data we use and why</h2>
        <ul>
          <li><strong>Account and workspace:</strong> name, email, identity-provider identifier, session/security state, workspace, role and invitations. Used to perform the contract, secure access and administer seats.</li>
          <li><strong>Orders and entitlements:</strong> Stripe customer/order references, plan, amount/currency, tax and payment status, invoice reference, licence, entitlement and download history. Used to perform the contract, prevent fraud and meet legal/financial record duties. We do not store full card details.</li>
          <li><strong>Support and rights requests:</strong> email address, message, attachments you choose to send, order reference and our response. Used to answer the request, perform the contract and protect legitimate operational/legal interests.</li>
          <li><strong>Technical and security:</strong> IP address, request time, route, browser/device information, authentication events, rate-limit state, errors and security/audit events. Used for necessary security, reliability, abuse prevention and legal claims.</li>
          <li><strong>Preferences:</strong> theme preference is stored in your browser. Optional marketing is not part of the launch service and will require a separate choice if introduced.</li>
        </ul>
        <p>We do not use customer data for advertising, sell personal data or make solely automated decisions with legal or similarly significant effects.</p>
      </section>
      <section>
        <h2>3. Providers</h2>
        <p>The approved production design uses Vercel for hosting, WorkOS for sign-in and organisation access, Stripe Managed Payments for checkout/payment/tax support, Convex for the application database and backend transactions, Resend for product email, Better Stack for monitoring and Backblaze B2 for encrypted off-provider backups. Provider use must be rechecked against the real production configuration before this notice is published.</p>
        <p>Providers may process data outside the United Kingdom. Where required, we rely on an adequacy regulation or recognised contractual safeguards supplied by the provider. You may request more information using the privacy contact above.</p>
      </section>
      <section>
        <h2>4. Retention</h2>
        <ul>
          <li>Account profile: while open, then normally removed within 30 days after a completed deletion request.</li>
          <li>Download grants and product-email delivery events: 90 days.</li>
          <li>Access, consent, security and audit events: 12 months unless needed longer for an active incident or legal claim.</li>
          <li>Support and closed-incident records: 24 months.</li>
          <li>Licence, order, invoice, refund, chargeback and tax evidence: six years after the relevant financial period or longer if law requires.</li>
          <li>Rolling operational backups: 35 days, subject to tested expiry and legal holds.</li>
        </ul>
        <p>We may retain a minimal suppression, fraud or legal-claims record where deleting it would defeat a legal duty or security purpose.</p>
      </section>
      <section>
        <h2>5. Your rights</h2>
        <p>Depending on the circumstances, you may have rights to access, correct, erase, restrict or receive your data, and to object to processing based on legitimate interests. You may withdraw consent where consent is the basis. Rights can be limited by law, including financial-record and legal-claims duties.</p>
        <p>Email <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a>. We may need proportionate information to confirm identity. You may also complain to the UK Information Commissioner&apos;s Office at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.</p>
      </section>
      <section>
        <h2>6. Cookies, security and changes</h2>
        <p>Essential account cookies are used to keep a signed-in session secure. The theme setting uses browser local storage. Stripe and WorkOS may set strictly necessary checkout or authentication storage on their own hosted surfaces. We do not launch optional advertising or marketing cookies.</p>
        <p>We use access controls, encryption in transit, restricted provider credentials, audit records and encrypted backups. No system is completely secure; report concerns through the <Link href="/security">security page</Link>.</p>
        <p>We will update this notice before using personal data for a materially new purpose and will bring important changes to account holders&apos; attention.</p>
      </section>
    </PublicTextPage>
  );
}
