import {
  authorizeDownload,
  type DownloadAuthorizationInput,
} from "./authorization";
import {
  type DownloadGrantRecord,
  type DownloadGrantStore,
  type GrantPayload,
  verifyDownloadGrantToken,
} from "./grants";
import type {
  AccountId,
  EntitlementId,
  ReleaseId,
  WorkspaceId,
  WorkspaceRole,
} from "./model";

interface CurrentDownloadBinding {
  accountId: AccountId;
  workspaceId: WorkspaceId;
  releaseId: ReleaseId;
  entitlementId: EntitlementId;
}

export interface CurrentDownloadCaller {
  accountId: AccountId;
  workspaceId: WorkspaceId;
  fingerprintHash?: string;
  session: {
    accountId: AccountId;
    active: boolean;
    expiresAt: number;
  };
}

export interface ProtectedDownloadTransaction {
  loadCurrentAuthorization(
    binding: CurrentDownloadBinding,
    caller: CurrentDownloadCaller,
  ): Promise<DownloadAuthorizationInput | null>;
  consumeGrantNonce(
    nonceHash: string,
    consumedAt: number,
  ): Promise<"consumed" | "missing" | "expired" | "revoked" | "replayed">;
}

/**
 * Production adapters must implement this as one database transaction:
 * current-state reads, authorization and nonce consumption must commit
 * together or not at all.
 */
export interface ProtectedDownloadRepository extends DownloadGrantStore {
  runAuthorizationAndConsumeAtomically<T>(
    operation: (transaction: ProtectedDownloadTransaction) => Promise<T>,
  ): Promise<T>;
}

export type ProtectedDownloadResult =
  | { ok: true; grant: GrantPayload }
  | {
      ok: false;
      status: 404;
      code: "not_found_or_forbidden";
    };

export async function consumeProtectedDownload(input: {
  token: string;
  now: number;
  secret: string | Uint8Array;
  allowedRoles: readonly WorkspaceRole[];
  caller: CurrentDownloadCaller | null;
  repository: ProtectedDownloadRepository;
}): Promise<ProtectedDownloadResult> {
  if (!input.caller) return hiddenDenial();
  const caller = input.caller;
  const verification = await verifyDownloadGrantToken(input);
  if (!verification.ok) return hiddenDenial();
  const { payload, nonceHash } = verification;
  if (
    caller.accountId !== payload.accountId
    || caller.workspaceId !== payload.workspaceId
    || caller.session.accountId !== payload.accountId
    || (payload.fingerprintHash !== undefined
      && payload.fingerprintHash !== caller.fingerprintHash)
  ) {
    return hiddenDenial();
  }
  const binding: CurrentDownloadBinding = {
    accountId: payload.accountId,
    workspaceId: payload.workspaceId,
    releaseId: payload.releaseId,
    entitlementId: payload.entitlementId,
  };

  try {
    return await input.repository.runAuthorizationAndConsumeAtomically(
      async (transaction) => {
        const current = await transaction.loadCurrentAuthorization(
          binding,
          caller,
        );
        if (!current) return hiddenDenial();
        const decision = authorizeDownload({
          ...current,
          now: input.now,
          accountId: payload.accountId,
          workspaceId: payload.workspaceId,
          releaseId: payload.releaseId,
          entitlementId: payload.entitlementId,
          allowedRoles: input.allowedRoles,
          session: caller.session,
        });
        if (!decision.allowed) return hiddenDenial();

        const consumed = await transaction.consumeGrantNonce(
          nonceHash,
          input.now,
        );
        if (consumed !== "consumed") return hiddenDenial();
        return { ok: true, grant: payload };
      },
    );
  } catch {
    return hiddenDenial();
  }
}

export class InMemoryProtectedDownloadRepository
  implements ProtectedDownloadRepository
{
  private readonly grants = new Map<string, DownloadGrantRecord>();
  private readonly current = new Map<string, DownloadAuthorizationInput>();
  private transactionTail: Promise<void> = Promise.resolve();

  setCurrentAuthorization(input: DownloadAuthorizationInput): void {
    this.current.set(bindingKey(input), structuredClone(input));
  }

  async register(record: DownloadGrantRecord): Promise<void> {
    if (this.grants.has(record.nonceHash)) {
      throw new Error("Duplicate download grant nonce");
    }
    this.grants.set(record.nonceHash, structuredClone(record));
  }

  async consume(
    nonceHash: string,
    consumedAt: number,
  ): Promise<"consumed" | "missing" | "expired" | "revoked" | "replayed"> {
    return this.consumeGrantNonce(nonceHash, consumedAt);
  }

  async runAuthorizationAndConsumeAtomically<T>(
    operation: (transaction: ProtectedDownloadTransaction) => Promise<T>,
  ): Promise<T> {
    const previous = this.transactionTail;
    let releaseLock: () => void = () => undefined;
    this.transactionTail = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    await previous;
    try {
      return await operation(this);
    } finally {
      releaseLock();
    }
  }

  async loadCurrentAuthorization(
    binding: CurrentDownloadBinding,
    caller: CurrentDownloadCaller,
  ): Promise<DownloadAuthorizationInput | null> {
    if (
      caller.accountId !== binding.accountId
      || caller.workspaceId !== binding.workspaceId
    ) {
      return null;
    }
    return structuredClone(this.current.get(bindingKey(binding)) ?? null);
  }

  async consumeGrantNonce(
    nonceHash: string,
    consumedAt: number,
  ): Promise<"consumed" | "missing" | "expired" | "revoked" | "replayed"> {
    const record = this.grants.get(nonceHash);
    if (!record) return "missing";
    if (record.revokedAt !== null) return "revoked";
    if (record.consumedAt !== null) return "replayed";
    if (record.expiresAt <= consumedAt) return "expired";
    record.consumedAt = consumedAt;
    return "consumed";
  }
}

function bindingKey(binding: CurrentDownloadBinding): string {
  return [
    binding.accountId,
    binding.workspaceId,
    binding.releaseId,
    binding.entitlementId,
  ].join("\u001f");
}

function hiddenDenial(): ProtectedDownloadResult {
  return {
    ok: false,
    status: 404,
    code: "not_found_or_forbidden",
  };
}
