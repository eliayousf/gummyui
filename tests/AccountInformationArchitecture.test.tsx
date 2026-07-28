import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountSection } from "../app/account/_components/AccountSection";
import { AccountShell } from "../app/account/_components/AccountShell";
import { metadata as checkoutMetadata } from "../app/checkout/page";
import { metadata as signInMetadata } from "../app/sign-in/page";
import {
  accountNavigation,
  createAccountSectionView,
  opaqueId,
} from "../lib/commerce";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
}));

const routeFiles = [
  "app/account/page.tsx",
  "app/account/purchases/page.tsx",
  "app/account/licences/page.tsx",
  "app/account/downloads/page.tsx",
  "app/account/billing/page.tsx",
  "app/account/team/page.tsx",
  "app/account/team/members/page.tsx",
  "app/account/team/invitations/page.tsx",
  "app/account/profile/page.tsx",
  "app/account/security/page.tsx",
  "app/account/privacy/page.tsx",
  "app/account/privacy/export/page.tsx",
  "app/account/privacy/deletion/page.tsx",
] as const;

describe("account and commerce information architecture", () => {
  it("provides every source-safe account route and navigation target", async () => {
    for (const file of routeFiles) {
      await expect(access(path.join(process.cwd(), file))).resolves.toBeUndefined();
    }
    expect(accountNavigation.map(({ href }) => href)).toEqual([
      "/account",
      "/account/purchases",
      "/account/licences",
      "/account/downloads",
      "/account/billing",
      "/account/team",
      "/account/team/members",
      "/account/team/invitations",
      "/account/profile",
      "/account/security",
      "/account/privacy",
      "/account/privacy/export",
      "/account/privacy/deletion",
    ]);
  });

  it("marks account, sign-in and checkout surfaces noindex and robots-disallowed", async () => {
    expect(signInMetadata.robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
      noarchive: true,
    });
    expect(checkoutMetadata.robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
      noarchive: true,
    });
    const accountLayout = await readFile(
      path.join(process.cwd(), "app/account/layout.tsx"),
      "utf8",
    );
    expect(accountLayout).toContain("noarchive: true");
    const robotRules = JSON.stringify(robots());
    for (const pathValue of ["/sign-in", "/account", "/checkout", "/downloads/"]) {
      expect(robotRules).toContain(pathValue);
    }
    const sitemapUrls = new Set(sitemap().map(({ url }) => new URL(url).pathname));
    for (const pathValue of ["/sign-in", "/account", "/checkout"]) {
      expect(sitemapUrls.has(pathValue)).toBe(false);
    }
  });

  it("does not render protected children while services are unavailable", () => {
    render(
      <AccountShell
        access={{ status: "unavailable", reason: "provider_not_configured" }}
      >
        <p>Fake authenticated customer</p>
      </AccountShell>,
    );
    expect(
      screen.getByRole("heading", { name: "Account services are unavailable." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Fake authenticated customer")).not.toBeInTheDocument();
  });

  it("keeps the production server-access resolver explicitly unavailable", async () => {
    const source = await readFile(
      path.join(process.cwd(), "lib/commerce/server-access.ts"),
      "utf8",
    );
    expect(source).toContain('status: "unavailable"');
    expect(source).toContain('reason: "provider_not_configured"');
    expect(source).not.toMatch(/acct:test|workspace:test|LocalIdentityProvider/u);
  });

  it("renders representative server-derived states without making them production defaults", () => {
    render(
      <AccountSection
        view={createAccountSectionView("licences", [
          {
            id: "licence:opaque:001",
            label: "Configured product",
            value: "Active",
            detail: "Current server projection",
            status: "active",
          },
          {
            id: "seat:opaque:002",
            label: "Assigned seat",
            value: "Revoked",
            status: "revoked",
          },
        ])}
      />,
    );
    expect(screen.getByRole("heading", { name: "Licences" })).toBeInTheDocument();
    expect(screen.getByText("Current server projection")).toBeInTheDocument();
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });

  it("can render authenticated children only from an explicit server access result", () => {
    render(
      <AccountShell
        access={{
          status: "authenticated",
          accountId: opaqueId("acct:test:authenticated", "account"),
          workspaceId: opaqueId("workspace:test:authenticated", "workspace"),
          workspaceLabel: "Test workspace",
          role: "member",
          sessionExpiresAt: 1_900_000_000_000,
        }}
      >
        <p>Server-authorized child</p>
      </AccountShell>,
    );
    expect(screen.getByText("Server-authorized child")).toBeInTheDocument();
    expect(screen.getByText("Test workspace")).toBeInTheDocument();
  });
});
