import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.purchases.title,
};

export default function AccountPurchasesPage() {
  return <AccountRoute route="purchases" />;
}
