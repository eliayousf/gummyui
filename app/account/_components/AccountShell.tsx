import Link from "next/link";
import type { ReactNode } from "react";
import {
  accountNavigation,
  accountPublicCopy,
  type ServerAccountAccess,
} from "../../../lib/commerce/account";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";

export function AccountShell({
  access,
  children,
}: {
  access: ServerAccountAccess;
  children: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#account-content">
        {accountPublicCopy.shell.skipLink}
      </a>
      <SiteHeader />
      <div className="account-frame">
        <aside className="account-sidebar">
          <div className="account-sidebar__brand">
            <span aria-hidden="true">g</span>
            <div>
              <strong>{accountPublicCopy.shell.label}</strong>
              <small>
                {access.status === "authenticated"
                  ? access.workspaceLabel
                  : accountPublicCopy.shell.secureWorkspace}
              </small>
            </div>
          </div>
          <nav aria-label={accountPublicCopy.shell.navigationLabel}>
            {accountNavigation.map((item) => (
              <Link key={item.key} href={item.href}>{item.label}</Link>
            ))}
          </nav>
        </aside>
        <main id="account-content" className="account-main">
          {access.status === "authenticated"
            ? children
            : <AccountAccessGate access={access} />}
        </main>
      </div>
      <SiteFooter />
    </>
  );
}

function AccountAccessGate({
  access,
}: {
  access: Exclude<ServerAccountAccess, { status: "authenticated" }>;
}) {
  if (access.status === "signed_out") {
    return (
      <section className="account-gate" aria-labelledby="account-gate-title">
        <p className="showcase-kicker">{accountPublicCopy.signedOut.eyebrow}</p>
        <h1 id="account-gate-title">{accountPublicCopy.signedOut.title}</h1>
        <p>{accountPublicCopy.signedOut.description}</p>
        <Link className="account-action" href="/sign-in">
          {accountPublicCopy.signedOut.action}
        </Link>
      </section>
    );
  }

  return (
    <section className="account-gate" aria-labelledby="account-gate-title">
      <p className="showcase-kicker">{accountPublicCopy.unavailable.eyebrow}</p>
      <h1 id="account-gate-title">{accountPublicCopy.unavailable.title}</h1>
      <p>{accountPublicCopy.unavailable.description}</p>
      <div className="account-gate__links">
        <Link className="account-action" href="/pro">
          {accountPublicCopy.unavailable.proAction}
        </Link>
        <Link href="/support">{accountPublicCopy.unavailable.supportAction}</Link>
      </div>
    </section>
  );
}
