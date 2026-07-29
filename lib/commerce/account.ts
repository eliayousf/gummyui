import type { ReactNode } from "react";
import type { AccountId, WorkspaceId, WorkspaceRole } from "./model";

export type AccountRouteKey =
  | "overview"
  | "purchases"
  | "licences"
  | "downloads"
  | "billing"
  | "team"
  | "members"
  | "invitations"
  | "profile"
  | "security"
  | "privacy"
  | "data-export"
  | "deletion";

export type ServerAccountAccess =
  | {
      status: "unavailable";
      reason: "provider_not_configured" | "service_unavailable";
    }
  | { status: "signed_out" }
  | {
      status: "authenticated";
      accountId: AccountId;
      workspaceId: WorkspaceId;
      workspaceLabel: string;
      role: WorkspaceRole;
      sessionExpiresAt: number;
    };

export interface AccountStatusItem {
  id: string;
  label: string;
  value: string;
  detail?: string;
  status?: "neutral" | "active" | "attention" | "revoked";
  href?: string;
  downloadReleaseId?: string;
  cancelDeletionId?: string;
}

export interface AccountSectionView {
  key: AccountRouteKey;
  eyebrow: string;
  title: string;
  description: string;
  items: readonly AccountStatusItem[];
  emptyMessage: string;
  action?: {
    href: string;
    label: string;
    kind?:
      | "link"
      | "create-export"
      | "request-deletion"
      | "create-workspace"
      | "invite-member";
  };
  aside?: ReactNode;
}

export const accountNavigation: ReadonlyArray<{
  key: AccountRouteKey;
  href: string;
  label: string;
}> = [
  { key: "overview", href: "/account", label: "Overview" },
  { key: "purchases", href: "/account/purchases", label: "Purchases" },
  { key: "licences", href: "/account/licences", label: "Licences" },
  { key: "downloads", href: "/account/downloads", label: "Downloads" },
  { key: "billing", href: "/account/billing", label: "Billing" },
  { key: "team", href: "/account/team", label: "Team" },
  { key: "members", href: "/account/team/members", label: "Members" },
  {
    key: "invitations",
    href: "/account/team/invitations",
    label: "Invitations",
  },
  { key: "profile", href: "/account/profile", label: "Profile" },
  { key: "security", href: "/account/security", label: "Security" },
  { key: "privacy", href: "/account/privacy", label: "Privacy" },
  {
    key: "data-export",
    href: "/account/privacy/export",
    label: "Data export",
  },
  {
    key: "deletion",
    href: "/account/privacy/deletion",
    label: "Deletion",
  },
];

export const accountPublicCopy = {
  shell: {
    skipLink: "Skip to account content",
    label: "Account",
    navigationLabel: "Account navigation",
    secureWorkspace: "Secure workspace",
    emptyHeading: "Nothing to show",
    metadataTitle: "Account · Gummy UI",
    metadataTemplate: "%s · Gummy UI account",
    metadataDescription:
      "Private Gummy UI account, workspace, purchase, licence, billing, download, team, security, and data-operation surfaces.",
  },
  signedOut: {
    eyebrow: "Server authorization required",
    title: "Sign in to continue.",
    description:
      "Account data is never loaded from browser-only entitlement state. Continue through the server-controlled sign-in surface.",
    action: "Open sign-in",
  },
  unavailable: {
    eyebrow: "Not connected",
    title: "Account services are unavailable.",
    description:
      "Production sign-in infrastructure is connected for verification, but billing, licences and protected downloads are not yet available to customers. No paid access is implied by this route.",
    proAction: "View Pro status",
    supportAction: "Open support guidance",
  },
  signIn: {
    metadataTitle: "Secure account sign-in · Gummy UI",
    metadataDescription:
      "Use Gummy UI's server-verified sign-in flow to access available account, workspace, team, privacy, purchase, licence, billing, and download services.",
    eyebrow: "Account access",
    title: "Secure customer sign-in.",
    lede:
      "Continue through the protected sign-in flow to reach your purchases, licences, billing and downloads.",
    sections: [
      {
        title: "Continue securely",
        body:
          "Your account is verified on the server. If production account services are unavailable, the sign-in route stays safely closed.",
        action: "Continue to secure sign-in",
      },
      {
        title: "Public product",
        body:
          "The open-source catalogue remains available independently of account services.",
        action: "Browse components",
      },
    ],
  },
  checkout: {
    metadataTitle: "Checkout status · Gummy UI",
    metadataDescription:
      "Gummy UI monthly, yearly and lifetime USD prices and commercial terms are approved; checkout remains unavailable until Stripe and entitlement operations are production-verified.",
    eyebrow: "Checkout unavailable",
    title: "No purchase can be started.",
    lede:
      "The Individual, Team and Organization monthly, yearly and lifetime prices are approved, but no production billing customer, checkout or payment collection is active. A browser redirect will never be treated as proof of access.",
    sections: [
      {
        title: "Why this route is closed",
        body:
          "Checkout remains unavailable until Stripe Managed Payments eligibility, the verified webhook projection, immediate-digital-supply consent, licence entitlements, release delivery, email, refunds and support operations pass together.",
      },
      {
        title: "Current public status",
        body: "The price book is approved. Paid files are not release-ready or purchasable yet.",
        action: "View approved pricing",
      },
    ],
  },
  publicNavigation: {
    header: "Account",
    footer: "Account status",
  },
} as const;

export const accountSectionDefinitions: Record<
  AccountRouteKey,
  Omit<AccountSectionView, "items">
> = {
  overview: {
    key: "overview",
    eyebrow: "Account",
    title: "Workspace overview",
    description:
      "A server-authorized summary of current membership, access, and account operations.",
    emptyMessage:
      "No account summary is available without a current verified session and workspace membership.",
  },
  purchases: {
    key: "purchases",
    eyebrow: "Commerce",
    title: "Purchases",
    description:
      "Completed and adjusted purchase projections appear here only after verified billing events.",
    emptyMessage: "No verified purchase projection is available.",
  },
  licences: {
    key: "licences",
    eyebrow: "Access",
    title: "Licences",
    description:
      "Current licence state, subscription or lifetime update window, and assigned seats are derived on the server.",
    emptyMessage: "No current licence projection is available.",
  },
  downloads: {
    key: "downloads",
    eyebrow: "Protected files",
    title: "Downloads",
    description:
      "Eligible releases require a fresh server authorization and a short-lived one-use grant.",
    emptyMessage: "No authorized release is available for download.",
  },
  billing: {
    key: "billing",
    eyebrow: "Billing",
    title: "Billing",
    description:
      "Invoices and billing-management handoffs remain owned by the approved billing provider.",
    emptyMessage: "No verified billing-customer projection is available.",
  },
  team: {
    key: "team",
    eyebrow: "Workspace",
    title: "Team",
    description:
      "Workspace access is based on current provider membership and the reconciled local projection.",
    emptyMessage: "No current team projection is available.",
  },
  members: {
    key: "members",
    eyebrow: "Workspace",
    title: "Members",
    description:
      "Current member roles and seat assignments are rechecked before privileged operations.",
    emptyMessage: "No current members can be shown.",
  },
  invitations: {
    key: "invitations",
    eyebrow: "Workspace",
    title: "Invitations",
    description:
      "Pending and completed invitations appear only from the approved identity system.",
    emptyMessage: "No current invitations can be shown.",
  },
  profile: {
    key: "profile",
    eyebrow: "Account",
    title: "Profile",
    description:
      "Only product-owned profile preferences belong here; identity truth remains with the identity provider.",
    emptyMessage: "No verified profile projection is available.",
  },
  security: {
    key: "security",
    eyebrow: "Account",
    title: "Security",
    description:
      "Session and membership security state is read from current server-side evidence.",
    emptyMessage: "Security controls are unavailable without a verified session.",
  },
  privacy: {
    key: "privacy",
    eyebrow: "Account data",
    title: "Privacy",
    description:
      "Consent history, export requests, and deletion requests use explicit audited states.",
    emptyMessage: "No account privacy projection is available.",
  },
  "data-export": {
    key: "data-export",
    eyebrow: "Account data",
    title: "Data export",
    description:
      "Exports are stateful, integrity-checked, short-lived operations created only for a verified account.",
    emptyMessage: "No data export has been requested.",
  },
  deletion: {
    key: "deletion",
    eyebrow: "Account data",
    title: "Deletion",
    description:
      "Deletion progresses through verification, retention, and legal-hold checks before completion.",
    emptyMessage: "No deletion request is active.",
  },
};

export function createAccountSectionView(
  key: AccountRouteKey,
  items: readonly AccountStatusItem[] = [],
): AccountSectionView {
  return {
    ...accountSectionDefinitions[key],
    items: items.map((item) => ({ ...item })),
  };
}
