import { describe, expect, it } from "vitest";
import {
  createProductEmailIntent,
  providerOwnedEmailBoundaries,
  type ProductEmailIntentInput,
} from "../lib/commerce";

const cases: ProductEmailIntentInput[] = [
  {
    kind: "release_access",
    recipientRef: "recipient:opaque:001",
    accountPath: "/account/downloads",
    workspaceRef: "workspace:opaque:001",
    releaseRef: "release:opaque:001",
  },
  {
    kind: "invitation_follow_up",
    recipientRef: "recipient:opaque:001",
    accountPath: "/account/team/invitations",
    workspaceRef: "workspace:opaque:001",
  },
  {
    kind: "security_notice",
    recipientRef: "recipient:opaque:001",
    accountPath: "/account/security",
    eventRef: "event:opaque:001",
  },
  {
    kind: "data_export",
    recipientRef: "recipient:opaque:001",
    accountPath: "/account/privacy/export",
    exportRef: "export:opaque:001",
    state: "ready",
  },
  {
    kind: "data_deletion",
    recipientRef: "recipient:opaque:001",
    accountPath: "/account/privacy/deletion",
    deletionRef: "deletion:opaque:001",
    state: "blocked",
  },
  {
    kind: "refund_workflow",
    recipientRef: "recipient:opaque:001",
    accountPath: "/account/purchases",
    adjustmentRef: "adjustment:opaque:001",
    state: "processing",
  },
  {
    kind: "access_recovery",
    recipientRef: "recipient:opaque:001",
    accountPath: "/account/downloads",
    eventRef: "event:opaque:002",
    state: "restored",
  },
];

describe("product-owned email intents", () => {
  it.each(cases)("builds source-safe $kind copy", (input) => {
    const result = createProductEmailIntent(input);
    expect(result.category).toBe(input.kind);
    expect(result.templateRef).toMatch(/^product\..+\.v1$/u);
    expect(result.actionPath.startsWith("/account")).toBe(true);
    expect(result.text).not.toMatch(
      /\b(?:guarantee|within \d+|instant|immediately refunded)\b/iu,
    );
  });

  it("keeps authentication and provider billing email outside product templates", () => {
    expect(providerOwnedEmailBoundaries).toEqual(
      expect.arrayContaining([
        "authentication codes and sign-in links",
        "invoices and receipts",
        "billing-provider dunning and payment recovery",
      ]),
    );
  });

  it("rejects an off-origin email action", () => {
    expect(() =>
      createProductEmailIntent({
        ...cases[0],
        accountPath: "https://attacker.invalid/account",
      })).toThrow("same-origin account path");
  });
});
