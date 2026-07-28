import "server-only";
import { executeConvex } from "../../db";
import {
  createAccountSectionView,
  type AccountRouteKey,
  type AccountSectionView,
  type AccountStatusItem,
  type ServerAccountAccess,
} from "./account";

type AuthenticatedAccess = Extract<
  ServerAccountAccess,
  { status: "authenticated" }
>;

export async function loadAccountSectionView(
  route: AccountRouteKey,
  access: AuthenticatedAccess,
  now = Date.now(),
): Promise<AccountSectionView> {
  const items = await executeConvex<AccountStatusItem[]>("account.section", {
    route,
    access,
    now,
  });
  return {
    ...createAccountSectionView(route, items),
    action: routeAction(route, access),
  };
}

function routeAction(
  route: AccountRouteKey,
  access: AuthenticatedAccess,
): AccountSectionView["action"] {
  switch (route) {
    case "billing":
      return {
        href: "/api/billing-portal",
        label: "Manage billing through Link",
      };
    case "security":
      return { href: "/auth/sign-out", label: "Sign out" };
    case "team":
      return String(access.workspaceId).startsWith(
        "workspace:workos-personal:",
      )
        ? {
            href: "/api/team/workspaces",
            label: "Create a team workspace",
            kind: "create-workspace",
          }
        : undefined;
    case "invitations":
      return (
        !String(access.workspaceId).startsWith(
          "workspace:workos-personal:",
        )
        && ["owner", "admin"].includes(access.role)
      )
        ? {
            href: "/api/team/invitations",
            label: "Invite a member",
            kind: "invite-member",
          }
        : undefined;
    case "data-export":
      return {
        href: "/api/privacy/exports",
        label: "Create data export",
        kind: "create-export",
      };
    case "deletion":
      return {
        href: "/api/privacy/deletions",
        label: "Request account deletion",
        kind: "request-deletion",
      };
    default:
      return undefined;
  }
}
