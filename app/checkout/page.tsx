import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "../components/CheckoutForm";
import { PublicTextPage } from "../components/PublicTextPage";
import {
  commercialPlans,
  type CommercialPlanId,
} from "../data/commercial";
import { accountPublicCopy } from "../../lib/commerce/account";

const copy = accountPublicCopy.checkout;

export const metadata: Metadata = {
  title: copy.metadataTitle,
  description: copy.metadataDescription,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
  },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string | string[];
    checkout?: string | string[];
  }>;
}) {
  if (process.env.STRIPE_CHECKOUT_ENABLED !== "true") {
    return <CheckoutUnavailable />;
  }
  const {
    plan: planValue,
    checkout: checkoutValue,
  } = await searchParams;
  const planId = typeof planValue === "string" ? planValue : null;
  const plan = commercialPlans.find(
    (candidate) => candidate.id === planId,
  );
  if (!plan) {
    notFound();
  }
  return (
    <PublicTextPage
      eyebrow="Secure checkout"
      title={`${plan.audience} · ${billingLabel(plan.id)}`}
      lede={`Confirm immediate digital supply before continuing to Stripe Managed Payments. The server—not this page—controls the approved $${plan.priceUsd.toLocaleString("en-US")} USD price.`}
    >
      <section>
        <h2>Included</h2>
        <ul>
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Confirm and continue</h2>
        {checkoutValue === "cancelled" ? (
          <p role="status">
            Checkout was cancelled and no payment was taken. Your selected
            plan is still shown below if you want to try again.
          </p>
        ) : null}
        <CheckoutForm plan={plan} />
      </section>
    </PublicTextPage>
  );
}

function CheckoutUnavailable() {
  return (
    <PublicTextPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      lede={copy.lede}
    >
      <section>
        <h2>{copy.sections[0].title}</h2>
        <p>{copy.sections[0].body}</p>
      </section>
      <section>
        <h2>{copy.sections[1].title}</h2>
        <p>{copy.sections[1].body}</p>
        <Link href="/pricing">{copy.sections[1].action}</Link>
      </section>
    </PublicTextPage>
  );
}

function billingLabel(planId: CommercialPlanId): string {
  if (planId.endsWith("-monthly")) return "Monthly";
  if (planId.endsWith("-yearly")) return "Yearly";
  return "Lifetime";
}
