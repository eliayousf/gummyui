import type {
  BillingProvider,
  BillingPurchase,
  BillingSubscription,
  CheckoutRequest,
  EmailProvider,
  IdentityMembership,
  IdentityProvider,
  IdentitySession,
  MonitoringEvent,
  MonitoringProvider,
  ObjectStorageProvider,
  QueueMessage,
  QueueProvider,
  StoredObject,
  TransactionalMessage,
} from "./providers";
import { ProviderUnavailableError } from "./providers";
import type { AccountId, IdSource, WorkspaceId } from "./model";

abstract class DeterministicFake {
  private failureCode: string | null = null;

  protected constructor(
    private readonly kind: ProviderUnavailableError["providerKind"],
  ) {}

  setFailure(code: string | null): void {
    this.failureCode = code;
  }

  protected assertAvailable(): void {
    if (this.failureCode) {
      throw new ProviderUnavailableError(this.kind, this.failureCode);
    }
  }
}

export class LocalIdentityProvider
  extends DeterministicFake
  implements IdentityProvider
{
  private readonly sessions = new Map<string, IdentitySession>();
  private readonly memberships = new Map<string, IdentityMembership>();

  constructor() {
    super("identity");
  }

  seedSession(token: string, session: IdentitySession): void {
    this.sessions.set(token, structuredClone(session));
  }

  seedMembership(membership: IdentityMembership): void {
    this.memberships.set(
      `${membership.accountId}:${membership.workspaceId}`,
      structuredClone(membership),
    );
  }

  async resolveSession(token: string): Promise<IdentitySession | null> {
    this.assertAvailable();
    return structuredClone(this.sessions.get(token) ?? null);
  }

  async getMembership(
    accountId: AccountId,
    workspaceId: WorkspaceId,
  ): Promise<IdentityMembership | null> {
    this.assertAvailable();
    return structuredClone(
      this.memberships.get(`${accountId}:${workspaceId}`) ?? null,
    );
  }

  async revokeSessions(accountId: AccountId): Promise<void> {
    this.assertAvailable();
    for (const [token, session] of this.sessions) {
      if (session.accountId === accountId) {
        this.sessions.set(token, { ...session, active: false });
      }
    }
  }
}

export class LocalBillingProvider
  extends DeterministicFake
  implements BillingProvider
{
  readonly checkouts: CheckoutRequest[] = [];
  private readonly purchases = new Map<string, BillingPurchase>();
  private readonly subscriptions = new Map<string, BillingSubscription>();

  constructor(private readonly ids: IdSource) {
    super("billing");
  }

  seedPurchase(purchase: BillingPurchase): void {
    this.purchases.set(purchase.providerRef, structuredClone(purchase));
  }

  seedSubscription(subscription: BillingSubscription): void {
    this.subscriptions.set(
      subscription.providerRef,
      structuredClone(subscription),
    );
  }

  async createCheckout(
    request: CheckoutRequest,
  ): Promise<{ checkoutRef: string }> {
    this.assertAvailable();
    this.checkouts.push(structuredClone(request));
    return { checkoutRef: this.ids.next("checkout") };
  }

  async getPurchase(providerRef: string): Promise<BillingPurchase | null> {
    this.assertAvailable();
    return structuredClone(this.purchases.get(providerRef) ?? null);
  }

  async getSubscription(
    providerRef: string,
  ): Promise<BillingSubscription | null> {
    this.assertAvailable();
    return structuredClone(this.subscriptions.get(providerRef) ?? null);
  }
}

export class LocalEmailProvider
  extends DeterministicFake
  implements EmailProvider
{
  readonly messages: TransactionalMessage[] = [];

  constructor(private readonly ids: IdSource) {
    super("email");
  }

  async send(
    message: TransactionalMessage,
  ): Promise<{ messageRef: string }> {
    this.assertAvailable();
    this.messages.push(structuredClone(message));
    return { messageRef: this.ids.next("message") };
  }
}

export class LocalObjectStorageProvider
  extends DeterministicFake
  implements ObjectStorageProvider
{
  private readonly objects = new Map<string, StoredObject>();

  constructor() {
    super("storage");
  }

  async put(object: StoredObject): Promise<void> {
    this.assertAvailable();
    this.objects.set(object.key, cloneStoredObject(object));
  }

  async get(key: string): Promise<StoredObject | null> {
    this.assertAvailable();
    const object = this.objects.get(key);
    return object ? cloneStoredObject(object) : null;
  }

  async delete(key: string): Promise<void> {
    this.assertAvailable();
    this.objects.delete(key);
  }
}

export class LocalQueueProvider
  extends DeterministicFake
  implements QueueProvider
{
  readonly messages: QueueMessage[] = [];

  constructor(private readonly ids: IdSource) {
    super("queue");
  }

  async publish(message: QueueMessage): Promise<{ messageRef: string }> {
    this.assertAvailable();
    this.messages.push(structuredClone(message));
    return { messageRef: this.ids.next("queue-message") };
  }
}

export class LocalMonitoringProvider
  extends DeterministicFake
  implements MonitoringProvider
{
  readonly events: MonitoringEvent[] = [];
  readonly heartbeats: Array<{ name: string; at: number }> = [];

  constructor() {
    super("monitoring");
  }

  async capture(event: MonitoringEvent): Promise<void> {
    this.assertAvailable();
    this.events.push(structuredClone(event));
  }

  async heartbeat(name: string, at: number): Promise<void> {
    this.assertAvailable();
    this.heartbeats.push({ name, at });
  }
}

function cloneStoredObject(object: StoredObject): StoredObject {
  return {
    ...structuredClone(object),
    body: object.body.slice(),
  };
}
