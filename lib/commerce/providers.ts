import type {
  AccountId,
  Clock,
  WorkspaceId,
  WorkspaceRole,
} from "./model";

export class ProviderUnavailableError extends Error {
  constructor(
    readonly providerKind:
      | "identity"
      | "billing"
      | "email"
      | "storage"
      | "queue"
      | "monitoring",
    readonly code = "provider_unavailable",
  ) {
    super(`${providerKind} provider is unavailable`);
    this.name = "ProviderUnavailableError";
  }
}

export interface IdentitySession {
  id: string;
  accountId: AccountId;
  expiresAt: number;
  active: boolean;
}

export interface IdentityMembership {
  id: string;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
  active: boolean;
  currentSince: number;
}

export interface IdentityProvider {
  resolveSession(token: string): Promise<IdentitySession | null>;
  getMembership(
    accountId: AccountId,
    workspaceId: WorkspaceId,
  ): Promise<IdentityMembership | null>;
  revokeSessions(accountId: AccountId): Promise<void>;
}

export interface CheckoutRequest {
  idempotencyKey: string;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  commercialOfferRef: string;
  returnPath: string;
  consent?: {
    immediateSupplyRequested: boolean;
    cancellationLossAcknowledged: boolean;
    policyVersion: string;
    capturedAt: number;
  };
}

export interface BillingPurchase {
  providerRef: string;
  workspaceId: WorkspaceId;
  productRef: string;
  state: string;
  occurredAt: number;
}

export interface BillingSubscription {
  providerRef: string;
  workspaceId: WorkspaceId;
  planRef: string;
  state: string;
  occurredAt: number;
}

export interface BillingProvider {
  createCheckout(request: CheckoutRequest): Promise<{ checkoutRef: string }>;
  getPurchase(providerRef: string): Promise<BillingPurchase | null>;
  getSubscription(providerRef: string): Promise<BillingSubscription | null>;
}

export interface TransactionalMessage {
  idempotencyKey: string;
  templateRef: string;
  recipientRef: string;
  variables: Readonly<Record<string, string>>;
}

export interface EmailProvider {
  send(message: TransactionalMessage): Promise<{ messageRef: string }>;
}

export interface StoredObject {
  key: string;
  body: Uint8Array;
  checksumSha256: string;
  metadata: Readonly<Record<string, string>>;
}

export interface ObjectStorageProvider {
  put(object: StoredObject): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

export interface QueueMessage {
  idempotencyKey: string;
  topic: string;
  payload: unknown;
}

export interface QueueProvider {
  publish(message: QueueMessage): Promise<{ messageRef: string }>;
}

export interface MonitoringEvent {
  name: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  occurredAt: number;
  attributes: Readonly<Record<string, string | number | boolean>>;
}

export interface MonitoringProvider {
  capture(event: MonitoringEvent): Promise<void>;
  heartbeat(name: string, at: number): Promise<void>;
}

export interface ProviderSet {
  identity: IdentityProvider;
  billing: BillingProvider;
  email: EmailProvider;
  storage: ObjectStorageProvider;
  queue: QueueProvider;
  monitoring: MonitoringProvider;
  clock: Clock;
}
