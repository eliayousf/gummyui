"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { accountPublicCopy } from "../../lib/commerce/account";
import { LocaleSwitcher } from "./LocaleSwitcher";

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  window.localStorage.setItem("gummy-theme", next);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="site-header">
      <Link className="site-brand" href="/" aria-label="Gummy UI home">
        <span className="site-brand__mark" aria-hidden="true">g</span>
        <span>Gummy UI</span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/docs">Docs</Link>
        <Link href="/components">Components</Link>
        <Link href="/themes">Themes</Link>
        <Link href="/studio">Studio</Link>
        <Link href="/community">Community</Link>
        <Link href="/blog">Articles</Link>
        <Link href="/registry">Registry</Link>
        <Link href="/pro">Pro</Link>
      </nav>
      <div className="site-header__actions">
        <Link className="site-account-link" href="/sign-in">
          {accountPublicCopy.publicNavigation.header}
        </Link>
        <LocaleSwitcher currentPath={pathname} />
        <button className="site-theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle light and dark theme">
          <span aria-hidden="true">◐</span>
          <span>Theme</span>
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <span className="site-brand__mark" aria-hidden="true">g</span>
        <strong>Gummy UI</strong>
      </div>
      <p>Open-source React components with tactile material, accessible behavior, and editable source.</p>
      <nav aria-label="Footer navigation">
        <Link href="/docs">Docs</Link>
        <Link href="/docs/nextjs">Next.js</Link>
        <Link href="/docs/vite">Vite</Link>
        <Link href="/docs/editor-setup">Editor setup</Link>
        <Link href="/docs/troubleshooting">Troubleshooting</Link>
        <Link href="/components">Components</Link>
        <Link href="/registry">Registry</Link>
        <Link href="/themes">Themes</Link>
        <Link href="/studio">Frame studio</Link>
        <Link href="/community">Community</Link>
        <Link href="/blog">Articles</Link>
        <a href="/rss.xml">RSS</a>
        <a href="/changelog.xml">Changelog RSS</a>
        <Link href="/rtl">RTL</Link>
        <Link href="/pro">Pro status</Link>
        <Link href="/accessibility">Accessibility</Link>
        <Link href="/locales">Languages</Link>
        <Link href="/security">Security</Link>
        <Link href="/support">Support</Link>
        <Link href="/sign-in">{accountPublicCopy.publicNavigation.footer}</Link>
        <Link href="/contact">Contact status</Link>
        <Link href="/refund">Refund status</Link>
        <Link href="/commercial-license">Pro licence status</Link>
        <Link href="/design-kit">Design kit status</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms status</Link>
        <Link href="/license">MIT licence</Link>
      </nav>
    </footer>
  );
}
