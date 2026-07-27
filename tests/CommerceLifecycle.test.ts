import { describe, expect, it } from "vitest";
import {
  finishOutboxAttempt,
  InvalidLifecycleTransition,
  scheduleRetention,
  startOutboxAttempt,
  transitionDataDeletion,
  transitionDataExport,
  transitionRetention,
  type OutboxState,
} from "../lib/commerce";

const now = 1_800_000_000_000;

describe("export, deletion, retention and delivery lifecycles", () => {
  it("requires export integrity evidence before a ready state", () => {
    let state = transitionDataExport(
      { status: "requested", updatedAt: now },
      { type: "queue", at: now + 1 },
    );
    state = transitionDataExport(state, { type: "start", at: now + 2 });
    state = transitionDataExport(state, {
      type: "complete",
      at: now + 3,
      storageKey: "exports/export:opaque:001",
      checksumSha256: "a".repeat(64),
      expiresAt: now + 60_000,
    });
    expect(state).toMatchObject({
      status: "ready",
      checksumSha256: "a".repeat(64),
    });
    expect(() =>
      transitionDataExport(state, { type: "start", at: now + 4 })).toThrow(
      InvalidLifecycleTransition,
    );
  });

  it("prevents deletion from bypassing an active retention blocker", () => {
    let state = transitionDataDeletion(
      { status: "requested", updatedAt: now },
      { type: "verify", at: now + 1 },
    );
    state = transitionDataDeletion(state, {
      type: "block",
      at: now + 2,
      blockerCode: "configured_retention",
      retentionUntil: now + 10_000,
    });
    expect(() =>
      transitionDataDeletion(state, {
        type: "unblock",
        at: now + 9_999,
      })).toThrow(InvalidLifecycleTransition);
    state = transitionDataDeletion(state, {
      type: "unblock",
      at: now + 10_000,
    });
    expect(state.status).toBe("queued");
  });

  it("does not purge retained or legally held data", () => {
    let retention = scheduleRetention({
      policyRef: "policy:founder-approved",
      recordedAt: now,
      retainForMs: 10_000,
    });
    expect(() =>
      transitionRetention(retention, {
        type: "mark_eligible",
        at: now + 9_999,
      })).toThrow(InvalidLifecycleTransition);
    retention = transitionRetention(retention, {
      type: "place_hold",
      at: now + 1,
    });
    retention = transitionRetention(retention, {
      type: "release_hold",
      at: now + 10_000,
    });
    expect(retention.status).toBe("eligible");
  });

  it("moves exhausted or permanent delivery failures to a dead letter", () => {
    const initial: OutboxState = {
      id: "outbox:opaque:001",
      status: "pending",
      attempts: 0,
      nextAttemptAt: null,
      deliveredAt: null,
      lastErrorCode: null,
    };
    let state = startOutboxAttempt(initial, now);
    let outcome = finishOutboxAttempt(
      state,
      { delivered: false, retryable: true, errorCode: "provider_timeout" },
      now,
      { maxAttempts: 2, initialBackoffMs: 100, maxBackoffMs: 1_000 },
    );
    expect(outcome.state).toMatchObject({
      status: "failed",
      nextAttemptAt: now + 100,
    });
    state = startOutboxAttempt(outcome.state, now + 100);
    outcome = finishOutboxAttempt(
      state,
      { delivered: false, retryable: true, errorCode: "provider_timeout" },
      now + 100,
      { maxAttempts: 2, initialBackoffMs: 100, maxBackoffMs: 1_000 },
    );
    expect(outcome.state.status).toBe("dead_letter");
    expect(outcome.deadLetter).toMatchObject({
      sourceId: "outbox:opaque:001",
      attempts: 2,
    });
  });
});
