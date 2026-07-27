import type { Metadata } from "next";
import { AccountRoute } from "../../_components/AccountRoute";
import { accountSectionDefinitions } from "../../../../lib/commerce/account";

export const metadata: Metadata = {
  title: accountSectionDefinitions["data-export"].title,
};

export default function AccountExportPage() {
  return <AccountRoute route="data-export" />;
}
