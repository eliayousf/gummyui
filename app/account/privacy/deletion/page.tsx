import type { Metadata } from "next";
import { AccountRoute } from "../../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.deletion.title,
};

export default function AccountDeletionPage() {
  return <AccountRoute route="deletion" />;
}
