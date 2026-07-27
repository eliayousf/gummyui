import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.team.title,
};

export default function AccountTeamPage() {
  return <AccountRoute route="team" />;
}
