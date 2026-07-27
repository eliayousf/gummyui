import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.privacy.title,
};

export default function AccountPrivacyPage() {
  return <AccountRoute route="privacy" />;
}
