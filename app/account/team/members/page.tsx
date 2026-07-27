import type { Metadata } from "next";
import { AccountRoute } from "../../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.members.title,
};

export default function AccountMembersPage() {
  return <AccountRoute route="members" />;
}
