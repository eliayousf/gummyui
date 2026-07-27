export type OutboxStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed"
  | "dead_letter";

export interface OutboxState {
  id: string;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: number | null;
  deliveredAt: number | null;
  lastErrorCode: string | null;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}

export type DeliveryResult =
  | { delivered: true; providerMessageRef: string }
  | { delivered: false; retryable: boolean; errorCode: string };

export interface DeadLetterRecord {
  sourceType: "outbox";
  sourceId: string;
  reasonCode: string;
  attempts: number;
  firstSeenAt: number;
}

export function startOutboxAttempt(
  state: OutboxState,
  now: number,
): OutboxState {
  if (
    (state.status !== "pending" && state.status !== "failed")
    || (state.nextAttemptAt !== null && state.nextAttemptAt > now)
  ) {
    throw new Error("Outbox message is not ready for delivery");
  }
  return {
    ...state,
    status: "processing",
    attempts: state.attempts + 1,
    nextAttemptAt: null,
  };
}

export function finishOutboxAttempt(
  state: OutboxState,
  result: DeliveryResult,
  now: number,
  policy: RetryPolicy,
): { state: OutboxState; deadLetter: DeadLetterRecord | null } {
  validatePolicy(policy);
  if (state.status !== "processing" || state.attempts <= 0) {
    throw new Error("Outbox message has no active delivery attempt");
  }
  if (result.delivered) {
    if (!result.providerMessageRef) {
      throw new Error("Missing provider message reference");
    }
    return {
      state: {
        ...state,
        status: "delivered",
        deliveredAt: now,
        lastErrorCode: null,
        nextAttemptAt: null,
      },
      deadLetter: null,
    };
  }
  if (!result.errorCode) throw new Error("Missing delivery error code");
  const exhausted = state.attempts >= policy.maxAttempts;
  if (!result.retryable || exhausted) {
    return {
      state: {
        ...state,
        status: "dead_letter",
        lastErrorCode: result.errorCode,
        nextAttemptAt: null,
      },
      deadLetter: {
        sourceType: "outbox",
        sourceId: state.id,
        reasonCode: result.errorCode,
        attempts: state.attempts,
        firstSeenAt: now,
      },
    };
  }
  const delay = Math.min(
    policy.maxBackoffMs,
    policy.initialBackoffMs * 2 ** Math.max(0, state.attempts - 1),
  );
  return {
    state: {
      ...state,
      status: "failed",
      lastErrorCode: result.errorCode,
      nextAttemptAt: now + delay,
    },
    deadLetter: null,
  };
}

function validatePolicy(policy: RetryPolicy): void {
  if (
    !Number.isSafeInteger(policy.maxAttempts)
    || policy.maxAttempts <= 0
    || !Number.isSafeInteger(policy.initialBackoffMs)
    || policy.initialBackoffMs <= 0
    || !Number.isSafeInteger(policy.maxBackoffMs)
    || policy.maxBackoffMs < policy.initialBackoffMs
  ) {
    throw new Error("Retry policy must be explicitly configured");
  }
}
