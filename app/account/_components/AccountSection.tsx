import Link from "next/link";
import {
  accountPublicCopy,
  type AccountSectionView,
} from "../../../lib/commerce/account";
import { DownloadGrantButton } from "./DownloadGrantButton";
import {
  AccountPrivacyAction,
  CancelDeletionButton,
} from "./AccountPrivacyAction";
import { AccountTeamAction } from "./AccountTeamAction";

export function AccountSection({ view }: { view: AccountSectionView }) {
  return (
    <section className="account-section" aria-labelledby={`${view.key}-title`}>
      <header className="account-section__header">
        <p className="showcase-kicker">{view.eyebrow}</p>
        <h1 id={`${view.key}-title`}>{view.title}</h1>
        <p>{view.description}</p>
      </header>
      {view.items.length ? (
        <ul className="account-status-list">
          {view.items.map((item) => (
            <li key={item.id} data-status={item.status ?? "neutral"}>
              <div>
                <span>{item.label}</span>
                {item.detail ? <small>{item.detail}</small> : null}
              </div>
              {item.downloadReleaseId
                ? (
                    <DownloadGrantButton
                      releaseId={item.downloadReleaseId}
                    />
                  )
                : item.cancelDeletionId
                ? (
                    <CancelDeletionButton
                      deletionId={item.cancelDeletionId}
                    />
                  )
                : item.href
                ? <Link href={item.href}>{item.value}</Link>
                : <strong>{item.value}</strong>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="account-empty">
          <strong>{accountPublicCopy.shell.emptyHeading}</strong>
          <p>{view.emptyMessage}</p>
        </div>
      )}
      {view.action ? (
        view.action.kind === "create-export"
        || view.action.kind === "request-deletion"
          ? (
              <AccountPrivacyAction
                href={view.action.href}
                label={view.action.label}
                kind={view.action.kind}
              />
            )
          : view.action.kind === "create-workspace"
          || view.action.kind === "invite-member"
          ? (
              <AccountTeamAction
                href={view.action.href}
                label={view.action.label}
                kind={view.action.kind}
              />
            )
          : (
              <Link className="account-action" href={view.action.href}>
                {view.action.label}
              </Link>
            )
      ) : null}
      {view.aside}
    </section>
  );
}
