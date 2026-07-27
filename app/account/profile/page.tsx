import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.profile.title,
};

export default function AccountProfilePage() {
  return <AccountRoute route="profile" />;
}
