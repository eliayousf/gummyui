import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { CheckoutButton } from "../components/CheckoutButton";
import {
  commercialPlans,
  commercialPolicy,
  type CommercialAudience,
  type CommercialBillingInterval,
} from "../data/commercial";

const checkoutEnabled =
  process.env.STRIPE_CHECKOUT_ENABLED === "true";

export const metadata: Metadata = {
  title: "Pricing plans and licences for Gummy UI Pro",
  description:
    "Compare Gummy UI Pro Individual, Team and Organization monthly, yearly and lifetime prices, seats, support, licence and refund terms.",
  alternates: { canonical: "/pricing" },
  robots: { index: true, follow: true },
};

const audiences: readonly CommercialAudience[] = [
  "Individual",
  "Team",
  "Organization",
];

const billingLabels: Record<CommercialBillingInterval, string> = {
  month: "monthly",
  year: "yearly",
  lifetime: "one-time lifetime",
};

function formatUsd(priceUsd: number): string {
  return `$${priceUsd.toLocaleString("en-US")} USD`;
}

export default function PricingPage() {
  return (
    <PublicTextPage
      eyebrow="Monthly · yearly · lifetime"
      title="All-access pricing for every team size."
      lede={checkoutEnabled
        ? "Every paid plan includes all released Pro blocks, all six templates and the released design kit. Choose the seat level and billing period that fit you."
        : "Every paid plan includes all released Pro blocks, all six templates and the released design kit. Choose the seat level and billing period that fit you. Checkout stays closed until the paid catalogue, entitlement system and production payment flow pass final review."}
    >
      {audiences.map((audience) => (
        <section key={audience}>
          <h2>{audience}</h2>
          <div className="public-page__grid">
            {commercialPlans
              .filter((plan) => plan.audience === audience)
              .map((plan) => (
                <article key={plan.id}>
                  <h3>{billingLabels[plan.billingInterval]}</h3>
                  <p>
                    <strong>{formatUsd(plan.priceUsd)}</strong>
                    {" · "}
                    {plan.billingInterval === "month"
                      ? "per month"
                      : plan.billingInterval === "year"
                        ? "per year"
                        : "pay once"}
                  </p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <CheckoutButton
                    enabled={checkoutEnabled}
                    planId={plan.id}
                  />
                </article>
              ))}
          </div>
        </section>
      ))}
      <section>
        <h2>Updates, cancellation and lifetime access</h2>
        <p>Monthly and yearly plans renew automatically until cancelled. An active subscription is required for new downloads, future updates and paid support. After cancellation, you may keep using versions already delivered to you in existing permitted projects, but access to new files, updates and support ends when the paid period ends.</p>
        <p>A lifetime purchase has no recurring charge and includes future releases and paid support for the commercial lifetime of Gummy UI Pro. It does not promise that the product, website, download service or support service will operate forever.</p>
        <p>Paid support has a first-response target of {commercialPolicy.supportFirstResponse}. It is a target, not an SLA or a promise to implement or debug a customer project.</p>
      </section>
      <section>
        <h2>Taxes and refunds</h2>
        <p>Prices are shown in USD. Stripe may display and charge a local currency and add taxes required for the customer&apos;s location. Gummy UI is not VAT registered. For an eligible Managed Payments order, Link is the merchant of record and provides the payment receipt, invoice, transaction support and order management.</p>
        <p>The goodwill refund window is 14 days only while no paid file has been accessed. Statutory rights and duplicate, fraudulent or provider-error corrections are unaffected. Read the <Link href="/refund">refund policy</Link> and <Link href="/commercial-license">commercial licence</Link>.</p>
      </section>
      <section>
        <h2>Launch status</h2>
        {checkoutEnabled ? (
          <>
            <p>
              Secure checkout is open. Sign in, choose a plan and complete
              payment with Stripe. Access appears only after a verified
              payment event creates the licence and entitlement.
            </p>
            <Link href="/account">Open your account</Link>
          </>
        ) : (
          <>
            <p>The prices and commercial rules are approved, but checkout is not live yet. Paid files remain unavailable until manual QA, release packaging, entitlement controls and the real Stripe flow pass. The public 57-component catalogue remains available under the MIT licence.</p>
            <Link href="/pro">Review the current Pro release status</Link>
          </>
        )}
      </section>
    </PublicTextPage>
  );
}
