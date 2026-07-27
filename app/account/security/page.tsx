import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.security.title,
};

export default function AccountSecurityPage() {
  return <AccountRoute route="security" />;
}
