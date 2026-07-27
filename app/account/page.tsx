import type { Metadata } from "next";
import { AccountRoute } from "./_components/AccountRoute";
import { accountSectionDefinitions } from "../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.overview.title,
};

export default function AccountOverviewPage() {
  return <AccountRoute route="overview" />;
}
