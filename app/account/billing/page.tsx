import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.billing.title,
};

export default function AccountBillingPage() {
  return <AccountRoute route="billing" />;
}
