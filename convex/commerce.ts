import {
  mutationGeneric,
  type DataModelFromSchemaDefinition,
  type GenericMutationCtx,
  type TableNamesInDataModel,
} from "convex/server";
import { v } from "convex/values";
import schema from "./schema";

type DataModel = DataModelFromSchemaDefinition<typeof schema>;
type MutationCtx = GenericMutationCtx<DataModel>;
type TableName = TableNamesInDataModel<DataModel>;
type Input = Record<string, unknown>;

export const execute = mutationGeneric({
  args: {
    serverSecret: v.string(),
    operation: v.string(),
    input: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const input = asRecord(args.input);
    switch (args.operation) {
      case "stripe.fulfillment.apply":
        return applyStripeFulfillment(ctx, input);
      case "stripe.lifecycle.apply":
        return applyStripeLifecycle(ctx, input);
      case "stripe.adjustment.apply":
        return applyStripeAdjustment(ctx, input);
      case "workos.identity.provision":
        await provisionWorkOSIdentity(ctx, input);
        return null;
      case "workos.identity.resolve":
        return resolveWorkOSIdentity(ctx, input);
      case "workos.webhook.apply":
        return applyWorkOSWebhook(ctx, input);
      case "workos.invitation.record":
        await recordWorkOSInvitation(ctx, input);
        return null;
      case "downloads.register":
        await registerDownloadGrant(ctx, input);
        return null;
      case "downloads.find-authorized":
        return findAuthorizedRelease(ctx, input);
      case "downloads.consume":
        return consumeAuthorizedRelease(ctx, input);
      case "billing.customer":
        return findBillingCustomer(ctx, input);
      case "account.section":
        return loadAccountSection(ctx, input);
      case "privacy.export.request":
        return requestDataExport(ctx, input);
      case "privacy.export.read":
        return readDataExport(ctx, input);
      case "privacy.export.downloaded":
        await markDataExportDownloaded(ctx, input);
        return null;
      case "privacy.deletion.request":
        return requestAccountDeletion(ctx, input);
      case "privacy.deletion.cancel":
        return cancelAccountDeletion(ctx, input);
      case "privacy.deletion.prepare":
        return prepareAccountDeletion(ctx, input);
      case "privacy.deletion.complete":
        await completeAccountDeletion(ctx, input);
        return null;
      case "privacy.deletion.defer":
        await deferAccountDeletion(ctx, input);
        return null;
      case "email.outbox.claim":
        return claimOutboxMessages(ctx, input);
      case "email.outbox.accepted":
        await markOutboxAccepted(ctx, input);
        return null;
      case "email.outbox.failed":
        await markOutboxFailed(ctx, input);
        return null;
      case "email.outbox.provider-event":
        return applyOutboxProviderEvent(ctx, input);
      case "health.readiness":
        return commerceReadiness(ctx);
      case "rate-limit.consume":
        return consumeRateLimitWindows(ctx, input);
      default:
        throw new Error("Unsupported commerce operation");
    }
  },
});

async function applyStripeFulfillment(
  ctx: MutationCtx,
  input: Input,
): Promise<"applied" | "duplicate"> {
  const event = await acceptProviderEvent(ctx, {
    providerKind: "stripe",
    providerEventId: text(input, "providerEventId"),
    aggregateType: "purchase",
    aggregateId: text(input, "checkoutSessionId"),
    eventType: text(input, "providerEventType"),
    occurredAt: number(input, "providerOccurredAt"),
    receivedAt: number(input, "receivedAt"),
    payloadHash: sha256(input, "payloadHash"),
  });
  if (event.duplicate) return "duplicate";

  const now = Date.now();
  const accountId = text(input, "accountId");
  const workspaceId = text(input, "workspaceId");
  const checkoutSessionId = text(input, "checkoutSessionId");
  const stripeCustomerId = text(input, "stripeCustomerId");
  const providerOccurredAt = number(input, "providerOccurredAt");
  const purchasedAt = number(input, "purchasedAt");
  const purchaseStatus = text(input, "purchaseStatus");
  const planId = text(input, "planId");
  const subscriptionId = nullableText(input, "stripeSubscriptionId");
  const subscriptionRecordId = subscriptionId
    ? `subscription:stripe:${subscriptionId}`
    : null;
  const purchaseId = `purchase:stripe:${checkoutSessionId}`;

  const existingCustomer = await ctx.db
    .query("billingCustomers")
    .withIndex("by_provider_workspace", (q) =>
      q.eq("billingProvider", "stripe").eq("workspaceId", workspaceId))
    .unique();
  await upsert(ctx, "billingCustomers", existingCustomer, {
    id: existingCustomer?.id
      ?? `billing-customer:stripe:${stripeCustomerId}`,
    workspaceId,
    accountId,
    billingProvider: "stripe",
    providerCustomerId: stripeCustomerId,
    status: "active",
    providerOccurredAt: Math.max(
      existingCustomer?.providerOccurredAt ?? 0,
      providerOccurredAt,
    ),
    createdAt: existingCustomer?.createdAt ?? now,
    updatedAt: now,
  });

  const existingPurchase = await ctx.db
    .query("purchases")
    .withIndex("by_provider_purchase", (q) =>
      q
        .eq("billingProvider", "stripe")
        .eq("providerPurchaseId", checkoutSessionId))
    .unique();
  const nextPurchaseStatus = existingPurchase
    ? preservePurchaseStatus(existingPurchase.status, purchaseStatus)
    : purchaseStatus;
  await upsert(ctx, "purchases", existingPurchase, {
    id: existingPurchase?.id ?? purchaseId,
    billingProvider: "stripe",
    providerPurchaseId: checkoutSessionId,
    providerPaymentIntentId:
      existingPurchase?.providerPaymentIntentId
      ?? nullableText(input, "stripePaymentIntentId"),
    accountId,
    workspaceId,
    productRef: planId,
    status: nextPurchaseStatus,
    currency: text(input, "currency"),
    amountMinor: number(input, "amountMinor"),
    purchasedAt,
    providerOccurredAt: Math.max(
      existingPurchase?.providerOccurredAt ?? 0,
      providerOccurredAt,
    ),
    createdAt: existingPurchase?.createdAt ?? now,
    updatedAt: now,
  });

  if (subscriptionId && subscriptionRecordId) {
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_provider_subscription", (q) =>
        q
          .eq("billingProvider", "stripe")
          .eq("providerSubscriptionId", subscriptionId))
      .unique();
    await upsert(ctx, "subscriptions", existingSubscription, {
      id: existingSubscription?.id ?? subscriptionRecordId,
      billingProvider: "stripe",
      providerSubscriptionId: subscriptionId,
      workspaceId,
      accountId,
      planRef: planId,
      status: purchaseStatus === "completed" ? "active" : "pending",
      currentPeriodStartsAt: nullableNumber(
        input,
        "subscriptionCurrentPeriodStartsAt",
      ),
      currentPeriodEndsAt: nullableNumber(
        input,
        "subscriptionCurrentPeriodEndsAt",
      ),
      cancelAtPeriodEnd: boolean(input, "subscriptionCancelAtPeriodEnd"),
      canceledAt: null,
      providerOccurredAt: Math.max(
        existingSubscription?.providerOccurredAt ?? 0,
        providerOccurredAt,
      ),
      createdAt: existingSubscription?.createdAt ?? now,
      updatedAt: now,
    });
  }

  if (purchaseStatus === "completed") {
    for (const productRef of stringArray(input, "productRefs")) {
      const licenceId = `licence:stripe:${checkoutSessionId}:${productRef}`;
      const entitlementId =
        `entitlement:stripe:${checkoutSessionId}:${productRef}`;
      const seatId =
        `licence-seat:stripe:${checkoutSessionId}:${productRef}`;
      const existingLicence = await byId(ctx, "licences", licenceId);
      const protectedLicenceStatus = existingLicence
        && ["suspended", "revoked", "expired"].includes(existingLicence.status)
        ? existingLicence.status
        : "active";
      await upsert(ctx, "licences", existingLicence, {
        id: licenceId,
        workspaceId,
        purchaseId,
        subscriptionId: subscriptionRecordId,
        productRef,
        status: protectedLicenceStatus,
        startsAt: purchasedAt,
        expiresAt: nullableNumber(
          input,
          "subscriptionCurrentPeriodEndsAt",
        ),
        updatesUntil: nullableNumber(input, "updatesUntil"),
        seatLimit: nullableNumber(input, "seatLimit"),
        createdAt: existingLicence?.createdAt ?? now,
        updatedAt: now,
      });

      const existingSeat = await ctx.db
        .query("licenceSeats")
        .withIndex("by_licence_account", (q) =>
          q.eq("licenceId", licenceId).eq("accountId", accountId))
        .unique();
      await upsert(ctx, "licenceSeats", existingSeat, {
        id: existingSeat?.id ?? seatId,
        licenceId,
        accountId,
        status: existingSeat?.status === "revoked" ? "revoked" : "active",
        assignedAt: existingSeat?.assignedAt ?? purchasedAt,
        revokedAt: existingSeat?.status === "revoked"
          ? existingSeat.revokedAt ?? null
          : null,
        createdAt: existingSeat?.createdAt ?? now,
        updatedAt: now,
      });

      const existingEntitlement = await byId(
        ctx,
        "entitlements",
        entitlementId,
      );
      const protectedEntitlementStatus = existingEntitlement
        && ["suspended", "revoked", "expired"].includes(
          existingEntitlement.status,
        )
        ? existingEntitlement.status
        : "active";
      await upsert(ctx, "entitlements", existingEntitlement, {
        id: entitlementId,
        workspaceId,
        accountId: text(input, "entitlementScope") === "account"
          ? accountId
          : null,
        licenceId,
        productRef,
        status: protectedEntitlementStatus,
        validFrom: purchasedAt,
        validUntil: nullableNumber(
          input,
          "subscriptionCurrentPeriodEndsAt",
        ),
        updatesUntil: nullableNumber(input, "updatesUntil"),
        sourceEventId:
          protectedEntitlementStatus === "active"
            ? event.document.id
            : existingEntitlement?.sourceEventId ?? null,
        createdAt: existingEntitlement?.createdAt ?? now,
        updatedAt: now,
      });
    }

    for (const consent of [
      { suffix: "terms", purpose: "terms_of_service", occurredAt: purchasedAt },
      {
        suffix: "immediate-supply",
        purpose: "immediate_digital_supply",
        occurredAt: number(input, "consentCapturedAt"),
      },
      {
        suffix: "cancellation-loss",
        purpose: "digital_cancellation_rights_acknowledgement",
        occurredAt: number(input, "consentCapturedAt"),
      },
    ]) {
      const id = `consent:stripe:${checkoutSessionId}:${consent.suffix}`;
      if (!await byId(ctx, "consentRecords", id)) {
        await ctx.db.insert("consentRecords", {
          id,
          accountId,
          workspaceId,
          purpose: consent.purpose,
          state: "granted",
          noticeVersion: text(input, "consentPolicyVersion"),
          source: "stripe_checkout",
          evidenceHash: sha256(input, "payloadHash"),
          occurredAt: consent.occurredAt,
          withdrawnAt: null,
          createdAt: now,
        });
      }
    }

    const notificationPayload = JSON.stringify({
      accountId,
      workspaceId,
      purchaseId,
      planId,
      templateRef: "purchase-access-v1",
    });
    await insertOutboxOnce(ctx, {
      id: `outbox:stripe:${checkoutSessionId}:commerce.purchase.access`,
      deduplicationKey:
        `stripe:${checkoutSessionId}:commerce.purchase.access`,
      topic: "commerce.purchase.access",
      aggregateType: "purchase",
      aggregateId: purchaseId,
      payload: notificationPayload,
      payloadHash: await sha256Hex(notificationPayload),
      now,
    });
  }

  await insertAuditOnce(ctx, {
    id: `audit:stripe:${text(input, "providerEventId")}`,
    actorAccountId: accountId,
    workspaceId,
    action: "stripe.checkout.projected",
    targetType: "purchase",
    targetId: purchaseId,
    outcome: "succeeded",
    metadata: JSON.stringify({
      eventType: text(input, "providerEventType"),
      purchaseStatus,
    }),
    occurredAt: now,
  });
  await markProviderEvent(ctx, event.document, "applied", now);
  return "applied";
}

async function consumeRateLimitWindows(
  ctx: MutationCtx,
  input: Input,
): Promise<Record<string, unknown>> {
  const now = number(input, "now");
  const rawBuckets = input.buckets;
  if (
    !Array.isArray(rawBuckets)
    || rawBuckets.length < 1
    || rawBuckets.length > 3
  ) {
    throw new Error("Invalid rate-limit buckets");
  }
  const buckets = rawBuckets.map((value) => {
    const bucket = asRecord(value);
    const scopeHash = sha256(bucket, "scopeHash");
    const keyHash = sha256(bucket, "keyHash");
    const capacity = number(bucket, "capacity");
    const windowMs = number(bucket, "windowMs");
    if (
      !Number.isSafeInteger(capacity)
      || capacity < 1
      || capacity > 1_000
      || !Number.isSafeInteger(windowMs)
      || windowMs < 1_000
      || windowMs > 86_400_000
    ) {
      throw new Error("Invalid rate-limit policy");
    }
    return { scopeHash, keyHash, capacity, windowMs };
  });
  if (
    new Set(buckets.map((bucket) =>
      `${bucket.scopeHash}:${bucket.keyHash}`)).size !== buckets.length
  ) {
    throw new Error("Duplicate rate-limit bucket");
  }

  const expired = await ctx.db
    .query("rateLimitWindows")
    .withIndex("by_expiry", (q) => q.lte("expiresAt", now))
    .take(20);
  for (const row of expired) await ctx.db.delete(row._id);

  const projections = [];
  for (const bucket of buckets) {
    const existing = await ctx.db
      .query("rateLimitWindows")
      .withIndex("by_scope_key", (q) =>
        q
          .eq("scopeHash", bucket.scopeHash)
          .eq("keyHash", bucket.keyHash))
      .unique();
    const reset =
      !existing
      || existing.windowEndsAt <= now
      || existing.capacity !== bucket.capacity
      || existing.windowMs !== bucket.windowMs;
    const count = reset ? 0 : existing.count;
    const windowStartedAt = reset ? now : existing.windowStartedAt;
    const windowEndsAt = reset
      ? now + bucket.windowMs
      : existing.windowEndsAt;
    projections.push({
      bucket,
      existing,
      count,
      windowStartedAt,
      windowEndsAt,
    });
  }
  const denied = projections.filter(
    ({ bucket, count }) => count >= bucket.capacity,
  );
  if (denied.length > 0) {
    const resetAt = Math.max(...denied.map((entry) => entry.windowEndsAt));
    return {
      allowed: false,
      retryAfterMs: Math.max(1, resetAt - now),
      resetAt,
    };
  }

  for (const projection of projections) {
    const value = {
      scopeHash: projection.bucket.scopeHash,
      keyHash: projection.bucket.keyHash,
      capacity: projection.bucket.capacity,
      windowMs: projection.bucket.windowMs,
      windowStartedAt: projection.windowStartedAt,
      windowEndsAt: projection.windowEndsAt,
      count: projection.count + 1,
      expiresAt: projection.windowEndsAt + 86_400_000,
      updatedAt: now,
    };
    if (projection.existing) {
      await ctx.db.patch(projection.existing._id, value);
    } else {
      await ctx.db.insert("rateLimitWindows", value);
    }
  }
  return {
    allowed: true,
    remaining: Math.min(...projections.map(
      ({ bucket, count }) => bucket.capacity - count - 1,
    )),
    resetAt: Math.max(...projections.map((entry) => entry.windowEndsAt)),
  };
}

async function applyStripeLifecycle(
  ctx: MutationCtx,
  input: Input,
): Promise<"applied" | "duplicate" | "ignored"> {
  const kind = text(input, "kind");
  const providerEventId = text(input, "providerEventId");
  const stripeSubscriptionId = text(input, "stripeSubscriptionId");
  const aggregateId = kind === "invoice"
    ? text(input, "stripeInvoiceId")
    : stripeSubscriptionId;
  const event = await acceptProviderEvent(ctx, {
    providerKind: "stripe",
    providerEventId,
    aggregateType: kind,
    aggregateId,
    eventType: text(input, "providerEventType"),
    occurredAt: number(input, "providerOccurredAt"),
    receivedAt: number(input, "receivedAt"),
    payloadHash: sha256(input, "payloadHash"),
  });
  if (event.duplicate) return "duplicate";

  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_provider_subscription", (q) =>
      q
        .eq("billingProvider", "stripe")
        .eq("providerSubscriptionId", stripeSubscriptionId))
    .unique();
  if (!subscription) {
    throw new Error("Stripe lifecycle target is unavailable");
  }
  const providerOccurredAt = number(input, "providerOccurredAt");
  if (subscription.providerOccurredAt > providerOccurredAt) {
    await markProviderEvent(ctx, event.document, "ignored", Date.now());
    return "ignored";
  }

  const now = Date.now();
  const accessStatus = text(input, "accessStatus");
  await ctx.db.patch(subscription._id, {
    accountId: text(input, "accountId"),
    planRef: text(input, "planId"),
    status: text(input, "subscriptionStatus"),
    currentPeriodStartsAt: number(input, "currentPeriodStartsAt"),
    currentPeriodEndsAt: number(input, "currentPeriodEndsAt"),
    cancelAtPeriodEnd: boolean(input, "cancelAtPeriodEnd"),
    canceledAt: nullableNumber(input, "canceledAt"),
    providerOccurredAt,
    updatedAt: now,
  });

  if (kind === "invoice") {
    const stripeInvoiceId = text(input, "stripeInvoiceId");
    const existingInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_provider_invoice", (q) =>
        q
          .eq("billingProvider", "stripe")
          .eq("providerInvoiceId", stripeInvoiceId))
      .unique();
    await upsert(ctx, "invoices", existingInvoice, {
      id: existingInvoice?.id ?? `invoice:stripe:${stripeInvoiceId}`,
      billingProvider: "stripe",
      providerInvoiceId: stripeInvoiceId,
      providerPaymentIntentId: nullableText(
        input,
        "stripePaymentIntentId",
      ),
      workspaceId: subscription.workspaceId,
      purchaseId: null,
      subscriptionId: subscription.id,
      status: text(input, "invoiceStatus"),
      currency: text(input, "currency"),
      totalMinor: number(input, "totalMinor"),
      issuedAt: number(input, "issuedAt"),
      paidAt: nullableNumber(input, "paidAt"),
      providerOccurredAt,
      createdAt: existingInvoice?.createdAt ?? now,
      updatedAt: now,
    });
  }

  const licences = await ctx.db
    .query("licences")
    .withIndex("by_subscription", (q) =>
      q.eq("subscriptionId", subscription.id))
    .collect();
  for (const licence of licences) {
    const nextStatus = accessStatus === "active"
      ? licence.status === "revoked" ? "revoked" : "active"
      : accessStatus === "expired"
        ? "expired"
        : licence.status === "revoked" ? "revoked" : "suspended";
    await ctx.db.patch(licence._id, {
      status: nextStatus,
      expiresAt: number(input, "currentPeriodEndsAt"),
      updatesUntil: number(input, "currentPeriodEndsAt"),
      updatedAt: now,
    });
    const entitlements = await ctx.db
      .query("entitlements")
      .withIndex("by_licence", (q) => q.eq("licenceId", licence.id))
      .collect();
    for (const entitlement of entitlements) {
      await ctx.db.patch(entitlement._id, {
        status: nextStatus,
        validUntil: number(input, "currentPeriodEndsAt"),
        updatesUntil: number(input, "currentPeriodEndsAt"),
        sourceEventId: event.document.id,
        updatedAt: now,
      });
      if (nextStatus !== "active") {
        await revokeOpenGrants(ctx, entitlement.id, now);
      }
    }
  }

  const topic = kind === "invoice"
    ? text(input, "invoiceStatus") === "paid"
      ? "commerce.subscription.renewed"
      : "commerce.subscription.payment_failed"
    : accessStatus === "expired"
      ? "commerce.subscription.ended"
      : "commerce.subscription.updated";
  const payload = JSON.stringify({
    accountId: text(input, "accountId"),
    workspaceId: text(input, "workspaceId"),
    subscriptionId: subscription.id,
    status: text(input, "subscriptionStatus"),
    templateRef: `${topic}-v1`,
  });
  await insertOutboxOnce(ctx, {
    id: `outbox:stripe:${providerEventId}:${topic}`,
    deduplicationKey: `stripe:${providerEventId}:${topic}`,
    topic,
    aggregateType: kind,
    aggregateId,
    payload,
    payloadHash: await sha256Hex(payload),
    now,
  });
  await insertAuditOnce(ctx, {
    id: `audit:stripe:${providerEventId}`,
    actorAccountId: text(input, "accountId"),
    workspaceId: text(input, "workspaceId"),
    action: "stripe.lifecycle.projected",
    targetType: kind,
    targetId: aggregateId,
    outcome: "succeeded",
    metadata: JSON.stringify({
      status: text(input, "subscriptionStatus"),
      accessStatus,
    }),
    occurredAt: now,
  });
  await markProviderEvent(ctx, event.document, "applied", now);
  return "applied";
}

async function applyStripeAdjustment(
  ctx: MutationCtx,
  input: Input,
): Promise<"applied" | "duplicate" | "ignored"> {
  const providerEventId = text(input, "providerEventId");
  const event = await acceptProviderEvent(ctx, {
    providerKind: "stripe",
    providerEventId,
    aggregateType: "adjustment",
    aggregateId: text(input, "stripeAdjustmentId"),
    eventType: text(input, "providerEventType"),
    occurredAt: number(input, "providerOccurredAt"),
    receivedAt: number(input, "receivedAt"),
    payloadHash: sha256(input, "payloadHash"),
  });
  if (event.duplicate) return "duplicate";

  const paymentIntentId = text(input, "stripePaymentIntentId");
  const purchase = await ctx.db
    .query("purchases")
    .withIndex("by_provider_payment_intent", (q) =>
      q
        .eq("billingProvider", "stripe")
        .eq("providerPaymentIntentId", paymentIntentId))
    .unique();
  const invoice = await ctx.db
    .query("invoices")
    .withIndex("by_provider_payment_intent", (q) =>
      q
        .eq("billingProvider", "stripe")
        .eq("providerPaymentIntentId", paymentIntentId))
    .unique();
  if (Number(Boolean(purchase)) + Number(Boolean(invoice)) !== 1) {
    throw new Error("Stripe adjustment target is unavailable");
  }

  const subscription = invoice?.subscriptionId
    ? await byId(ctx, "subscriptions", invoice.subscriptionId)
    : null;
  const accountId = purchase?.accountId ?? subscription?.accountId ?? null;
  if (!accountId) {
    throw new Error("Stripe adjustment account is unavailable");
  }
  const workspaceId = purchase?.workspaceId ?? invoice!.workspaceId;
  const providerOccurredAt = number(input, "providerOccurredAt");
  const adjustmentId = text(input, "stripeAdjustmentId");
  const existingAdjustment = await ctx.db
    .query("billingAdjustments")
    .withIndex("by_provider_adjustment", (q) =>
      q
        .eq("billingProvider", "stripe")
        .eq("providerAdjustmentId", adjustmentId))
    .unique();
  if (
    existingAdjustment
    && existingAdjustment.providerOccurredAt >= providerOccurredAt
  ) {
    await markProviderEvent(ctx, event.document, "ignored", Date.now());
    return "ignored";
  }

  const now = Date.now();
  const adjustmentRecordId =
    existingAdjustment?.id ?? `adjustment:stripe:${adjustmentId}`;
  await upsert(ctx, "billingAdjustments", existingAdjustment, {
    id: adjustmentRecordId,
    billingProvider: "stripe",
    providerAdjustmentId: adjustmentId,
    workspaceId,
    purchaseId: purchase?.id ?? null,
    invoiceId: invoice?.id ?? null,
    kind: text(input, "kind"),
    status: text(input, "adjustmentStatus"),
    currency: text(input, "currency"),
    amountMinor: number(input, "amountMinor"),
    providerOccurredAt,
    createdAt: existingAdjustment?.createdAt ?? now,
    updatedAt: now,
  });

  const kind = text(input, "kind");
  const status = text(input, "adjustmentStatus");
  const accessAction = text(input, "accessAction");
  const relatedAdjustments = purchase
    ? await ctx.db
      .query("billingAdjustments")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", purchase.id))
      .collect()
    : await ctx.db
      .query("billingAdjustments")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice!.id))
      .collect();
  const hasOutstandingChargeback = relatedAdjustments.some((adjustment) =>
    adjustment.kind === "chargeback"
    && ["pending", "processed"].includes(adjustment.status)
  );
  let projectedPurchaseStatus = purchase?.status ?? null;
  if (purchase) {
    let purchaseStatus = purchase.status;
    if (
      kind === "refund"
      && status === "processed"
      && boolean(input, "fullRefund")
    ) {
      purchaseStatus = "refunded";
    } else if (
      kind === "refund"
      && status === "processed"
      && purchase.status === "completed"
    ) {
      purchaseStatus = "partially_refunded";
    } else if (
      kind === "chargeback"
      && ["pending", "processed"].includes(status)
    ) {
      purchaseStatus = "disputed";
    } else if (
      kind === "chargeback_reversal"
      && status === "reversed"
      && !hasOutstandingChargeback
    ) {
      purchaseStatus = "completed";
    }
    projectedPurchaseStatus = purchaseStatus;
    await ctx.db.patch(purchase._id, {
      status: purchaseStatus,
      providerOccurredAt: Math.max(
        purchase.providerOccurredAt,
        providerOccurredAt,
      ),
      updatedAt: now,
    });
  }
  if (
    invoice
    && kind === "refund"
    && status === "processed"
    && boolean(input, "fullRefund")
  ) {
    await ctx.db.patch(invoice._id, {
      status: "refunded",
      providerOccurredAt: Math.max(
        invoice.providerOccurredAt,
        providerOccurredAt,
      ),
      updatedAt: now,
    });
  }
  const restoreAllowed = accessAction !== "restore"
    || (
      !hasOutstandingChargeback
      && (
        purchase
          ? ["completed", "partially_refunded"].includes(
            projectedPurchaseStatus ?? "",
          )
          : subscription?.status === "active"
      )
    );

  const targetLicences = purchase
    ? await ctx.db
      .query("licences")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", purchase.id))
      .collect()
    : subscription
      ? await ctx.db
        .query("licences")
        .withIndex("by_subscription", (q) =>
          q.eq("subscriptionId", subscription.id))
        .collect()
      : [];
  for (const licence of targetLicences) {
    const nextStatus = accessAction === "revoke"
      ? "revoked"
      : accessAction === "suspend" && licence.status !== "revoked"
        ? "suspended"
        : accessAction === "restore"
            && restoreAllowed
            && licence.status === "suspended"
          ? "active"
          : licence.status;
    await ctx.db.patch(licence._id, { status: nextStatus, updatedAt: now });
    const entitlements = await ctx.db
      .query("entitlements")
      .withIndex("by_licence", (q) => q.eq("licenceId", licence.id))
      .collect();
    for (const entitlement of entitlements) {
      const entitlementStatus = accessAction === "revoke"
        ? "revoked"
        : accessAction === "suspend" && entitlement.status !== "revoked"
          ? "suspended"
          : accessAction === "restore"
              && restoreAllowed
              && entitlement.status === "suspended"
              && nextStatus === "active"
            ? "active"
            : entitlement.status;
      await ctx.db.patch(entitlement._id, {
        status: entitlementStatus,
        sourceEventId: accessAction === "unchanged"
          ? entitlement.sourceEventId
          : event.document.id,
        updatedAt: now,
      });
      if (["suspend", "revoke"].includes(accessAction)) {
        await revokeOpenGrants(ctx, entitlement.id, now);
      }
    }
    if (accessAction === "revoke") {
      const seats = await ctx.db
        .query("licenceSeats")
        .withIndex("by_licence", (q) => q.eq("licenceId", licence.id))
        .collect();
      for (const seat of seats) {
        await ctx.db.patch(seat._id, {
          status: "revoked",
          revokedAt: seat.revokedAt ?? now,
          updatedAt: now,
        });
      }
    }
  }

  const notificationPayload = JSON.stringify({
    accountId,
    workspaceId,
    adjustmentId: adjustmentRecordId,
    kind,
    status,
    accessAction,
    templateRef: "refund-updated-v1",
  });
  await insertOutboxOnce(ctx, {
    id: `outbox:stripe:${providerEventId}:refund-workflow`,
    deduplicationKey: `stripe:${providerEventId}:refund-workflow`,
    topic: "commerce.refund.updated",
    aggregateType: "adjustment",
    aggregateId: adjustmentRecordId,
    payload: notificationPayload,
    payloadHash: await sha256Hex(notificationPayload),
    now,
  });
  await insertAuditOnce(ctx, {
    id: `audit:stripe:${providerEventId}`,
    actorAccountId: accountId,
    workspaceId,
    action: "stripe.adjustment.projected",
    targetType: "billing_adjustment",
    targetId: adjustmentRecordId,
    outcome: "succeeded",
    metadata: JSON.stringify({
      eventType: text(input, "providerEventType"),
      status,
      accessAction,
    }),
    occurredAt: now,
  });
  await markProviderEvent(ctx, event.document, "applied", now);
  return "applied";
}

async function provisionWorkOSIdentity(
  ctx: MutationCtx,
  input: Input,
): Promise<void> {
  const now = Date.now();
  const accountId = text(input, "accountId");
  const workspaceId = text(input, "workspaceId");
  const userId = text(input, "userId");
  const organizationId = nullableText(input, "organizationId");
  const providerMembershipId = nullableText(input, "providerMembershipId");

  const account = await ctx.db
    .query("accounts")
    .withIndex("by_identity", (q) =>
      q.eq("identityProvider", "workos").eq("identitySubject", userId))
    .unique();
  await upsert(ctx, "accounts", account, {
    id: account?.id ?? accountId,
    identityProvider: "workos",
    identitySubject: userId,
    emailHash: text(input, "emailHash"),
    status: account?.status === "deleted" ? "deleted" : "active",
    deactivatedAt: account?.status === "deleted"
      ? account.deactivatedAt ?? null
      : null,
    createdAt: account?.createdAt ?? now,
    updatedAt: now,
  });

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .unique();
  await upsert(ctx, "profiles", profile, {
    accountId,
    displayName: nullableText(input, "displayName"),
    locale: nullableText(input, "locale"),
    timeZone: profile?.timeZone ?? null,
    createdAt: profile?.createdAt ?? now,
    updatedAt: now,
  });

  const workspace = await byId(ctx, "workspaces", workspaceId);
  await upsert(ctx, "workspaces", workspace, {
    id: workspaceId,
    identityProvider: "workos",
    providerOrganizationId: organizationId,
    name: text(input, "workspaceLabel"),
    status: workspace?.status === "deleted" ? "deleted" : "active",
    createdAt: workspace?.createdAt ?? now,
    updatedAt: now,
  });

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_workspace_account", (q) =>
      q.eq("workspaceId", workspaceId).eq("accountId", accountId))
    .unique();
  const currentSince = number(input, "currentSince");
  if (!membership || membership.currentSince <= currentSince) {
    await upsert(ctx, "memberships", membership, {
      id: membership?.id
        ?? (providerMembershipId
          ? `membership:workos:${providerMembershipId}`
          : `membership:workos-personal:${userId}`),
      workspaceId,
      accountId,
      providerMembershipId:
        providerMembershipId ?? membership?.providerMembershipId ?? null,
      role: text(input, "role"),
      status: membership?.status === "revoked" ? "revoked" : "active",
      currentSince,
      revokedAt: membership?.status === "revoked"
        ? membership.revokedAt ?? null
        : null,
      createdAt: membership?.createdAt ?? now,
      updatedAt: now,
    });
  }
}

async function resolveWorkOSIdentity(
  ctx: MutationCtx,
  input: Input,
): Promise<Record<string, unknown> | null> {
  const accountId = text(input, "accountId");
  const workspaceId = text(input, "workspaceId");
  const account = await byId(ctx, "accounts", accountId);
  const workspace = await byId(ctx, "workspaces", workspaceId);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_workspace_account", (q) =>
      q.eq("workspaceId", workspaceId).eq("accountId", accountId))
    .unique();
  const organizationId = nullableText(input, "organizationId");
  const providerMembershipId = nullableText(input, "providerMembershipId");
  const role = text(input, "role");
  if (
    !account
    || !workspace
    || !membership
    || account.identityProvider !== "workos"
    || account.identitySubject !== text(input, "userId")
    || account.status !== "active"
    || workspace.identityProvider !== "workos"
    || (workspace.providerOrganizationId ?? null) !== organizationId
    || workspace.status !== "active"
    || membership.status !== "active"
    || membership.role !== role
    || (
      providerMembershipId
      && membership.providerMembershipId !== providerMembershipId
    )
  ) {
    return null;
  }
  return {
    status: "authenticated",
    accountId,
    workspaceId,
    workspaceLabel: workspace.name,
    role,
    sessionExpiresAt: number(input, "sessionExpiresAt"),
  };
}

async function applyWorkOSWebhook(
  ctx: MutationCtx,
  input: Input,
): Promise<"applied" | "duplicate"> {
  const providerEventId = text(input, "providerEventId");
  const kind = text(input, "kind");
  const aggregateId = kind === "user"
    ? text(input, "userId")
    : kind === "organization"
      ? text(input, "organizationId")
      : kind === "membership"
        ? text(input, "providerMembershipId")
        : text(input, "providerInvitationId");
  const event = await acceptProviderEvent(ctx, {
    providerKind: "workos",
    providerEventId,
    aggregateType: kind,
    aggregateId,
    eventType: text(input, "providerEventType"),
    occurredAt: number(input, "providerOccurredAt"),
    receivedAt: number(input, "receivedAt"),
    payloadHash: sha256(input, "payloadHash"),
  });
  if (event.duplicate) return "duplicate";
  const now = Date.now();
  const occurredAt = number(input, "providerOccurredAt");

  const newerEvents = await ctx.db
    .query("providerEvents")
    .withIndex("by_aggregate", (q) =>
      q
        .eq("providerKind", "workos")
        .eq("aggregateType", kind)
        .eq("aggregateId", aggregateId)
        .gt("occurredAt", occurredAt))
    .collect();
  if (newerEvents.some((candidate) => candidate.status === "applied")) {
    await markProviderEvent(ctx, event.document, "applied", now);
    return "applied";
  }

  if (kind === "user") {
    await applyWorkOSUser(ctx, input, now);
  } else if (kind === "organization") {
    await applyWorkOSOrganization(ctx, input, now);
  } else if (kind === "invitation") {
    await recordWorkOSInvitation(ctx, input, now);
  } else {
    await applyWorkOSMembership(ctx, input, now);
  }
  await insertAuditOnce(ctx, {
    id: `audit:workos:${providerEventId}`,
    actorAccountId: kind === "organization"
      ? null
      : nullableText(input, "accountId")
        ?? nullableText(input, "invitedByAccountId"),
    workspaceId: kind === "user" ? null : nullableText(input, "workspaceId"),
    action: "workos.identity.projected",
    targetType: kind,
    targetId: aggregateId,
    outcome: "succeeded",
    metadata: JSON.stringify({
      eventType: text(input, "providerEventType"),
      action: text(input, "action"),
    }),
    occurredAt: now,
  });
  await markProviderEvent(ctx, event.document, "applied", now);
  return "applied";
}

async function recordWorkOSInvitation(
  ctx: MutationCtx,
  input: Input,
  recordedAt = Date.now(),
): Promise<void> {
  const providerInvitationId = text(input, "providerInvitationId");
  const id = `invitation:workos:${providerInvitationId}`;
  const workspaceId = text(input, "workspaceId");
  const occurredAt =
    nullableNumber(input, "providerOccurredAt") ?? recordedAt;
  const existing = await byId(ctx, "invitations", id);
  if (existing && existing.updatedAt > occurredAt) return;
  const status = text(input, "invitationStatus");
  await upsert(ctx, "invitations", existing, {
    id,
    workspaceId,
    invitedEmailHash: sha256(input, "invitedEmailHash"),
    role: text(input, "role"),
    status,
    invitedByAccountId: nullableText(input, "invitedByAccountId"),
    acceptedByAccountId: nullableText(input, "acceptedByAccountId"),
    expiresAt: number(input, "expiresAt"),
    acceptedAt: nullableNumber(input, "acceptedAt"),
    createdAt: existing?.createdAt
      ?? nullableNumber(input, "invitationCreatedAt")
      ?? occurredAt,
    updatedAt: occurredAt,
  });
  await insertAuditOnce(ctx, {
    id:
      `audit:workos-invitation:${providerInvitationId}:${status}:${occurredAt}`,
    actorAccountId: nullableText(input, "invitedByAccountId"),
    workspaceId,
    action: "workos.invitation.recorded",
    targetType: "invitation",
    targetId: id,
    outcome: "succeeded",
    metadata: JSON.stringify({ status, role: text(input, "role") }),
    occurredAt: recordedAt,
  });
}

async function applyWorkOSUser(
  ctx: MutationCtx,
  input: Input,
  now: number,
): Promise<void> {
  const accountId = text(input, "accountId");
  const userId = text(input, "userId");
  const account = await byId(ctx, "accounts", accountId);
  if (text(input, "action") === "delete") {
    if (account) {
      await ctx.db.patch(account._id, {
        status: "deleted",
        deactivatedAt: number(input, "providerOccurredAt"),
        updatedAt: now,
      });
    }
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .collect();
    for (const membership of memberships) {
      await ctx.db.patch(membership._id, {
        status: "revoked",
        revokedAt: number(input, "providerOccurredAt"),
        currentSince: number(input, "providerOccurredAt"),
        updatedAt: now,
      });
    }
    await revokeAccountAccess(ctx, accountId, now);
    return;
  }
  await upsert(ctx, "accounts", account, {
    id: account?.id ?? accountId,
    identityProvider: "workos",
    identitySubject: userId,
    emailHash: text(input, "emailHash"),
    status: account?.status === "deleted" ? "deleted" : "active",
    deactivatedAt: account?.status === "deleted"
      ? account.deactivatedAt ?? null
      : null,
    createdAt: account?.createdAt ?? now,
    updatedAt: now,
  });
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .unique();
  await upsert(ctx, "profiles", profile, {
    accountId,
    displayName: nullableText(input, "displayName"),
    locale: nullableText(input, "locale"),
    timeZone: profile?.timeZone ?? null,
    createdAt: profile?.createdAt ?? now,
    updatedAt: now,
  });
}

async function applyWorkOSOrganization(
  ctx: MutationCtx,
  input: Input,
  now: number,
): Promise<void> {
  const workspaceId = text(input, "workspaceId");
  const workspace = await byId(ctx, "workspaces", workspaceId);
  const deleted = text(input, "action") === "delete";
  await upsert(ctx, "workspaces", workspace, {
    id: workspaceId,
    identityProvider: "workos",
    providerOrganizationId: text(input, "organizationId"),
    name: text(input, "workspaceLabel"),
    status: deleted ? "deleted" : workspace?.status === "deleted"
      ? "deleted"
      : "active",
    createdAt: workspace?.createdAt ?? now,
    updatedAt: now,
  });
  if (deleted) {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    for (const membership of memberships) {
      await ctx.db.patch(membership._id, {
        status: "revoked",
        revokedAt: number(input, "providerOccurredAt"),
        updatedAt: now,
      });
    }
  }
}

async function applyWorkOSMembership(
  ctx: MutationCtx,
  input: Input,
  now: number,
): Promise<void> {
  const workspaceId = text(input, "workspaceId");
  const accountId = text(input, "accountId");
  const providerMembershipId = text(input, "providerMembershipId");
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_workspace_account", (q) =>
      q.eq("workspaceId", workspaceId).eq("accountId", accountId))
    .unique();
  const deleted = text(input, "action") === "delete";
  await upsert(ctx, "memberships", membership, {
    id: membership?.id ?? `membership:workos:${providerMembershipId}`,
    workspaceId,
    accountId,
    providerMembershipId,
    role: text(input, "role"),
    status: deleted ? "revoked" : text(input, "membershipStatus"),
    currentSince: number(input, "providerOccurredAt"),
    revokedAt: deleted ? number(input, "providerOccurredAt") : null,
    createdAt: membership?.createdAt ?? now,
    updatedAt: now,
  });
  if (deleted) {
    await revokeWorkspaceAccountAccess(ctx, workspaceId, accountId, now);
  }
}

async function registerDownloadGrant(
  ctx: MutationCtx,
  input: Input,
): Promise<void> {
  const accountId = text(input, "accountId");
  const createdAt = number(input, "createdAt");
  const recent = await ctx.db
    .query("downloadGrants")
    .withIndex("by_account_created", (q) =>
      q.eq("accountId", accountId).gte("createdAt", createdAt - 60_000))
    .collect();
  if (recent.length >= 10) {
    throw new Error("Download grant could not be registered");
  }
  const existingNonce = await ctx.db
    .query("downloadGrants")
    .withIndex("by_nonce_hash", (q) =>
      q.eq("nonceHash", text(input, "nonceHash")))
    .unique();
  if (existingNonce) {
    throw new Error("Download grant could not be registered");
  }
  await ctx.db.insert("downloadGrants", {
    id: text(input, "grantId"),
    nonceHash: text(input, "nonceHash"),
    accountId,
    workspaceId: text(input, "workspaceId"),
    releaseId: text(input, "releaseId"),
    entitlementId: text(input, "entitlementId"),
    requestFingerprintHash: nullableText(input, "fingerprintHash"),
    expiresAt: number(input, "expiresAt"),
    consumedAt: null,
    revokedAt: null,
    createdAt,
  });
}

async function findAuthorizedRelease(
  ctx: MutationCtx,
  input: Input,
): Promise<Record<string, unknown> | null> {
  return authorizeRelease(ctx, input, null);
}

async function consumeAuthorizedRelease(
  ctx: MutationCtx,
  input: Input,
): Promise<Record<string, unknown> | null> {
  const grant = await ctx.db
    .query("downloadGrants")
    .withIndex("by_nonce_hash", (q) =>
      q.eq("nonceHash", text(input, "nonceHash")))
    .unique();
  const now = number(input, "now");
  if (
    !grant
    || grant.accountId !== text(input, "accountId")
    || grant.workspaceId !== text(input, "workspaceId")
    || grant.releaseId !== text(input, "releaseId")
    || grant.entitlementId !== text(input, "entitlementId")
    || grant.consumedAt !== null
    || grant.revokedAt !== null
    || grant.expiresAt <= now
  ) {
    return null;
  }
  const authorized = await authorizeRelease(ctx, input, grant.entitlementId);
  if (!authorized) return null;
  await ctx.db.patch(grant._id, { consumedAt: now });
  await insertAuditOnce(ctx, {
    id: `audit:download:${grant.id}`,
    actorAccountId: grant.accountId,
    workspaceId: grant.workspaceId,
    action: "download.consumed",
    targetType: "release",
    targetId: grant.releaseId,
    outcome: "succeeded",
    metadata: null,
    occurredAt: now,
  });
  return authorized;
}

async function authorizeRelease(
  ctx: MutationCtx,
  input: Input,
  requiredEntitlementId: string | null,
): Promise<Record<string, unknown> | null> {
  const accountId = text(input, "accountId");
  const workspaceId = text(input, "workspaceId");
  const releaseId = text(input, "releaseId");
  const now = number(input, "now");
  const [account, workspace, release, membership] = await Promise.all([
    byId(ctx, "accounts", accountId),
    byId(ctx, "workspaces", workspaceId),
    byId(ctx, "releaseRecords", releaseId),
    ctx.db
      .query("memberships")
      .withIndex("by_workspace_account", (q) =>
        q.eq("workspaceId", workspaceId).eq("accountId", accountId))
      .unique(),
  ]);
  if (
    !account
    || account.status !== "active"
    || !workspace
    || workspace.status !== "active"
    || !release
    || release.status !== "published"
    || release.releasedAt == null
    || release.releasedAt > now
    || !membership
    || membership.status !== "active"
    || membership.role !== text(input, "role")
  ) {
    return null;
  }
  const entitlements = await ctx.db
    .query("entitlements")
    .withIndex("by_workspace_product_status", (q) =>
      q
        .eq("workspaceId", workspaceId)
        .eq("productRef", release.productRef)
        .eq("status", "active"))
    .collect();
  for (const entitlement of entitlements) {
    if (
      (requiredEntitlementId && entitlement.id !== requiredEntitlementId)
      || (
        entitlement.accountId !== null
        && entitlement.accountId !== undefined
        && entitlement.accountId !== accountId
      )
      || entitlement.validFrom > now
      || (entitlement.validUntil != null && entitlement.validUntil <= now)
      || (
        entitlement.updatesUntil != null
        && release.releasedAt > entitlement.updatesUntil
      )
    ) continue;
    const licence = await byId(ctx, "licences", entitlement.licenceId);
    if (
      !licence
      || licence.workspaceId !== workspaceId
      || licence.status !== "active"
      || licence.startsAt > now
      || (licence.expiresAt != null && licence.expiresAt <= now)
      || (
        licence.updatesUntil != null
        && release.releasedAt > licence.updatesUntil
      )
    ) continue;
    const seat = await ctx.db
      .query("licenceSeats")
      .withIndex("by_licence_account", (q) =>
        q.eq("licenceId", licence.id).eq("accountId", accountId))
      .unique();
    if (!seat || seat.status !== "active") continue;
    return {
      releaseId: release.id,
      entitlementId: entitlement.id,
      productRef: release.productRef,
      version: release.version,
      storageKey: release.storageKey,
      checksumSha256: release.checksumSha256,
      sizeBytes: release.sizeBytes,
    };
  }
  return null;
}

async function findBillingCustomer(
  ctx: MutationCtx,
  input: Input,
): Promise<string | null> {
  const customer = await ctx.db
    .query("billingCustomers")
    .withIndex("by_provider_workspace", (q) =>
      q
        .eq("billingProvider", "stripe")
        .eq("workspaceId", text(input, "workspaceId")))
    .unique();
  if (
    !customer
    || customer.status !== "active"
    || (
      customer.accountId !== text(input, "accountId")
      && !["owner", "admin", "billing"].includes(text(input, "role"))
    )
  ) {
    return null;
  }
  return customer.providerCustomerId;
}

async function loadAccountSection(
  ctx: MutationCtx,
  input: Input,
): Promise<Array<Record<string, unknown>>> {
  const route = text(input, "route");
  const access = asRecord(input.access);
  const accountId = text(access, "accountId");
  const workspaceId = text(access, "workspaceId");
  const role = text(access, "role");
  const now = number(input, "now");
  const account = await byId(ctx, "accounts", accountId);
  const workspace = await byId(ctx, "workspaces", workspaceId);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_workspace_account", (q) =>
      q.eq("workspaceId", workspaceId).eq("accountId", accountId))
    .unique();
  if (
    !account
    || account.status !== "active"
    || !workspace
    || workspace.status !== "active"
    || !membership
    || membership.status !== "active"
    || membership.role !== role
  ) return [];

  switch (route) {
    case "overview":
      return accountOverview(ctx, accountId, workspaceId, role, now);
    case "purchases":
      return accountPurchases(ctx, accountId, workspaceId, role);
    case "licences":
      return accountLicences(ctx, accountId, workspaceId);
    case "downloads":
      return accountDownloads(ctx, accountId, workspaceId, role, now);
    case "billing":
      return accountBilling(ctx, accountId, workspaceId, role);
    case "team":
      return accountTeam(ctx, workspace);
    case "members":
      return accountMembers(ctx, workspaceId);
    case "invitations":
      return accountInvitations(ctx, workspaceId);
    case "profile":
      return accountProfile(ctx, accountId);
    case "security":
      return [{
        id: "identity",
        label: "Identity provider",
        value: titleCase(account.identityProvider),
        status: "active",
      }, {
        id: "account",
        label: "Account state",
        value: titleCase(account.status),
        status: statusTone(account.status),
      }, {
        id: "membership",
        label: "Workspace access",
        value: titleCase(membership.status),
        detail: `${titleCase(membership.role)} role`,
        status: statusTone(membership.status),
      }];
    case "privacy":
      return accountPrivacy(ctx, accountId);
    case "data-export":
      return accountExports(ctx, accountId);
    case "deletion":
      return accountDeletions(ctx, accountId);
    default:
      return [];
  }
}

async function accountOverview(
  ctx: MutationCtx,
  accountId: string,
  workspaceId: string,
  role: string,
  now: number,
): Promise<Array<Record<string, unknown>>> {
  const workspace = await byId(ctx, "workspaces", workspaceId);
  if (!workspace) return [];
  const purchases = await ctx.db
    .query("purchases")
    .withIndex("by_workspace_status", (q) =>
      q.eq("workspaceId", workspaceId).eq("status", "completed"))
    .collect();
  const licences = (await ctx.db
    .query("licences")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect()).filter((licence) =>
      licence.status === "active"
      && licence.startsAt <= now
      && (licence.expiresAt == null || licence.expiresAt > now)
    );
  const downloads = await accountDownloads(
    ctx,
    accountId,
    workspaceId,
    role,
    now,
  );
  return [
    item("workspace", "Workspace", workspace.name),
    item("role", "Current role", titleCase(role), { status: "active" }),
    item("purchases", "Completed purchases", String(purchases.length), {
      href: "/account/purchases",
    }),
    item("licences", "Active licences", String(licences.length), {
      href: "/account/licences",
    }),
    item("downloads", "Available releases", String(downloads.length), {
      href: "/account/downloads",
    }),
  ];
}

async function accountPurchases(
  ctx: MutationCtx,
  accountId: string,
  workspaceId: string,
  role: string,
): Promise<Array<Record<string, unknown>>> {
  const rows = (await ctx.db
    .query("purchases")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect())
    .filter((row) =>
      row.accountId === accountId
      || ["owner", "admin", "billing"].includes(role)
    )
    .sort((a, b) => b.purchasedAt - a.purchasedAt)
    .slice(0, 50);
  return rows.map((row) =>
    item(row.id, productLabel(row.productRef), money(
      row.amountMinor,
      row.currency,
    ), {
      detail: `${titleCase(row.status)} · ${date(row.purchasedAt)}`,
      status: statusTone(row.status),
    }));
}

async function accountLicences(
  ctx: MutationCtx,
  accountId: string,
  workspaceId: string,
): Promise<Array<Record<string, unknown>>> {
  const seats = await ctx.db
    .query("licenceSeats")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  const rows = [];
  for (const seat of seats) {
    const licence = await byId(ctx, "licences", seat.licenceId);
    if (!licence || licence.workspaceId !== workspaceId) continue;
    rows.push(item(
      licence.id,
      productLabel(licence.productRef),
      titleCase(licence.status),
      {
        detail: [
          seat.status === "active" ? "Seat assigned" : "Seat revoked",
          licence.seatLimit == null
            ? null
            : `${licence.seatLimit} seat limit`,
          licence.updatesUntil == null
            ? "Updates included"
            : `Updates through ${date(licence.updatesUntil)}`,
          licence.expiresAt == null
            ? null
            : `Access through ${date(licence.expiresAt)}`,
        ].filter(Boolean).join(" · "),
        status: statusTone(licence.status),
      },
    ));
  }
  return rows.slice(0, 50);
}

async function accountDownloads(
  ctx: MutationCtx,
  accountId: string,
  workspaceId: string,
  role: string,
  now: number,
): Promise<Array<Record<string, unknown>>> {
  const releases = (await ctx.db
    .query("releaseRecords")
    .withIndex("by_status", (q) => q.eq("status", "published"))
    .collect())
    .filter((release) => release.releasedAt != null && release.releasedAt <= now)
    .sort((a, b) => (b.releasedAt ?? 0) - (a.releasedAt ?? 0));
  const items = [];
  for (const release of releases) {
    const authorized = await authorizeRelease(ctx, {
      accountId,
      workspaceId,
      role,
      releaseId: release.id,
      now,
    }, null);
    if (!authorized) continue;
    items.push(item(
      release.id,
      productLabel(release.productRef),
      `Version ${release.version}`,
      {
        detail:
          `${bytes(release.sizeBytes)} · released ${date(release.releasedAt!)}`,
        status: "active",
        downloadReleaseId: release.id,
      },
    ));
  }
  return items.slice(0, 50);
}

async function accountBilling(
  ctx: MutationCtx,
  accountId: string,
  workspaceId: string,
  role: string,
): Promise<Array<Record<string, unknown>>> {
  const subscriptions = (await ctx.db
    .query("subscriptions")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect())
    .filter((row) =>
      row.accountId === accountId
      || ["owner", "admin", "billing"].includes(role)
    )
    .map((row) => ({
      id: row.id,
      label: row.planRef,
      status: row.status,
      timestamp: row.currentPeriodEndsAt,
      kind: "subscription",
    }));
  const invoices = ["owner", "admin", "billing"].includes(role)
    ? (await ctx.db
      .query("invoices")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect()).map((row) => ({
        id: row.id,
        label: `${row.currency} ${(row.totalMinor / 100).toFixed(2)}`,
        status: row.status,
        timestamp: row.issuedAt,
        kind: "invoice",
      }))
    : [];
  return [...subscriptions, ...invoices]
    .filter((row) => row.timestamp != null)
    .sort((a, b) => b.timestamp! - a.timestamp!)
    .slice(0, 50)
    .map((row) =>
      item(
        row.id,
        row.kind === "subscription"
          ? productLabel(row.label)
          : `Invoice ${date(row.timestamp!)}`,
        titleCase(row.status),
        {
          detail: row.kind === "subscription"
            ? `Current period through ${date(row.timestamp!)}`
            : row.label,
          status: statusTone(row.status),
        },
      ));
}

async function accountTeam(
  ctx: MutationCtx,
  workspace: DataModel["workspaces"]["document"],
): Promise<Array<Record<string, unknown>>> {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace.id))
    .collect();
  return [
    item("workspace", "Workspace", workspace.name, {
      detail: titleCase(workspace.status),
      status: statusTone(workspace.status),
    }),
    item(
      "active-members",
      "Active members",
      String(memberships.filter((row) => row.status === "active").length),
      { href: "/account/team/members" },
    ),
    item(
      "invitations",
      "Pending invitations",
      String(memberships.filter((row) => row.status === "invited").length),
      { href: "/account/team/invitations" },
    ),
  ];
}

async function accountMembers(
  ctx: MutationCtx,
  workspaceId: string,
): Promise<Array<Record<string, unknown>>> {
  const memberships = (await ctx.db
    .query("memberships")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect())
    .sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
    .slice(0, 100);
  const items = [];
  for (const membership of memberships) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_account", (q) =>
        q.eq("accountId", membership.accountId))
      .unique();
    items.push(item(
      membership.id,
      profile?.displayName ?? "Workspace member",
      titleCase(membership.role),
      {
        detail: titleCase(membership.status),
        status: statusTone(membership.status),
      },
    ));
  }
  return items;
}

async function accountInvitations(
  ctx: MutationCtx,
  workspaceId: string,
): Promise<Array<Record<string, unknown>>> {
  const rows = (await ctx.db
    .query("invitations")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);
  return rows.map((row, index) =>
    item(
      row.id,
      `Invitation ${index + 1}`,
      titleCase(row.status),
      {
        detail: `${titleCase(row.role)} · expires ${date(row.expiresAt)}`,
        status: statusTone(row.status),
      },
    ));
}

async function accountProfile(
  ctx: MutationCtx,
  accountId: string,
): Promise<Array<Record<string, unknown>>> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .unique();
  if (!profile) return [];
  return [
    item("display-name", "Display name", profile.displayName ?? "Not set"),
    item("locale", "Locale", profile.locale ?? "Automatic"),
    item("time-zone", "Time zone", profile.timeZone ?? "Automatic"),
  ];
}

async function accountPrivacy(
  ctx: MutationCtx,
  accountId: string,
): Promise<Array<Record<string, unknown>>> {
  return (await ctx.db
    .query("consentRecords")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect())
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, 50)
    .map((row) =>
      item(row.id, productLabel(row.purpose), titleCase(row.state), {
        detail: `Notice ${row.noticeVersion} · ${date(row.occurredAt)}`,
        status: statusTone(row.state),
      }));
}

async function accountExports(
  ctx: MutationCtx,
  accountId: string,
): Promise<Array<Record<string, unknown>>> {
  return (await ctx.db
    .query("dataExports")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect())
    .sort((a, b) => b.requestedAt - a.requestedAt)
    .slice(0, 20)
    .map((row, index) =>
      item(row.id, `Export ${index + 1}`, titleCase(row.status), {
        detail: [
          `Requested ${date(row.requestedAt)}`,
          row.expiresAt == null ? null : `Deadline ${date(row.expiresAt)}`,
        ].filter(Boolean).join(" · "),
        status: statusTone(row.status),
        ...(["ready", "downloaded"].includes(row.status)
          ? { href: `/api/privacy/exports/${encodeURIComponent(row.id)}` }
          : {}),
      }));
}

async function accountDeletions(
  ctx: MutationCtx,
  accountId: string,
): Promise<Array<Record<string, unknown>>> {
  return (await ctx.db
    .query("dataDeletions")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect())
    .sort((a, b) => b.requestedAt - a.requestedAt)
    .slice(0, 20)
    .map((row, index) =>
      item(
        row.id,
        `Deletion request ${index + 1}`,
        titleCase(row.status),
        {
          detail: [
            `Requested ${date(row.requestedAt)}`,
            row.retentionUntil == null
              ? null
              : `Deadline ${date(row.retentionUntil)}`,
          ].filter(Boolean).join(" · "),
          status: statusTone(row.status),
          ...(["requested", "verified", "blocked"].includes(row.status)
            ? { cancelDeletionId: row.id }
            : {}),
        },
      ));
}

async function requestDataExport(
  ctx: MutationCtx,
  input: Input,
): Promise<{ id: string; expiresAt: number }> {
  const access = asRecord(input.access);
  const accountId = text(access, "accountId");
  const workspaceId = text(access, "workspaceId");
  const id = text(input, "id");
  const now = number(input, "now");
  const expiresAt = number(input, "expiresAt");
  const account = await byId(ctx, "accounts", accountId);
  const recent = (await ctx.db
    .query("dataExports")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect()).filter((row) => row.requestedAt > now - 86_400_000);
  if (!account || account.status !== "active" || recent.length >= 3) {
    throw new Error("Data export request limit reached");
  }
  await ctx.db.insert("dataExports", {
    id,
    accountId,
    workspaceId,
    status: "ready",
    storageKey: null,
    checksumSha256: null,
    requestedAt: now,
    completedAt: now,
    expiresAt,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
  });
  const payload = JSON.stringify({
    accountId,
    exportId: id,
    state: "ready",
    templateRef: "product.data-export.v1",
  });
  await insertOutboxOnce(ctx, {
    id: `outbox:${id}:ready`,
    deduplicationKey: `${id}:ready`,
    topic: "privacy.data_export.updated",
    aggregateType: "data_export",
    aggregateId: id,
    payload,
    payloadHash: await sha256Hex(payload),
    now,
  });
  await insertAuditOnce(ctx, {
    id: `audit:${id}:requested`,
    actorAccountId: accountId,
    workspaceId,
    action: "privacy.data_export.requested",
    targetType: "data_export",
    targetId: id,
    outcome: "succeeded",
    metadata: "{}",
    occurredAt: now,
  });
  return { id, expiresAt };
}

async function readDataExport(
  ctx: MutationCtx,
  input: Input,
): Promise<Record<string, unknown> | null> {
  const access = asRecord(input.access);
  const accountId = text(access, "accountId");
  const exportId = text(input, "exportId");
  const now = number(input, "now");
  const dataExport = await byId(ctx, "dataExports", exportId);
  if (
    !dataExport
    || dataExport.accountId !== accountId
    || !["ready", "downloaded"].includes(dataExport.status)
    || dataExport.expiresAt == null
    || dataExport.expiresAt <= now
  ) {
    return null;
  }
  const account = await byId(ctx, "accounts", accountId);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .unique();
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  const membershipRows = [];
  for (const membership of memberships) {
    const workspace = await byId(ctx, "workspaces", membership.workspaceId);
    membershipRows.push({
      id: membership.id,
      workspaceId: membership.workspaceId,
      workspaceName: workspace?.name ?? "Deleted workspace",
      role: membership.role,
      status: membership.status,
      currentSince: membership.currentSince,
      revokedAt: membership.revokedAt ?? null,
    });
  }
  const purchases = await ctx.db
    .query("purchases")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  const workspaceIds = new Set(memberships.map((row) => row.workspaceId));
  const invoiceRows = [];
  for (const workspaceId of workspaceIds) {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    invoiceRows.push(...invoices.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      status: row.status,
      currency: row.currency,
      totalMinor: row.totalMinor,
      issuedAt: row.issuedAt ?? null,
      paidAt: row.paidAt ?? null,
    })));
  }
  const seats = await ctx.db
    .query("licenceSeats")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  const licenceRows = [];
  for (const seat of seats) {
    const licence = await byId(ctx, "licences", seat.licenceId);
    if (!licence) continue;
    licenceRows.push({
      id: licence.id,
      workspaceId: licence.workspaceId,
      productRef: licence.productRef,
      status: licence.status,
      startsAt: licence.startsAt,
      expiresAt: licence.expiresAt ?? null,
      updatesUntil: licence.updatesUntil ?? null,
      seatLimit: licence.seatLimit ?? null,
      seatStatus: seat.status,
      assignedAt: seat.assignedAt,
      revokedAt: seat.revokedAt ?? null,
    });
  }
  const consents = await ctx.db
    .query("consentRecords")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  const downloads = await ctx.db
    .query("downloadGrants")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  const audit = (await ctx.db
    .query("auditEvents")
    .withIndex("by_actor", (q) => q.eq("actorAccountId", accountId))
    .collect()).slice(0, 1_000);
  return {
    export: {
      id: dataExport.id,
      requestedAt: dataExport.requestedAt,
      expiresAt: dataExport.expiresAt,
    },
    account: account
      ? [{
          id: account.id,
          identityProvider: account.identityProvider,
          status: account.status,
          createdAt: account.createdAt,
          displayName: profile?.displayName ?? null,
          locale: profile?.locale ?? null,
          timeZone: profile?.timeZone ?? null,
        }]
      : [],
    memberships: membershipRows,
    purchases: purchases.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      productRef: row.productRef,
      status: row.status,
      currency: row.currency,
      amountMinor: row.amountMinor,
      purchasedAt: row.purchasedAt,
    })),
    subscriptions: subscriptions.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      planRef: row.planRef,
      status: row.status,
      currentPeriodStartsAt: row.currentPeriodStartsAt ?? null,
      currentPeriodEndsAt: row.currentPeriodEndsAt ?? null,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      canceledAt: row.canceledAt ?? null,
    })),
    invoices: invoiceRows,
    licences: licenceRows,
    consents: consents.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId ?? null,
      purpose: row.purpose,
      state: row.state,
      noticeVersion: row.noticeVersion,
      source: row.source,
      occurredAt: row.occurredAt,
      withdrawnAt: row.withdrawnAt ?? null,
    })),
    downloadHistory: downloads.map((row) => ({
      id: row.id,
      releaseId: row.releaseId,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      consumedAt: row.consumedAt ?? null,
      revokedAt: row.revokedAt ?? null,
    })),
    auditHistory: audit.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId ?? null,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      outcome: row.outcome,
      occurredAt: row.occurredAt,
    })),
  };
}

async function markDataExportDownloaded(
  ctx: MutationCtx,
  input: Input,
): Promise<void> {
  const access = asRecord(input.access);
  const accountId = text(access, "accountId");
  const workspaceId = text(access, "workspaceId");
  const exportId = text(input, "exportId");
  const now = number(input, "now");
  const dataExport = await byId(ctx, "dataExports", exportId);
  if (
    !dataExport
    || dataExport.accountId !== accountId
    || !["ready", "downloaded"].includes(dataExport.status)
    || dataExport.expiresAt == null
    || dataExport.expiresAt <= now
  ) {
    throw new Error("Data export is unavailable");
  }
  await ctx.db.patch(dataExport._id, {
    status: "downloaded",
    checksumSha256: sha256(input, "checksumSha256"),
    completedAt: dataExport.completedAt ?? now,
    updatedAt: now,
  });
  await insertAuditOnce(ctx, {
    id: text(input, "auditId"),
    actorAccountId: accountId,
    workspaceId,
    action: "privacy.data_export.downloaded",
    targetType: "data_export",
    targetId: exportId,
    outcome: "succeeded",
    metadata: JSON.stringify({
      checksumSha256: sha256(input, "checksumSha256"),
    }),
    occurredAt: now,
  });
}

async function requestAccountDeletion(
  ctx: MutationCtx,
  input: Input,
): Promise<Record<string, unknown>> {
  const access = asRecord(input.access);
  const accountId = text(access, "accountId");
  const workspaceId = text(access, "workspaceId");
  const existing = (await ctx.db
    .query("dataDeletions")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect()).find((row) =>
      ["requested", "verified", "queued", "processing", "blocked"].includes(
        row.status,
      )
    );
  if (existing) {
    if (!["verified", "blocked"].includes(existing.status)) {
      throw new Error("Account deletion request already active");
    }
    return {
      id: existing.id,
      status: existing.status,
      blockerCode: existing.blockerCode ?? null,
      retentionUntil: existing.retentionUntil ?? null,
    };
  }
  const blockerCode = await findDeletionBlocker(ctx, accountId);
  const status = blockerCode ? "blocked" : "verified";
  const now = number(input, "now");
  const retentionUntil = blockerCode ? null : now + 604_800_000;
  const id = text(input, "id");
  await ctx.db.insert("dataDeletions", {
    id,
    accountId,
    workspaceId,
    status,
    requestedAt: now,
    verifiedAt: status === "verified" ? now : null,
    retentionUntil,
    completedAt: null,
    blockerCode,
    createdAt: now,
    updatedAt: now,
  });
  const payload = JSON.stringify({
    accountId,
    deletionId: id,
    state: status,
    templateRef: "product.data-deletion.v1",
  });
  await insertOutboxOnce(ctx, {
    id: `outbox:${id}:${status}`,
    deduplicationKey: `${id}:${status}`,
    topic: "privacy.data_deletion.updated",
    aggregateType: "data_deletion",
    aggregateId: id,
    payload,
    payloadHash: await sha256Hex(payload),
    now,
  });
  await insertAuditOnce(ctx, {
    id: `audit:${id}:requested`,
    actorAccountId: accountId,
    workspaceId,
    action: "privacy.data_deletion.requested",
    targetType: "data_deletion",
    targetId: id,
    outcome: status === "verified" ? "succeeded" : "failed",
    metadata: JSON.stringify({ blockerCode }),
    occurredAt: now,
  });
  return { id, status, blockerCode, retentionUntil };
}

async function cancelAccountDeletion(
  ctx: MutationCtx,
  input: Input,
): Promise<boolean> {
  const access = asRecord(input.access);
  const deletionId = text(input, "deletionId");
  const deletion = await byId(ctx, "dataDeletions", deletionId);
  if (
    !deletion
    || deletion.accountId !== text(access, "accountId")
    || !["requested", "verified", "blocked"].includes(deletion.status)
  ) {
    return false;
  }
  const now = number(input, "now");
  await ctx.db.patch(deletion._id, {
    status: "cancelled",
    completedAt: now,
    blockerCode: null,
    updatedAt: now,
  });
  await insertAuditOnce(ctx, {
    id: `audit:${deletionId}:cancelled`,
    actorAccountId: text(access, "accountId"),
    workspaceId: text(access, "workspaceId"),
    action: "privacy.data_deletion.cancelled",
    targetType: "data_deletion",
    targetId: deletionId,
    outcome: "succeeded",
    metadata: "{}",
    occurredAt: now,
  });
  return true;
}

async function prepareAccountDeletion(
  ctx: MutationCtx,
  input: Input,
): Promise<Record<string, unknown>> {
  const now = number(input, "now");
  let unblocked = 0;
  // The hard cap keeps each scheduled mutation bounded.
  const blockedRows = (await ctx.db.query("dataDeletions").collect())
    .filter((row) => row.status === "blocked")
    .slice(0, 20);
  for (const deletion of blockedRows) {
    if (await findDeletionBlocker(ctx, deletion.accountId)) continue;
    await ctx.db.patch(deletion._id, {
      status: "verified",
      verifiedAt: now,
      retentionUntil: now + 604_800_000,
      blockerCode: null,
      updatedAt: now,
    });
    unblocked += 1;
  }

  const due = (await ctx.db.query("dataDeletions").collect())
    .filter((row) =>
      row.status === "verified"
      && row.retentionUntil != null
      && row.retentionUntil <= now
    )
    .sort((a, b) => (a.retentionUntil ?? 0) - (b.retentionUntil ?? 0))
    .slice(0, 10);
  for (const deletion of due) {
    await ctx.db.patch(deletion._id, { status: "queued", updatedAt: now });
    const account = await byId(ctx, "accounts", deletion.accountId);
    if (account && account.status === "active") {
      await ctx.db.patch(account._id, {
        status: "deletion_pending",
        updatedAt: now,
      });
    }
    const grants = await ctx.db
      .query("downloadGrants")
      .withIndex("by_account", (q) =>
        q.eq("accountId", deletion.accountId))
      .collect();
    for (const grant of grants) {
      if (grant.consumedAt === null && grant.revokedAt === null) {
        await ctx.db.patch(grant._id, { revokedAt: now });
      }
    }
    const payload = JSON.stringify({
      accountId: deletion.accountId,
      deletionId: deletion.id,
      state: "completing",
      templateRef: "product.data-deletion-completing.v1",
    });
    await insertOutboxOnce(ctx, {
      id: `outbox:${deletion.id}:completing`,
      deduplicationKey: `${deletion.id}:completing`,
      topic: "privacy.data_deletion.completing",
      aggregateType: "data_deletion",
      aggregateId: deletion.id,
      payload,
      payloadHash: await sha256Hex(payload),
      now,
    });
  }

  const candidates = (await ctx.db.query("dataDeletions").collect())
    .filter((row) =>
      row.status === "queued"
      || (row.status === "processing" && row.updatedAt <= now - 3_600_000)
    )
    .sort((a, b) => a.requestedAt - b.requestedAt);
  for (const deletion of candidates) {
    const notices = await ctx.db
      .query("outboxMessages")
      .withIndex("by_deduplication_key", (q) =>
        q.eq("deduplicationKey", `${deletion.id}:completing`))
      .unique();
    if (!notices || notices.status !== "delivered") continue;
    const account = await byId(ctx, "accounts", deletion.accountId);
    if (
      !account
      || account.identityProvider !== "workos"
      || account.status !== "deletion_pending"
    ) continue;
    await ctx.db.patch(deletion._id, {
      status: "processing",
      updatedAt: now,
    });
    return {
      unblocked,
      queued: due.length,
      candidate: {
        deletionId: deletion.id,
        accountId: deletion.accountId,
        workspaceId: deletion.workspaceId ?? null,
        userId: account.identitySubject,
      },
    };
  }
  return { unblocked, queued: due.length, candidate: null };
}

async function completeAccountDeletion(
  ctx: MutationCtx,
  input: Input,
): Promise<void> {
  const deletionId = text(input, "deletionId");
  const accountId = text(input, "accountId");
  const deletion = await byId(ctx, "dataDeletions", deletionId);
  const account = await byId(ctx, "accounts", accountId);
  if (
    !deletion
    || deletion.accountId !== accountId
    || deletion.status !== "processing"
    || !account
    || account.status !== "deletion_pending"
  ) {
    throw new Error("Account deletion completion is unavailable");
  }
  const now = number(input, "now");
  await ctx.db.patch(account._id, {
    identitySubject: text(input, "deletedSubject"),
    emailHash: null,
    status: "deleted",
    deactivatedAt: now,
    updatedAt: now,
  });
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .unique();
  if (profile) await ctx.db.delete(profile._id);
  await revokeAccountAccess(ctx, accountId, now);
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  for (const membership of memberships) {
    await ctx.db.patch(membership._id, {
      status: "revoked",
      revokedAt: membership.revokedAt ?? now,
      updatedAt: now,
    });
  }
  await ctx.db.patch(deletion._id, {
    status: "completed",
    completedAt: now,
    blockerCode: null,
    updatedAt: now,
  });
  await insertAuditOnce(ctx, {
    id: `audit:${deletionId}:completed`,
    actorAccountId: accountId,
    workspaceId: deletion.workspaceId ?? null,
    action: "privacy.data_deletion.completed",
    targetType: "data_deletion",
    targetId: deletionId,
    outcome: "succeeded",
    metadata: "{}",
    occurredAt: now,
  });
}

async function deferAccountDeletion(
  ctx: MutationCtx,
  input: Input,
): Promise<void> {
  const deletion = await byId(
    ctx,
    "dataDeletions",
    text(input, "deletionId"),
  );
  if (!deletion || deletion.status !== "processing") return;
  await ctx.db.patch(deletion._id, {
    status: "queued",
    blockerCode: text(input, "code"),
    updatedAt: number(input, "now"),
  });
}

async function findDeletionBlocker(
  ctx: MutationCtx,
  accountId: string,
): Promise<string | null> {
  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  if (
    subscriptions.some((row) =>
      ["pending", "active", "past_due", "paused"].includes(row.status)
    )
  ) {
    return "active_subscription";
  }
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  for (const membership of memberships) {
    if (membership.role !== "owner" || membership.status !== "active") {
      continue;
    }
    const others = await ctx.db
      .query("memberships")
      .withIndex("by_workspace", (q) =>
        q.eq("workspaceId", membership.workspaceId))
      .collect();
    if (
      others.some((row) =>
        row.accountId !== accountId
        && ["active", "invited"].includes(row.status)
      )
    ) {
      return "shared_workspace_owner";
    }
  }
  return null;
}

async function claimOutboxMessages(
  ctx: MutationCtx,
  input: Input,
): Promise<Array<Record<string, unknown>>> {
  const now = number(input, "now");
  const candidates = (await ctx.db.query("outboxMessages").collect())
    .filter((message) =>
      (
        ["pending", "failed"].includes(message.status)
        && (
          message.nextAttemptAt == null
          || message.nextAttemptAt <= now
        )
      )
      || (
        message.status === "processing"
        && message.updatedAt <= now - 900_000
      )
    )
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 10);
  const result = [];
  for (const message of candidates) {
    const attempts = message.attempts + 1;
    await ctx.db.patch(message._id, {
      status: "processing",
      attempts,
      nextAttemptAt: null,
      lastErrorCode: null,
      updatedAt: now,
    });
    const accountId = await resolveOutboxAccountId(ctx, message);
    const account = accountId ? await byId(ctx, "accounts", accountId) : null;
    result.push({
      id: message.id,
      deduplicationKey: message.deduplicationKey,
      topic: message.topic,
      aggregateType: message.aggregateType,
      aggregateId: message.aggregateId,
      payload: message.payload,
      payloadHash: message.payloadHash,
      attempts,
      userId:
        account
        && account.identityProvider === "workos"
        && ["active", "deletion_pending"].includes(account.status)
          ? account.identitySubject
          : null,
    });
  }
  return result;
}

async function resolveOutboxAccountId(
  ctx: MutationCtx,
  message: DataModel["outboxMessages"]["document"],
): Promise<string | null> {
  if (message.aggregateType === "purchase") {
    return (await byId(ctx, "purchases", message.aggregateId))
      ?.accountId ?? null;
  }
  if (message.aggregateType === "subscription") {
    return (await byId(ctx, "subscriptions", message.aggregateId))
      ?.accountId ?? null;
  }
  if (message.aggregateType === "adjustment") {
    const adjustment = await byId(
      ctx,
      "billingAdjustments",
      message.aggregateId,
    );
    if (adjustment?.purchaseId) {
      return (await byId(ctx, "purchases", adjustment.purchaseId))
        ?.accountId ?? null;
    }
    if (adjustment?.invoiceId) {
      const invoice = await byId(ctx, "invoices", adjustment.invoiceId);
      return invoice?.subscriptionId
        ? (await byId(ctx, "subscriptions", invoice.subscriptionId))
          ?.accountId ?? null
        : null;
    }
  }
  if (message.aggregateType === "data_export") {
    return (await byId(ctx, "dataExports", message.aggregateId))
      ?.accountId ?? null;
  }
  if (message.aggregateType === "data_deletion") {
    return (await byId(ctx, "dataDeletions", message.aggregateId))
      ?.accountId ?? null;
  }
  return null;
}

async function markOutboxAccepted(
  ctx: MutationCtx,
  input: Input,
): Promise<void> {
  const message = await byId(ctx, "outboxMessages", text(input, "id"));
  if (
    !message
    || message.status !== "processing"
    || message.attempts !== number(input, "attempts")
  ) return;
  const now = number(input, "now");
  const providerMessageId = text(input, "providerMessageId");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u.test(providerMessageId)) {
    throw new Error("Invalid provider message identifier");
  }
  const existing = await ctx.db
    .query("outboxMessages")
    .withIndex("by_provider_message_id", (q) =>
      q.eq("providerMessageId", providerMessageId))
    .unique();
  if (existing && existing.id !== message.id) {
    throw new Error("Provider message identity conflict");
  }
  await ctx.db.patch(message._id, {
    status: "accepted",
    providerMessageId,
    acceptedAt: now,
    nextAttemptAt: null,
    lastErrorCode: null,
    updatedAt: now,
  });
}

async function applyOutboxProviderEvent(
  ctx: MutationCtx,
  input: Input,
): Promise<"applied" | "duplicate" | "ignored"> {
  const providerMessageId = text(input, "providerMessageId");
  const providerEventId = text(input, "providerEventId");
  const providerEventType = text(input, "providerEventType");
  const state = text(input, "state");
  const providerOccurredAt = number(input, "providerOccurredAt");
  const receivedAt = number(input, "receivedAt");
  if (
    !/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u.test(providerMessageId)
    || !/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u.test(providerEventId)
    || !["delivered", "bounced", "complained"].includes(state)
    || providerEventType !== `email.${state}`
  ) {
    throw new Error("Invalid email provider event");
  }
  const event = await acceptProviderEvent(ctx, {
    providerKind: "resend",
    providerEventId,
    aggregateType: "email",
    aggregateId: providerMessageId,
    eventType: providerEventType,
    occurredAt: providerOccurredAt,
    receivedAt,
    payloadHash: sha256(input, "payloadHash"),
  });
  if (event.duplicate) return "duplicate";

  const message = await ctx.db
    .query("outboxMessages")
    .withIndex("by_provider_message_id", (q) =>
      q.eq("providerMessageId", providerMessageId))
    .unique();
  if (!message) {
    throw new Error("Resend delivery target unavailable");
  }
  if (
    message.providerOccurredAt != null
    && message.providerOccurredAt >= providerOccurredAt
  ) {
    await markProviderEvent(ctx, event.document, "ignored", receivedAt);
    return "ignored";
  }

  await ctx.db.patch(message._id, {
    status: state,
    providerOccurredAt,
    deliveredAt:
      state === "delivered" ? providerOccurredAt : message.deliveredAt,
    lastErrorCode:
      state === "delivered" ? null : `provider_${state}`,
    updatedAt: receivedAt,
  });
  await markProviderEvent(ctx, event.document, "applied", receivedAt);
  await insertAuditOnce(ctx, {
    id: `audit:resend:${providerEventId}`,
    actorAccountId: null,
    workspaceId: null,
    action: "email.delivery.updated",
    targetType: "outbox",
    targetId: message.id,
    outcome: state,
    metadata: JSON.stringify({ provider: "resend", state }),
    occurredAt: providerOccurredAt,
  });
  return "applied";
}

async function commerceReadiness(
  ctx: MutationCtx,
): Promise<{ ok: true }> {
  // A bounded database read proves that the authenticated mutation endpoint,
  // current schema and deployment storage are all available without exposing
  // any customer or provider data.
  await ctx.db.query("providerEvents").take(1);
  return { ok: true };
}

async function markOutboxFailed(
  ctx: MutationCtx,
  input: Input,
): Promise<void> {
  const message = await byId(ctx, "outboxMessages", text(input, "id"));
  if (
    !message
    || message.status !== "processing"
    || message.attempts !== number(input, "attempts")
  ) return;
  const now = number(input, "now");
  const deadLetter = boolean(input, "deadLetter");
  const code = text(input, "code");
  await ctx.db.patch(message._id, {
    status: deadLetter ? "dead_letter" : "failed",
    nextAttemptAt: nullableNumber(input, "nextAttemptAt"),
    lastErrorCode: code,
    updatedAt: now,
  });
  if (!deadLetter) return;
  const existing = await ctx.db
    .query("deadLetters")
    .withIndex("by_source", (q) =>
      q.eq("sourceType", "outbox").eq("sourceId", message.id))
    .unique();
  await upsert(ctx, "deadLetters", existing, {
    id: existing?.id ?? `dead-letter:${message.id}`,
    sourceType: "outbox",
    sourceId: message.id,
    reasonCode: code,
    payloadHash: message.payloadHash,
    status: "open",
    attempts: message.attempts,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    resolvedAt: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

async function acceptProviderEvent(
  ctx: MutationCtx,
  input: {
    providerKind: string;
    providerEventId: string;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    occurredAt: number;
    receivedAt: number;
    payloadHash: string;
  },
): Promise<{
  duplicate: boolean;
  document: DataModel["providerEvents"]["document"];
}> {
  const existing = await ctx.db
    .query("providerEvents")
    .withIndex("by_provider_event", (q) =>
      q
        .eq("providerKind", input.providerKind)
        .eq("providerEventId", input.providerEventId))
    .unique();
  if (existing) {
    if (!existing.signatureVerified || existing.payloadHash !== input.payloadHash) {
      throw new Error("Provider event identity conflict");
    }
    return {
      duplicate: ["applied", "ignored"].includes(existing.status),
      document: existing,
    };
  }
  const now = Date.now();
  const id = await ctx.db.insert("providerEvents", {
    id: `event:${input.providerKind}:${input.providerEventId}`,
    ...input,
    payloadEnvelope: null,
    signatureVerified: true,
    status: "received",
    processedAt: null,
    errorCode: null,
    createdAt: now,
    updatedAt: now,
  });
  const document = await ctx.db.get("providerEvents", id);
  if (!document) throw new Error("Provider event registration failed");
  return { duplicate: false, document };
}

async function markProviderEvent(
  ctx: MutationCtx,
  event: DataModel["providerEvents"]["document"],
  status: "applied" | "ignored",
  now: number,
): Promise<void> {
  await ctx.db.patch(event._id, {
    status,
    processedAt: event.processedAt ?? now,
    errorCode: null,
    updatedAt: now,
  });
}

async function byId<T extends TableName>(
  ctx: MutationCtx,
  table: T,
  id: string,
): Promise<DataModel[T]["document"] | null> {
  return ctx.db
    .query(table)
    .withIndex(
      "by_custom_id" as never,
      (q) => q.eq("id" as never, id as never),
    )
    .unique();
}

async function upsert<T extends TableName>(
  ctx: MutationCtx,
  table: T,
  existing: DataModel[T]["document"] | null,
  value: Omit<DataModel[T]["document"], "_id" | "_creationTime">,
): Promise<void> {
  if (existing) {
    await ctx.db.patch(existing._id, value as never);
  } else {
    await ctx.db.insert(table, value as never);
  }
}

async function insertOutboxOnce(
  ctx: MutationCtx,
  input: {
    id: string;
    deduplicationKey: string;
    topic: string;
    aggregateType: string;
    aggregateId: string;
    payload: string;
    payloadHash: string;
    now: number;
  },
): Promise<void> {
  const existing = await ctx.db
    .query("outboxMessages")
    .withIndex("by_deduplication_key", (q) =>
      q.eq("deduplicationKey", input.deduplicationKey))
    .unique();
  if (existing) return;
  await ctx.db.insert("outboxMessages", {
    id: input.id,
    deduplicationKey: input.deduplicationKey,
    topic: input.topic,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload,
    payloadHash: input.payloadHash,
    status: "pending",
    attempts: 0,
    nextAttemptAt: input.now,
    providerMessageId: null,
    acceptedAt: null,
    providerOccurredAt: null,
    deliveredAt: null,
    lastErrorCode: null,
    createdAt: input.now,
    updatedAt: input.now,
  });
}

async function insertAuditOnce(
  ctx: MutationCtx,
  input: Omit<
    DataModel["auditEvents"]["document"],
    "_id" | "_creationTime"
  >,
): Promise<void> {
  if (await byId(ctx, "auditEvents", input.id)) return;
  await ctx.db.insert("auditEvents", input);
}

async function revokeOpenGrants(
  ctx: MutationCtx,
  entitlementId: string,
  now: number,
): Promise<void> {
  const grants = await ctx.db
    .query("downloadGrants")
    .withIndex("by_entitlement", (q) =>
      q.eq("entitlementId", entitlementId))
    .collect();
  for (const grant of grants) {
    if (grant.consumedAt === null && grant.revokedAt === null) {
      await ctx.db.patch(grant._id, { revokedAt: now });
    }
  }
}

async function revokeAccountAccess(
  ctx: MutationCtx,
  accountId: string,
  now: number,
): Promise<void> {
  const seats = await ctx.db
    .query("licenceSeats")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  for (const seat of seats) {
    await ctx.db.patch(seat._id, {
      status: "revoked",
      revokedAt: seat.revokedAt ?? now,
      updatedAt: now,
    });
  }
  const entitlements = await ctx.db
    .query("entitlements")
    .withIndex("by_account_status", (q) =>
      q.eq("accountId", accountId).eq("status", "active"))
    .collect();
  for (const entitlement of entitlements) {
    await ctx.db.patch(entitlement._id, {
      status: "revoked",
      updatedAt: now,
    });
  }
  const grants = await ctx.db
    .query("downloadGrants")
    .withIndex("by_account", (q) => q.eq("accountId", accountId))
    .collect();
  for (const grant of grants) {
    if (grant.revokedAt === null) {
      await ctx.db.patch(grant._id, { revokedAt: now });
    }
  }
}

async function revokeWorkspaceAccountAccess(
  ctx: MutationCtx,
  workspaceId: string,
  accountId: string,
  now: number,
): Promise<void> {
  const licences = await ctx.db
    .query("licences")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();
  for (const licence of licences) {
    const seat = await ctx.db
      .query("licenceSeats")
      .withIndex("by_licence_account", (q) =>
        q.eq("licenceId", licence.id).eq("accountId", accountId))
      .unique();
    if (seat) {
      await ctx.db.patch(seat._id, {
        status: "revoked",
        revokedAt: seat.revokedAt ?? now,
        updatedAt: now,
      });
    }
  }
}

function preservePurchaseStatus(current: string, incoming: string): string {
  if (["refunded", "disputed"].includes(current)) return current;
  if (incoming === "completed") return "completed";
  if (current === "completed") return current;
  return incoming;
}

function assertServerSecret(value: string): void {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || expected.length < 32 || value !== expected) {
    throw new Error("Commerce operation is unavailable");
  }
}

function asRecord(value: unknown): Input {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid commerce operation input");
  }
  return value as Input;
}

function text(input: Input, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid commerce field: ${key}`);
  }
  return value;
}

function nullableText(input: Input, key: string): string | null {
  const value = input[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid commerce field: ${key}`);
  }
  return value;
}

function number(input: Input, key: string): number {
  const value = input[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid commerce field: ${key}`);
  }
  return value;
}

function nullableNumber(input: Input, key: string): number | null {
  const value = input[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid commerce field: ${key}`);
  }
  return value;
}

function boolean(input: Input, key: string): boolean {
  const value = input[key];
  if (typeof value !== "boolean") {
    throw new Error(`Invalid commerce field: ${key}`);
  }
  return value;
}

function stringArray(input: Input, key: string): string[] {
  const value = input[key];
  if (
    !Array.isArray(value)
    || value.length === 0
    || value.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new Error(`Invalid commerce field: ${key}`);
  }
  return value as string[];
}

function sha256(input: Input, key: string): string {
  const value = text(input, key);
  if (!/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error(`Invalid commerce field: ${key}`);
  }
  return value;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

function item(
  id: string,
  label: string,
  value: string,
  options: Record<string, unknown> = {},
): Record<string, unknown> {
  return { id, label, value, ...options };
}

function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function productLabel(value: string): string {
  return titleCase(
    value.replace(/^gummy-ui-pro-/u, "").replace(/^gummy-ui-/u, ""),
  );
}

function date(value: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function money(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

function bytes(value: number): string {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function statusTone(value: string): string {
  if (["active", "completed", "paid", "ready", "granted"].includes(value)) {
    return "active";
  }
  if (
    ["revoked", "deleted", "refunded", "failed", "cancelled"].includes(value)
  ) {
    return "revoked";
  }
  if (
    ["past_due", "pending", "suspended", "processing", "blocked"].includes(
      value,
    )
  ) {
    return "attention";
  }
  return "neutral";
}

function roleOrder(role: string): number {
  return ["owner", "admin", "billing", "member", "viewer"].indexOf(role);
}
