export class InvalidLifecycleTransition extends Error {
  constructor(
    readonly lifecycle: "export" | "deletion" | "retention",
    readonly from: string,
    readonly event: string,
  ) {
    super(`Invalid ${lifecycle} transition from ${from} via ${event}`);
    this.name = "InvalidLifecycleTransition";
  }
}

export type DataExportStatus =
  | "requested"
  | "queued"
  | "processing"
  | "ready"
  | "downloaded"
  | "expired"
  | "failed"
  | "cancelled";

export interface DataExportState {
  status: DataExportStatus;
  updatedAt: number;
  storageKey?: string;
  checksumSha256?: string;
  expiresAt?: number;
  failureCode?: string;
}

export type DataExportEvent =
  | { type: "queue"; at: number }
  | { type: "start"; at: number }
  | {
      type: "complete";
      at: number;
      storageKey: string;
      checksumSha256: string;
      expiresAt: number;
    }
  | { type: "download"; at: number }
  | { type: "expire"; at: number }
  | { type: "fail"; at: number; failureCode: string }
  | { type: "cancel"; at: number };

export function transitionDataExport(
  state: DataExportState,
  event: DataExportEvent,
): DataExportState {
  assertMonotonicTime(state.updatedAt, event.at);
  const allowed: Record<DataExportStatus, readonly DataExportEvent["type"][]> = {
    requested: ["queue", "cancel"],
    queued: ["start", "fail", "cancel"],
    processing: ["complete", "fail"],
    ready: ["download", "expire"],
    downloaded: ["expire"],
    failed: ["queue", "cancel"],
    expired: [],
    cancelled: [],
  };
  assertTransition("export", state.status, event.type, allowed[state.status]);

  switch (event.type) {
    case "queue":
      return { status: "queued", updatedAt: event.at };
    case "start":
      return { ...state, status: "processing", updatedAt: event.at };
    case "complete":
      if (
        !event.storageKey
        || !/^[a-f0-9]{64}$/iu.test(event.checksumSha256)
        || event.expiresAt <= event.at
      ) {
        throw new Error("Invalid export completion evidence");
      }
      return {
        status: "ready",
        updatedAt: event.at,
        storageKey: event.storageKey,
        checksumSha256: event.checksumSha256.toLowerCase(),
        expiresAt: event.expiresAt,
      };
    case "download":
      return { ...state, status: "downloaded", updatedAt: event.at };
    case "expire":
      return {
        status: "expired",
        updatedAt: event.at,
      };
    case "fail":
      if (!event.failureCode) throw new Error("Missing export failure code");
      return {
        status: "failed",
        updatedAt: event.at,
        failureCode: event.failureCode,
      };
    case "cancel":
      return { status: "cancelled", updatedAt: event.at };
  }
}

export type DataDeletionStatus =
  | "requested"
  | "verified"
  | "queued"
  | "processing"
  | "blocked"
  | "completed"
  | "cancelled";

export interface DataDeletionState {
  status: DataDeletionStatus;
  updatedAt: number;
  verifiedAt?: number;
  retentionUntil?: number;
  blockerCode?: string;
  completedAt?: number;
}

export type DataDeletionEvent =
  | { type: "verify"; at: number }
  | { type: "queue"; at: number }
  | { type: "start"; at: number }
  | { type: "block"; at: number; blockerCode: string; retentionUntil?: number }
  | { type: "unblock"; at: number }
  | { type: "complete"; at: number }
  | { type: "cancel"; at: number };

export function transitionDataDeletion(
  state: DataDeletionState,
  event: DataDeletionEvent,
): DataDeletionState {
  assertMonotonicTime(state.updatedAt, event.at);
  const allowed: Record<
    DataDeletionStatus,
    readonly DataDeletionEvent["type"][]
  > = {
    requested: ["verify", "cancel"],
    verified: ["queue", "block", "cancel"],
    queued: ["start", "block"],
    processing: ["complete", "block"],
    blocked: ["unblock", "cancel"],
    completed: [],
    cancelled: [],
  };
  assertTransition("deletion", state.status, event.type, allowed[state.status]);

  switch (event.type) {
    case "verify":
      return {
        ...state,
        status: "verified",
        updatedAt: event.at,
        verifiedAt: event.at,
      };
    case "queue":
    case "unblock":
      if (
        state.retentionUntil !== undefined
        && state.retentionUntil > event.at
      ) {
        throw new InvalidLifecycleTransition(
          "deletion",
          state.status,
          event.type,
        );
      }
      return {
        ...state,
        status: "queued",
        updatedAt: event.at,
        blockerCode: undefined,
      };
    case "start":
      return { ...state, status: "processing", updatedAt: event.at };
    case "block":
      if (!event.blockerCode) {
        throw new Error("Missing deletion blocker code");
      }
      return {
        ...state,
        status: "blocked",
        updatedAt: event.at,
        blockerCode: event.blockerCode,
        ...(event.retentionUntil === undefined
          ? {}
          : { retentionUntil: event.retentionUntil }),
      };
    case "complete":
      return {
        ...state,
        status: "completed",
        updatedAt: event.at,
        completedAt: event.at,
        blockerCode: undefined,
      };
    case "cancel":
      return { ...state, status: "cancelled", updatedAt: event.at };
  }
}

export type RetentionStatus =
  | "scheduled"
  | "held"
  | "eligible"
  | "purging"
  | "purged"
  | "failed";

export interface RetentionState {
  policyRef: string;
  retainUntil: number;
  legalHold: boolean;
  status: RetentionStatus;
  updatedAt: number;
  failureCode?: string;
}

export type RetentionEvent =
  | { type: "place_hold"; at: number }
  | { type: "release_hold"; at: number }
  | { type: "mark_eligible"; at: number }
  | { type: "start_purge"; at: number }
  | { type: "complete_purge"; at: number }
  | { type: "fail"; at: number; failureCode: string }
  | { type: "retry"; at: number };

export function transitionRetention(
  state: RetentionState,
  event: RetentionEvent,
): RetentionState {
  assertMonotonicTime(state.updatedAt, event.at);
  const allowed: Record<RetentionStatus, readonly RetentionEvent["type"][]> = {
    scheduled: ["place_hold", "mark_eligible"],
    held: ["release_hold"],
    eligible: ["place_hold", "start_purge"],
    purging: ["complete_purge", "fail"],
    purged: [],
    failed: ["place_hold", "retry"],
  };
  assertTransition("retention", state.status, event.type, allowed[state.status]);

  switch (event.type) {
    case "place_hold":
      return {
        ...state,
        legalHold: true,
        status: "held",
        updatedAt: event.at,
      };
    case "release_hold":
      return {
        ...state,
        legalHold: false,
        status: event.at >= state.retainUntil ? "eligible" : "scheduled",
        updatedAt: event.at,
      };
    case "mark_eligible":
      if (state.legalHold || event.at < state.retainUntil) {
        throw new InvalidLifecycleTransition(
          "retention",
          state.status,
          event.type,
        );
      }
      return { ...state, status: "eligible", updatedAt: event.at };
    case "start_purge":
      if (state.legalHold) {
        throw new InvalidLifecycleTransition(
          "retention",
          state.status,
          event.type,
        );
      }
      return { ...state, status: "purging", updatedAt: event.at };
    case "complete_purge":
      return {
        ...state,
        status: "purged",
        updatedAt: event.at,
        failureCode: undefined,
      };
    case "fail":
      if (!event.failureCode) throw new Error("Missing retention failure code");
      return {
        ...state,
        status: "failed",
        updatedAt: event.at,
        failureCode: event.failureCode,
      };
    case "retry":
      return {
        ...state,
        status: "eligible",
        updatedAt: event.at,
        failureCode: undefined,
      };
  }
}

export function scheduleRetention(input: {
  policyRef: string;
  recordedAt: number;
  retainForMs: number;
}): RetentionState {
  if (
    !input.policyRef
    || !Number.isSafeInteger(input.recordedAt)
    || !Number.isSafeInteger(input.retainForMs)
    || input.retainForMs < 0
  ) {
    throw new Error("Retention policy must be explicitly configured");
  }
  return {
    policyRef: input.policyRef,
    retainUntil: input.recordedAt + input.retainForMs,
    legalHold: false,
    status: "scheduled",
    updatedAt: input.recordedAt,
  };
}

function assertTransition(
  lifecycle: InvalidLifecycleTransition["lifecycle"],
  state: string,
  event: string,
  allowed: readonly string[],
): void {
  if (!allowed.includes(event)) {
    throw new InvalidLifecycleTransition(lifecycle, state, event);
  }
}

function assertMonotonicTime(previous: number, next: number): void {
  if (!Number.isSafeInteger(next) || next < previous) {
    throw new Error("Lifecycle event timestamp must be monotonic");
  }
}
