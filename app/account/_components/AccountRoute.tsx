import {
  createAccountSectionView,
  type AccountRouteKey,
} from "../../../lib/commerce/account";
import { loadAccountSectionView } from "../../../lib/commerce/account-convex";
import { resolveServerAccountAccess } from
  "../../../lib/commerce/server-access";
import { AccountSection } from "./AccountSection";

export async function AccountRoute({ route }: { route: AccountRouteKey }) {
  const access = await resolveServerAccountAccess();
  if (access.status !== "authenticated") {
    return <AccountSection view={createAccountSectionView(route)} />;
  }
  let view;
  try {
    view = await loadAccountSectionView(route, access);
  } catch {
    view = createAccountSectionView(route);
  }
  return <AccountSection view={view} />;
}
