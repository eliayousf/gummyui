import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.licences.title,
};

export default function AccountLicencesPage() {
  return <AccountRoute route="licences" />;
}
