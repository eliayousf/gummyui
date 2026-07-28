import "server-only";
import { WorkOS } from "@workos-inc/node";
import { executeConvex } from "../../db";

const MAX_ATTEMPTS = 8;
const INITIAL_BACKOFF_MS = 60 * 1_000;
const MAX_BACKOFF_MS = 2 * 60 * 60 * 1_000;

export interface ResendOutboxConfig {
  resendApiKey: string;
  workosApiKey: string;
  from: string;
  replyTo: string;
  applicationOrigin: string;
}

interface ClaimedOutboxMessage {
  id: string;
  deduplicationKey: string;
  topic: string;
  aggregateType: string;
  aggregateId: string;
  payload: string;
  payloadHash: string;
  attempts: number;
  userId: string | null;
}

interface EmailContent {
  subject: string;
  text: string;
  actionPath: string;
}

interface DeliveryFailure {
  retryable: boolean;
  code: string;
}

type DeliveryResult =
  | { accepted: true; providerMessageId: string }
  | { accepted: false; failure: DeliveryFailure };

export function readResendOutboxConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ResendOutboxConfig | null {
  const resendApiKey = environment.RESEND_API_KEY?.trim();
  const workosApiKey = environment.WORKOS_API_KEY?.trim();
  const from = environment.RESEND_FROM_EMAIL?.trim();
  const replyTo =
    environment.RESEND_REPLY_TO_EMAIL?.trim()
    ?? environment.SUPPORT_EMAIL?.trim();
  const originValue = environment.GUMMYUI_ORIGIN?.trim();
  if (!resendApiKey && !workosApiKey && !from && !replyTo) {
    return null;
  }
  if (
    !resendApiKey
    || !workosApiKey
    || !from
    || !replyTo
    || !originValue
    || !/^re_[A-Za-z0-9_]+$/.test(resendApiKey)
    || !/^sk_(?:test|live)_[A-Za-z0-9]+$/.test(workosApiKey)
    || !validMailbox(from, true)
    || !validMailbox(replyTo, false)
  ) {
    throw new Error("Invalid transactional email configuration");
  }
  return {
    resendApiKey,
    workosApiKey,
    from,
    replyTo,
    applicationOrigin: normalizeOrigin(originValue),
  };
}

export class ResendOutboxWorker {
  constructor(
    private readonly config: ResendOutboxConfig,
    private readonly fetcher: typeof fetch = fetch,
    private readonly workos = new WorkOS(config.workosApiKey),
  ) {}

  async drain(now = Date.now()): Promise<{
    claimed: number;
    accepted: number;
    deferred: number;
    deadLettered: number;
  }> {
    const messages = await claimOutboxMessages(now);
    let accepted = 0;
    let deferred = 0;
    let deadLettered = 0;

    for (const message of messages) {
      const result = await this.deliver(message);
      if (result.accepted) {
        await markAccepted(
          message,
          result.providerMessageId,
          Date.now(),
        );
        accepted += 1;
        continue;
      }
      const { failure } = result;
      const deadLetter = !failure.retryable
        || message.attempts >= MAX_ATTEMPTS;
      await markFailed(message, failure, Date.now(), deadLetter);
      if (deadLetter) {
        deadLettered += 1;
      } else {
        deferred += 1;
      }
    }

    return {
      claimed: messages.length,
      accepted,
      deferred,
      deadLettered,
    };
  }

  private async deliver(
    message: ClaimedOutboxMessage,
  ): Promise<DeliveryResult> {
    if (await sha256Hex(message.payload) !== message.payloadHash) {
      return failure(false, "payload_integrity_failed");
    }
    const content = emailContentForTopic(message.topic);
    if (!content) {
      return failure(false, "unsupported_email_topic");
    }

    let recipient: string;
    try {
      const userId = await resolveWorkOSUserId(message);
      if (!userId) {
        return failure(false, "recipient_not_found");
      }
      const user = await this.workos.userManagement.getUser(userId);
      recipient = user.email.trim().toLowerCase();
      if (!validMailbox(recipient, false)) {
        return failure(false, "recipient_invalid");
      }
    } catch (error) {
      return {
        accepted: false,
        failure: providerFailure(error, "identity_unavailable"),
      };
    }

    const actionUrl = new URL(
      content.actionPath,
      this.config.applicationOrigin,
    ).toString();
    let response: Response;
    try {
      response = await this.fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.resendApiKey}`,
          "content-type": "application/json",
          "idempotency-key": message.deduplicationKey,
        },
        body: JSON.stringify({
          from: this.config.from,
          to: [recipient],
          reply_to: this.config.replyTo,
          subject: content.subject,
          text: `${content.text}\n\nOpen your account: ${actionUrl}`,
          html: renderHtml(content, actionUrl),
          tags: [
            { name: "product", value: "gummy-ui" },
            {
              name: "topic",
              value: message.topic.replaceAll(".", "-").slice(0, 256),
            },
          ],
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return failure(true, "email_network_unavailable");
    }
    if (response.ok) {
      const body = await response.json().catch(() => null) as
        | { id?: unknown }
        | null;
      return typeof body?.id === "string"
        && /^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u.test(body.id)
        ? { accepted: true, providerMessageId: body.id }
        : failure(true, "email_response_invalid");
    }
    return failure(
        response.status === 408
        || response.status === 409
        || response.status === 429
        || response.status >= 500,
        `email_http_${response.status}`,
    );
  }
}

async function claimOutboxMessages(
  now: number,
): Promise<ClaimedOutboxMessage[]> {
  return executeConvex("email.outbox.claim", { now });
}

async function resolveWorkOSUserId(
  message: ClaimedOutboxMessage,
): Promise<string | null> {
  return message.userId
    && /^[A-Za-z0-9_-]{6,127}$/u.test(message.userId)
    ? message.userId
    : null;
}

async function markAccepted(
  message: ClaimedOutboxMessage,
  providerMessageId: string,
  now: number,
): Promise<void> {
  await executeConvex("email.outbox.accepted", {
    id: message.id,
    attempts: message.attempts,
    providerMessageId,
    now,
  });
}

async function markFailed(
  message: ClaimedOutboxMessage,
  failure: DeliveryFailure,
  now: number,
  deadLetter: boolean,
): Promise<void> {
  const nextAttemptAt = deadLetter
    ? null
    : now + Math.min(
        MAX_BACKOFF_MS,
        INITIAL_BACKOFF_MS * 2 ** Math.max(0, message.attempts - 1),
      );
  await executeConvex("email.outbox.failed", {
    id: message.id,
    attempts: message.attempts,
    code: failure.code,
    deadLetter,
    nextAttemptAt,
    now,
  });
}

function emailContentForTopic(topic: string): EmailContent | null {
  switch (topic) {
    case "commerce.purchase.access":
      return {
        subject: "Your Gummy UI Pro access is ready",
        text:
          "Your payment is confirmed and your paid releases are now available. Sign in to create a fresh protected download link.",
        actionPath: "/account/downloads",
      };
    case "commerce.subscription.renewed":
      return {
        subject: "Your Gummy UI Pro access has renewed",
        text:
          "Your subscription remains active and your update window has been extended. Stripe provides the billing receipt.",
        actionPath: "/account/billing",
      };
    case "commerce.subscription.payment_failed":
      return {
        subject: "Your Gummy UI Pro access is paused",
        text:
          "Stripe could not confirm the latest subscription payment, so paid downloads are paused. Open Link from your Gummy UI billing page to review the payment state.",
        actionPath: "/account/billing",
      };
    case "commerce.subscription.cancellation_scheduled":
      return {
        subject: "Your Gummy UI Pro cancellation is scheduled",
        text:
          "Your subscription is set not to renew. Current access continues until the paid period shown in your account ends.",
        actionPath: "/account/billing",
      };
    case "commerce.subscription.ended":
      return {
        subject: "Your Gummy UI Pro subscription has ended",
        text:
          "Your subscription has ended and access to future paid downloads is no longer active.",
        actionPath: "/account/licences",
      };
    case "commerce.subscription.paused":
      return {
        subject: "Your Gummy UI Pro subscription is paused",
        text:
          "Your subscription and paid downloads are currently paused. Review the current billing state in your account.",
        actionPath: "/account/billing",
      };
    case "commerce.subscription.resumed":
      return {
        subject: "Your Gummy UI Pro access is active again",
        text:
          "Stripe confirms that your subscription resumed. Sign in to re-check current protected download access.",
        actionPath: "/account/downloads",
      };
    case "commerce.refund.updated":
      return {
        subject: "Your Gummy UI refund status changed",
        text:
          "Your refund or payment-dispute record changed. Sign in to see the current billing and licence state. Stripe controls settlement timing.",
        actionPath: "/account/purchases",
      };
    case "privacy.data_export.updated":
      return {
        subject: "Your Gummy UI data export status changed",
        text:
          "Your account data export has a new status. Sign in to view the current audited state.",
        actionPath: "/account/privacy/export",
      };
    case "privacy.data_deletion.updated":
      return {
        subject: "Your Gummy UI deletion request status changed",
        text:
          "Your account deletion request has a new status. Sign in to review the current state and any legally required retention.",
        actionPath: "/account/privacy/deletion",
      };
    case "privacy.data_deletion.completing":
      return {
        subject: "Your Gummy UI account deletion is completing",
        text:
          "The cancellation period has ended and your verified account deletion is now completing. This is the final product email for this account; sign-in will stop when deletion finishes. Legally required transaction records remain restricted for the stated retention period.",
        actionPath: "/account/privacy/deletion",
      };
    default:
      return null;
  }
}

function providerFailure(error: unknown, fallback: string): DeliveryFailure {
  const status =
    error && typeof error === "object"
      ? Number((error as { status?: unknown }).status)
      : Number.NaN;
  return {
    retryable:
      !Number.isFinite(status)
      || status === 408
      || status === 409
      || status === 429
      || status >= 500,
    code: Number.isFinite(status) ? `${fallback}_${status}` : fallback,
  };
}

function failure(retryable: boolean, code: string): DeliveryResult {
  return {
    accepted: false,
    failure: { retryable, code },
  };
}

function renderHtml(content: EmailContent, actionUrl: string): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#181511"><h1>${escapeHtml(content.subject)}</h1><p>${escapeHtml(content.text)}</p><p><a href="${escapeHtml(actionUrl)}">Open your Gummy UI account</a></p><p>Need help? Reply to this email.</p></body></html>`;
}

function validMailbox(value: string, allowDisplayName: boolean): boolean {
  if (
    value.length > 254
    || /[\r\n\u0000]/u.test(value)
  ) {
    return false;
  }
  const mailbox = allowDisplayName && value.includes("<")
    ? value.match(/^[^<>]{1,100}<([^<>]+)>$/u)?.[1]?.trim()
    : value;
  return Boolean(
    mailbox
    && /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/iu
      .test(mailbox),
  );
}

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  const local =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    || url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash
  ) {
    throw new Error("Invalid Gummy UI application origin");
  }
  return url.origin;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
