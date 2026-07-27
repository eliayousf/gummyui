import type { Metadata } from "next";
import { AccountRoute } from "../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions.downloads.title,
};

export default function AccountDownloadsPage() {
  return <AccountRoute route="downloads" />;
}
