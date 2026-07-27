import type { Metadata } from "next";
import type { ReactNode } from "react";
import { accountPublicCopy } from "../../lib/commerce/account";
import { resolveServerAccountAccess } from "../../lib/commerce/server-access";
import { AccountShell } from "./_components/AccountShell";
import "./account.css";

export const metadata: Metadata = {
  title: {
    default: accountPublicCopy.shell.metadataTitle,
    template: accountPublicCopy.shell.metadataTemplate,
  },
  description: accountPublicCopy.shell.metadataDescription,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
  },
};

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const access = await resolveServerAccountAccess();
  return <AccountShell access={access}>{children}</AccountShell>;
}
