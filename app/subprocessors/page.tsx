import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts } from "../data/commercial";
import { serviceProviders } from "../data/subprocessors";

export const metadata: Metadata = {
  title: "Gummy UI service-provider and subprocessor directory",
  description:
    "Review the production providers Gummy UI uses for hosting, identity, application data, email, monitoring, encrypted backups and Managed Payments.",
  alternates: { canonical: "/subprocessors" },
  robots: { index: true, follow: true },
};

export default function SubprocessorsPage() {
  return (
    <PublicTextPage
      eyebrow={`Provider directory · privacy terms effective ${commercialFacts.effectiveDate}`}
      title="Production providers, named and bounded."
      lede={`${commercialFacts.legalName}, trading as ${commercialFacts.tradingName}, uses the services below to operate Gummy UI. This service-provider and subprocessor directory supplements the privacy notice; it does not expand the data collected or change the role a provider has under its applicable terms.`}
    >
      <section>
        <h2>Current service-provider and subprocessor directory</h2>
        <p>
          Each provider receives only the data needed for its stated service.
          Gummy UI&apos;s service instructions do not authorise advertising,
          sale of customer data, or product development unrelated to providing
          the contracted service.
        </p>
        <div className="public-page__grid">
          {serviceProviders.map((provider) => (
            <article key={provider.name}>
              <h3>{provider.name}</h3>
              <p><strong>Service:</strong> {provider.service}</p>
              <p><strong>Data context:</strong> {provider.dataContext}</p>
              <p><strong>Role:</strong> {provider.role}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>International processing and safeguards</h2>
        <p>
          A provider may process data outside the United Kingdom when its
          service requires it. Where applicable, Gummy UI relies on a UK
          adequacy regulation or recognised contractual safeguards supplied
          through the provider&apos;s data-processing terms. The exact route
          depends on the provider, service and data involved; this page does
          not claim that every record follows one location or transfer path.
        </p>
        <p>
          Requests for further information about an applicable transfer
          safeguard or provider data-processing agreement can be sent to{" "}
          <a href={commercialFacts.supportHref}>
            {commercialFacts.supportEmail}
          </a>. Contractual material may be subject to confidentiality, but we
          will respond with the information we can lawfully provide about the
          processing.
        </p>
      </section>
      <section>
        <h2>Changes to this directory</h2>
        <p>
          The directory is updated before a new production provider begins
          processing customer data for a materially new purpose. Important
          changes will also be reflected in the privacy notice and brought to
          account holders&apos; attention where required. Removing a provider
          from active use does not shorten financial, security, legal-hold or
          backup retention already described in the privacy notice.
        </p>
        <p>
          Checkout and paid-file delivery remain unavailable until their full
          production journeys pass. Listing Stripe here records the configured
          provider boundary; it is not evidence that customer payments are
          currently accepted. Read the <Link href="/privacy">privacy notice</Link>{" "}
          for purposes, retention and rights, or the{" "}
          <Link href="/security">security page</Link> for reporting guidance.
        </p>
      </section>
    </PublicTextPage>
  );
}
