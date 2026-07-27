import type { Metadata } from "next";
import { AccountRoute } from "../../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.invitations.title,
};

export default function AccountInvitationsPage() {
  return <AccountRoute route="invitations" />;
}
