import Link from "next/link";
import type { CommercialPlanId } from "../data/commercial";

export function CheckoutButton({
  enabled,
  planId,
}: {
  enabled: boolean;
  planId: CommercialPlanId;
}) {
  if (!enabled) {
    return <span aria-label="Checkout is not live">Coming soon</span>;
  }
  return (
    <Link
      className="public-page__action"
      href={`/checkout?plan=${encodeURIComponent(planId)}`}
    >
      Choose this plan
    </Link>
  );
}
