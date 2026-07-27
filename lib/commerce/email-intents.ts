export const providerOwnedEmailBoundaries = [
  "authentication codes and sign-in links",
  "identity recovery and session notices",
  "invoices and receipts",
  "payment-method and billing-portal messages",
  "billing-provider dunning and payment recovery",
] as const;

interface BaseEmailIntent {
  recipientRef: string;
  accountPath: string;
}

export type ProductEmailIntentInput =
  | (BaseEmailIntent & {
      kind: "release_access";
      workspaceRef: string;
      releaseRef: string;
    })
  | (BaseEmailIntent & {
      kind: "invitation_follow_up";
      workspaceRef: string;
    })
  | (BaseEmailIntent & {
      kind: "security_notice";
      eventRef: string;
    })
  | (BaseEmailIntent & {
      kind: "data_export";
      state: "ready" | "expired" | "failed";
      exportRef: string;
    })
  | (BaseEmailIntent & {
      kind: "data_deletion";
      state: "verified" | "blocked" | "completed" | "cancelled";
      deletionRef: string;
    })
  | (BaseEmailIntent & {
      kind: "refund_workflow";
      state: "received" | "processing" | "completed" | "failed";
      adjustmentRef: string;
    })
  | (BaseEmailIntent & {
      kind: "access_recovery";
      state: "restored" | "still_unavailable";
      eventRef: string;
    });

export interface ProductEmailIntent {
  category: ProductEmailIntentInput["kind"];
  templateRef: string;
  recipientRef: string;
  subject: string;
  text: string;
  actionPath: string;
  variables: Readonly<Record<string, string>>;
}

export function createProductEmailIntent(
  input: ProductEmailIntentInput,
): ProductEmailIntent {
  validateBase(input);
  switch (input.kind) {
    case "release_access":
      return intent(input, {
        subject: "A release is available in your Gummy UI account",
        text:
          "A release is listed for your workspace. Sign in to re-check current membership, licence, seat, entitlement, and release access before downloading.",
        variables: {
          workspaceRef: input.workspaceRef,
          releaseRef: input.releaseRef,
        },
      });
    case "invitation_follow_up":
      return intent(input, {
        subject: "A workspace invitation is still pending",
        text:
          "A workspace invitation remains pending. Sign in through the account surface to view its current status. This message is not an authentication link.",
        variables: { workspaceRef: input.workspaceRef },
      });
    case "security_notice":
      return intent(input, {
        subject: "Review an account security event",
        text:
          "A product-owned account security event was recorded. Sign in to review current server-verified account state.",
        variables: { eventRef: input.eventRef },
      });
    case "data_export":
      return intent(input, {
        subject: "Your account data export status changed",
        text:
          "Your account data export has a new status. Sign in to view the current audited state and any available next action.",
        variables: {
          exportRef: input.exportRef,
          state: input.state,
        },
      });
    case "data_deletion":
      return intent(input, {
        subject: "Your account deletion status changed",
        text:
          "Your account deletion request has a new status. Sign in to view the current audited state, including any configured retention blocker.",
        variables: {
          deletionRef: input.deletionRef,
          state: input.state,
        },
      });
    case "refund_workflow":
      return intent(input, {
        subject: "A refund workflow status changed",
        text:
          "A refund workflow record has a new status. Sign in to review the current billing projection. This message does not promise settlement timing.",
        variables: {
          adjustmentRef: input.adjustmentRef,
          state: input.state,
        },
      });
    case "access_recovery":
      return intent(input, {
        subject: "Your product access status changed",
        text:
          "A product access recovery check has completed. Sign in to re-check current membership, licence, seat, entitlement, and release state.",
        variables: {
          eventRef: input.eventRef,
          state: input.state,
        },
      });
    default:
      return assertNever(input);
  }
}

function intent(
  input: ProductEmailIntentInput,
  content: {
    subject: string;
    text: string;
    variables: Readonly<Record<string, string>>;
  },
): ProductEmailIntent {
  return {
    category: input.kind,
    templateRef: `product.${input.kind.replaceAll("_", "-")}.v1`,
    recipientRef: input.recipientRef,
    subject: content.subject,
    text: `${content.text}\n\nOpen account: ${input.accountPath}`,
    actionPath: input.accountPath,
    variables: content.variables,
  };
}

function validateBase(input: BaseEmailIntent): void {
  if (!input.recipientRef || input.recipientRef.length > 255) {
    throw new Error("Invalid opaque email recipient reference");
  }
  if (
    !input.accountPath.startsWith("/account")
    || input.accountPath.startsWith("//")
    || /[\r\n]/u.test(input.accountPath)
  ) {
    throw new Error("Email action must be a same-origin account path");
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported product email intent: ${String(value)}`);
}
