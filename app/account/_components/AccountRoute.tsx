import {
  createAccountSectionView,
  type AccountRouteKey,
} from "../../../lib/commerce/account";
import { AccountSection } from "./AccountSection";

export function AccountRoute({ route }: { route: AccountRouteKey }) {
  return <AccountSection view={createAccountSectionView(route)} />;
}
