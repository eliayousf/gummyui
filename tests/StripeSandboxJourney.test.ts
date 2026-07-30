import {
  chmod,
  lstat,
  mkdir,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { commercialPlans } from "../app/data/commercial";

vi.mock("server-only", () => ({}));

import {
  attestSandboxApplication,
  projectSandboxEvent,
  readStripeSandboxJourneyConfig,
  RealStripeSandboxJourneyProvider,
  runStripeSandboxJourney,
  StripeSandboxJourneyError,
  type StripeSandboxJourneyProvider,
  type StripeSandboxJourneyState,
} from "../scripts/stripe-sandbox-journey";

const runtimeKey = `rk_test_${"r".repeat(24)}`;
const operatorKey = `sk_test_${"o".repeat(24)}`;
const webhookSecret = `whsec_${"w".repeat(24)}`;

describe("Stripe sandbox journey safety boundary", () => {
  it("is a non-mutating dry run unless --execute is explicit", async () => {
    const provider = fakeProvider();
    const stateStore = fakeStateStore();
    const output = vi.fn();

    await runStripeSandboxJourney({
      argv: ["prepare"],
      environment: {
        STRIPE_SANDBOX_RUNTIME_KEY: `rk_live_${"x".repeat(24)}`,
      },
      provider,
      stateStore,
      writeOutput: output,
    });

    expect(provider.prepare).not.toHaveBeenCalled();
    expect(provider.resume).not.toHaveBeenCalled();
    expect(stateStore.create).not.toHaveBeenCalled();
    expect(output).toHaveBeenCalledWith(JSON.stringify({
      mode: "dry-run",
      operation: "prepare",
      sandboxOnly: true,
      externalMutation: false,
      requires: [
        "dedicated-rk-test-runtime-key",
        "dedicated-sk-test-operator-key",
        "completed-sandbox-checkouts",
        "signed-sandbox-webhook-projection",
      ],
      mutatingResumeRetryable: false,
    }));
  });

  it.each([
    ["STRIPE_SANDBOX_RUNTIME_KEY", `rk_live_${"x".repeat(24)}`],
    ["STRIPE_SANDBOX_RUNTIME_KEY", `sk_live_${"x".repeat(24)}`],
    ["STRIPE_SANDBOX_OPERATOR_KEY", `sk_live_${"x".repeat(24)}`],
    ["STRIPE_SANDBOX_OPERATOR_KEY", `rk_live_${"x".repeat(24)}`],
  ])("categorically refuses live key material in %s", (key, value) => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      [key]: value,
    })).toThrowError(
      expect.objectContaining({ code: "live_stripe_key_refused" }),
    );
  });

  it("requires separate restricted-runtime and standard-operator test keys", () => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_RUNTIME_KEY: operatorKey,
    })).toThrowError(
      expect.objectContaining({
        code: "restricted_test_runtime_key_required",
      }),
    );
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_OPERATOR_KEY: runtimeKey,
    })).toThrowError(
      expect.objectContaining({
        code: "standard_test_operator_key_required",
      }),
    );
  });

  it("requires an explicitly isolated Convex target and sandbox identities", () => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_CONVEX_URL: "https://example.com",
    })).toThrowError(expect.objectContaining({
      code: "sandbox_convex_target_invalid",
    }));
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_ACCOUNT_ID: "account:real-customer",
    })).toThrowError(expect.objectContaining({
      code: "sandbox_projection_identity_invalid",
    }));
  });

  it("categorically refuses every non-loopback origin", () => {
    for (const origin of [
      "https://gummyui.dev",
      "https://gummyui.dev.",
      "https://www.gummyui.dev",
      "https://www.gummyui.dev.",
      "https://preview.gummyui.dev",
      "https://preview.gummyui.dev.",
    ]) {
      expect(() => readStripeSandboxJourneyConfig({
        ...readyEnvironment(),
        STRIPE_SANDBOX_APP_ORIGIN: origin,
      })).toThrowError(
        expect.objectContaining({
          code: "non_loopback_sandbox_origin_refused",
        }),
      );
    }
  });

  it("permits only canonical loopback hosts", () => {
    expect(
      readStripeSandboxJourneyConfig(readyEnvironment())
        .applicationOrigin,
    ).toBe("http://127.0.0.1:3000");

    for (const origin of [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://[::1]:3000",
    ]) {
      expect(readStripeSandboxJourneyConfig({
        ...readyEnvironment(),
        STRIPE_SANDBOX_APP_ORIGIN: origin,
      }).applicationOrigin).toBe(origin);
    }
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_APP_ORIGIN: "https://gummyui-sandbox.example.test",
    })).toThrowError(expect.objectContaining({
      code: "non_loopback_sandbox_origin_refused",
    }));
  });

  it("does not substitute production webhook or price configuration", () => {
    const environment = readyEnvironment();
    delete environment.STRIPE_SANDBOX_WEBHOOK_SECRET;
    environment.STRIPE_WEBHOOK_SECRET = `whsec_${"live".repeat(6)}`;
    expect(() => readStripeSandboxJourneyConfig(environment))
      .toThrowError(
        expect.objectContaining({
          code: "sandbox_journey_configuration_unavailable",
        }),
      );
  });

  it("requires the sandbox signing secret to differ from an ordinary one", () => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_WEBHOOK_SECRET: webhookSecret,
    })).toThrowError(expect.objectContaining({
      code: "sandbox_webhook_secret_reuse_refused",
    }));
  });

  it("rejects the removed remote-origin override flag", async () => {
    await expect(runStripeSandboxJourney({
      argv: ["prepare", "--allow-non-loopback-origin"],
    })).rejects.toMatchObject({
      code: "sandbox_journey_usage_invalid",
    });
  });
});

describe("Stripe sandbox webhook projection", () => {
  const event = {
    id: "evt_test_projection",
    livemode: false,
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_projection" } },
  } as Stripe.Event;

  it("accepts only a first-pass applied projection", async () => {
    const fetchImplementation = vi.fn(async (
      _input: URL | RequestInfo,
      init?: RequestInit,
    ) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return Response.json({ received: true, status: "applied" });
    }) as typeof fetch;

    await projectSandboxEvent(
      readStripeSandboxJourneyConfig(readyEnvironment()),
      event,
      fetchImplementation,
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it.each(["ignored", "duplicate", undefined])(
    "never counts webhook status %s as projected",
    async (status) => {
      const fetchImplementation = vi.fn(async () =>
        Response.json({ received: true, status })) as typeof fetch;

      await expect(projectSandboxEvent(
        readStripeSandboxJourneyConfig(readyEnvironment()),
        event,
        fetchImplementation,
      )).rejects.toMatchObject({
        code: "sandbox_webhook_projection_not_applied",
      });
    },
  );

  it("aborts a webhook fetch at the configured bound", async () => {
    const fetchImplementation = vi.fn((
      _input: URL | RequestInfo,
      init?: RequestInit,
    ) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      }, { once: true });
    })) as typeof fetch;

    await expect(projectSandboxEvent(
      readStripeSandboxJourneyConfig(readyEnvironment()),
      event,
      fetchImplementation,
      5,
    )).rejects.toMatchObject({
      code: "sandbox_webhook_projection_unavailable",
    });
  });
});

describe("Stripe sandbox application attestation", () => {
  it("requires the nonce, isolated target fingerprint and identity proof", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    const fetchImplementation = vi.fn(async () => Response.json({
      challenge: "a".repeat(64),
      targetClass: "isolated-test",
      targetFingerprint: config.convexTargetFingerprint,
      identityReady: true,
    })) as typeof fetch;

    await attestSandboxApplication(
      config,
      "identity",
      "a".repeat(64),
      undefined,
      fetchImplementation,
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("requires explicit access revocation after the lifecycle", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    await expect(attestSandboxApplication(
      config,
      "access-revoked",
      "b".repeat(64),
      ["cs_test_monthly", "cs_test_lifetime"],
      vi.fn(async () => Response.json({
        challenge: "b".repeat(64),
        targetClass: "isolated-test",
        targetFingerprint: config.convexTargetFingerprint,
        identityReady: true,
      })) as typeof fetch,
    )).rejects.toMatchObject({
      code: "sandbox_application_attestation_invalid",
    });
  });
});

describe("real Stripe sandbox provider boundaries", () => {
  it("validates all prices and both checkouts before operator mutation", async () => {
    const environment = readyEnvironment();
    const config = readStripeSandboxJourneyConfig(environment);
    const retrievePrice = vi.fn(async (priceId: string) => {
      const plan = commercialPlans.find((candidate) =>
        config.priceIds[candidate.id] === priceId);
      if (!plan) throw new Error("unexpected price");
      return {
        id: priceId,
        active: true,
        currency: "usd",
        livemode: false,
        type: plan.billingInterval === "lifetime"
          ? "one_time"
          : "recurring",
        unit_amount: plan.priceUsd * 100,
        recurring: plan.billingInterval === "lifetime"
          ? null
          : { interval: plan.billingInterval, interval_count: 1 },
      };
    });
    const retrieveSession = vi.fn(async (sessionId: string) => {
      const monthly = sessionId === "cs_test_monthly";
      return {
        id: sessionId,
        livemode: false,
        status: "complete",
        payment_status: "paid",
        metadata: {
          commercial_offer_ref:
            monthly ? "individual-monthly" : "individual-lifetime",
          immediate_supply_requested: "true",
          cancellation_loss_acknowledged: "true",
        },
      };
    });
    const stripeFactory = vi.fn(() => ({
      prices: { retrieve: retrievePrice },
      checkout: { sessions: { retrieve: retrieveSession } },
    }) as unknown as Stripe);
    const provider = new RealStripeSandboxJourneyProvider({
      stripeFactory,
      fetchImplementation: vi.fn() as typeof fetch,
      now: () => 1_800_000_000_000,
      sleep: vi.fn(async () => undefined),
      eventWaitTimeoutMs: 1,
      webhookFetchTimeoutMs: 1,
    });

    await provider.validateForResume(config, continuationState());

    expect(stripeFactory).toHaveBeenCalledTimes(2);
    expect(stripeFactory).toHaveBeenCalledWith(runtimeKey);
    expect(stripeFactory).toHaveBeenCalledWith(operatorKey);
    expect(retrievePrice).toHaveBeenCalledTimes(18);
    expect(retrieveSession).toHaveBeenCalledTimes(4);
  });

  it("executes and projects the provider lifecycle in the required order", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    const monthly = completedSession("cs_test_monthly", true);
    const lifetime = completedSession("cs_test_lifetime", false);
    const retrieveSession = vi.fn(async (id: string) =>
      id === monthly.id ? monthly : lifetime);
    const retrievePrice = vi.fn(async (priceId: string) => {
      const plan = commercialPlans.find((candidate) =>
        config.priceIds[candidate.id] === priceId)!;
      return {
        id: priceId,
        active: true,
        currency: "usd",
        livemode: false,
        type: plan.billingInterval === "lifetime"
          ? "one_time"
          : "recurring",
        unit_amount: plan.priceUsd * 100,
        recurring: plan.billingInterval === "lifetime"
          ? null
          : { interval: plan.billingInterval, interval_count: 1 },
      };
    });
    const events = [
      event("evt_checkout_monthly", "checkout.session.completed", {
        id: monthly.id,
      }),
      event("evt_checkout_lifetime", "checkout.session.completed", {
        id: lifetime.id,
      }),
      event("evt_invoice_paid", "invoice.paid", { id: "in_renewal" }),
      event("evt_invoice_failed", "invoice.payment_failed", {
        id: "in_failed",
      }),
      event("evt_cancel_scheduled", "customer.subscription.updated", {
        id: "sub_sandbox",
        cancel_at_period_end: true,
      }),
      event("evt_cancelled", "customer.subscription.deleted", {
        id: "sub_sandbox",
      }),
      event("evt_refund", "refund.created", { id: "re_sandbox" }),
    ] as Stripe.Event[];
    const subscriptionUpdates = vi.fn()
      .mockResolvedValueOnce({ latest_invoice: "in_renewal" })
      .mockResolvedValueOnce({ id: "sub_sandbox" })
      .mockResolvedValueOnce({ latest_invoice: "in_failed" })
      .mockResolvedValueOnce({
        id: "sub_sandbox",
        cancel_at_period_end: true,
      });
    const detach = vi.fn(async () => ({ id: "pm_declined" }));
    const operator = {
      events: { list: vi.fn(async () => ({ data: events })) },
      subscriptions: {
        update: subscriptionUpdates,
        cancel: vi.fn(async () => ({ id: "sub_sandbox" })),
      },
      paymentMethods: {
        create: vi.fn(async () => ({
          id: "pm_declined",
          livemode: false,
        })),
        attach: vi.fn(async () => ({ id: "pm_declined" })),
        detach,
      },
      refunds: {
        create: vi.fn(async () => ({
          id: "re_sandbox",
          status: "succeeded",
          amount: 89_900,
          currency: "usd",
        })),
      },
    };
    const stripeFactory = vi.fn((key: string) =>
      key === runtimeKey
        ? {
            prices: { retrieve: retrievePrice },
            checkout: { sessions: { retrieve: retrieveSession } },
          } as unknown as Stripe
        : operator as unknown as Stripe);
    const fetchImplementation = vi.fn(async () =>
      Response.json({ received: true, status: "applied" })) as typeof fetch;
    const provider = new RealStripeSandboxJourneyProvider({
      stripeFactory,
      fetchImplementation,
      now: () => 1_800_000_000_000,
      sleep: vi.fn(async () => undefined),
      eventWaitTimeoutMs: 10,
      webhookFetchTimeoutMs: 10,
    });

    await expect(provider.resume(
      config,
      continuationState(),
    )).resolves.toEqual({ realEventsProjected: 7 });
    expect(subscriptionUpdates).toHaveBeenNthCalledWith(
      1,
      "sub_sandbox",
      expect.objectContaining({ billing_cycle_anchor: "now" }),
    );
    expect(subscriptionUpdates).toHaveBeenNthCalledWith(
      2,
      "sub_sandbox",
      { default_payment_method: "pm_declined" },
    );
    expect(operator.subscriptions.cancel).toHaveBeenCalledWith("sub_sandbox");
    expect(operator.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_sandbox" }),
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(7);
    expect(detach).toHaveBeenCalledWith("pm_declined");
  });
});

describe("Stripe sandbox journey orchestration", () => {
  it("prepares both checkout modes and writes only a redacted result", async () => {
    const provider = fakeProvider();
    const stateStore = fakeStateStore();
    const output = vi.fn();

    await runStripeSandboxJourney({
      argv: ["prepare", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_000_000,
      randomId: () => "runidentifier123456",
      writeOutput: output,
    });

    expect(provider.prepare).toHaveBeenCalledTimes(1);
    expect(stateStore.create).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        schemaVersion: 3,
        phase: "preparing",
        runId: "gummyui-sandbox-runidentifier123456",
        createdAt: 1_800_000_000_000,
        resumeAttemptedAt: null,
        checkouts: [],
      }),
    );
    expect(stateStore.replace).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        schemaVersion: 3,
        phase: "ready",
        checkouts: expect.arrayContaining([
          expect.objectContaining({ planId: "individual-monthly" }),
          expect.objectContaining({ planId: "individual-lifetime" }),
        ]),
      }),
    );
    const serialized = output.mock.calls[0][0] as string;
    expect(JSON.parse(serialized)).toEqual({
      mode: "executed",
      operation: "prepare",
      sandboxOnly: true,
      pricesVerified: 9,
      checkoutsCreated: 2,
      checkoutModes: ["subscription", "payment"],
      isolatedConvexAttested: true,
      continuationState: "work/stripe-sandbox/journey.json",
    });
    expect(serialized).not.toContain(runtimeKey);
    expect(serialized).not.toContain(operatorKey);
    expect(serialized).not.toContain(webhookSecret);
    expect(serialized).not.toContain("checkout.stripe.com");
    expect(serialized).not.toContain("cs_test_");
  });

  it("reserves private continuation state before creating Stripe sessions", async () => {
    const provider = fakeProvider();
    const stateStore = fakeStateStore();
    stateStore.create.mockRejectedValueOnce(
      new StripeSandboxJourneyError("sandbox_state_create_failed"),
    );

    await expect(runStripeSandboxJourney({
      argv: ["prepare", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_000_000,
      randomId: () => "reservationidentifier",
    })).rejects.toMatchObject({
      code: "sandbox_state_create_failed",
    });
    expect(provider.prepare).not.toHaveBeenCalled();
  });

  it("resumes only matching state, projects the full lifecycle and removes it", async () => {
    const provider = fakeProvider();
    const state = continuationState();
    const stateStore = fakeStateStore(state);
    const output = vi.fn();

    await runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_100_000,
      writeOutput: output,
    });

    expect(provider.validateForResume).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationOrigin: "http://127.0.0.1:3000",
      }),
      state,
    );
    expect(stateStore.replace).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        resumeAttemptedAt: 1_800_000_100_000,
      }),
    );
    expect(provider.resume).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationOrigin: "http://127.0.0.1:3000",
      }),
      expect.objectContaining({
        resumeAttemptedAt: 1_800_000_100_000,
      }),
    );
    expect(stateStore.remove).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0] as string)).toEqual({
      mode: "executed",
      operation: "resume",
      sandboxOnly: true,
      realEventsProjected: 7,
      lifecycle: [
        "purchase",
        "billing_anchor_reset_invoice",
        "failed_payment",
        "cancellation",
        "refund",
      ],
      mutatingResumeRetryable: false,
      isolatedConvexAttested: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    });
  });

  it("journals a failed mutation attempt and categorically refuses retry", async () => {
    const provider = fakeProvider();
    provider.resume.mockRejectedValueOnce(
      new StripeSandboxJourneyError("sandbox_webhook_projection_rejected"),
    );
    const stateStore = fakeStateStore(continuationState());

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_100_000,
    })).rejects.toMatchObject({
      code: "sandbox_webhook_projection_rejected",
    });
    expect(stateStore.remove).not.toHaveBeenCalled();
    expect(stateStore.replace).toHaveBeenCalledTimes(1);

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_200_000,
    })).rejects.toMatchObject({
      code: "sandbox_resume_already_attempted",
    });
    expect(provider.resume).toHaveBeenCalledTimes(1);
  });

  it("keeps checkout readiness validation safely repeatable", async () => {
    const provider = fakeProvider();
    provider.validateForResume.mockRejectedValueOnce(
      new StripeSandboxJourneyError(
        "sandbox_checkout_completion_required",
      ),
    );
    const stateStore = fakeStateStore(continuationState());

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_checkout_completion_required",
    });
    expect(stateStore.replace).not.toHaveBeenCalled();
    expect(provider.resume).not.toHaveBeenCalled();
  });

  it("retains continuation state when lifecycle evidence is incomplete", async () => {
    const provider = fakeProvider();
    provider.resume.mockResolvedValueOnce({ realEventsProjected: 6 });
    const stateStore = fakeStateStore(continuationState());

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_journey_evidence_incomplete",
    });
    expect(stateStore.remove).not.toHaveBeenCalled();
    expect(stateStore.replace).toHaveBeenCalledTimes(1);
  });

  it.each([
    "docs/stripe-checkout-secrets.json",
    "work/stripe-sandbox/nested/journey.json",
  ])("refuses unsafe continuation path %s", async (statePath) => {
    await expect(runStripeSandboxJourney({
      argv: [
        "prepare",
        "--execute",
        "--state",
        statePath,
      ],
      environment: readyEnvironment(),
      provider: fakeProvider(),
      stateStore: fakeStateStore(),
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({ code: "sandbox_state_path_refused" });
  });

  it("protects real continuation storage and refuses a symlink", async () => {
    const statePath =
      `work/stripe-sandbox/journey-test-${process.pid}-${Date.now()}.json`;
    const absoluteStatePath = resolve(statePath);
    const output = vi.fn();
    await rm(absoluteStatePath, { force: true });

    try {
      await runStripeSandboxJourney({
        argv: ["prepare", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider: fakeProvider(),
        attestApplication: fakeAttestation(),
        now: () => 1_800_000_000_000,
        randomId: () => "filesystemrunidentifier",
        writeOutput: output,
      });

      expect((await lstat(absoluteStatePath)).mode & 0o077).toBe(0);
      expect((await lstat(dirname(absoluteStatePath))).mode & 0o077).toBe(0);
      expect(await readFile(absoluteStatePath, "utf8")).toContain(
        "cs_test_monthly",
      );

      await runStripeSandboxJourney({
        argv: ["resume", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider: fakeProvider(),
        attestApplication: fakeAttestation(),
        now: () => 1_800_000_100_000,
        writeOutput: output,
      });
      await expect(lstat(absoluteStatePath)).rejects.toMatchObject({
        code: "ENOENT",
      });

      await mkdir(dirname(absoluteStatePath), {
        recursive: true,
        mode: 0o700,
      });
      await chmod(dirname(absoluteStatePath), 0o700);
      await symlink(resolve("package.json"), absoluteStatePath);
      await expect(runStripeSandboxJourney({
        argv: ["resume", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider: fakeProvider(),
        attestApplication: fakeAttestation(),
      })).rejects.toMatchObject({
        code: "sandbox_state_permissions_invalid",
      });
    } finally {
      await rm(absoluteStatePath, { force: true });
    }
  });
});

function readyEnvironment(): Record<string, string> {
  return Object.fromEntries([
    ["STRIPE_SANDBOX_RUNTIME_KEY", runtimeKey],
    ["STRIPE_SANDBOX_OPERATOR_KEY", operatorKey],
    ["STRIPE_SANDBOX_WEBHOOK_SECRET", webhookSecret],
    [
      "STRIPE_SANDBOX_EXECUTION_CONFIRMATION",
      "RUN_GUMMYUI_STRIPE_SANDBOX_JOURNEY",
    ],
    ["STRIPE_SANDBOX_APP_ORIGIN", "http://127.0.0.1:3000"],
    [
      "STRIPE_SANDBOX_CONVEX_URL",
      "https://isolated-sandbox.convex.cloud",
    ],
    ["STRIPE_SANDBOX_ACCOUNT_ID", "account:sandbox-test"],
    ["STRIPE_SANDBOX_WORKSPACE_ID", "workspace:sandbox-test"],
    ...commercialPlans.map((plan, index) => [
      `STRIPE_SANDBOX_PRICE_${plan.id.replaceAll("-", "_").toUpperCase()}`,
      `price_Sandbox${index}`,
    ]),
  ]);
}

function continuationState(): StripeSandboxJourneyState {
  return {
    schemaVersion: 2,
    runId: "gummyui-sandbox-runidentifier123456",
    createdAt: 1_700_000_000_000,
    applicationOrigin: "http://127.0.0.1:3000",
    accountId: "account:sandbox-test",
    workspaceId: "workspace:sandbox-test",
    resumeAttemptedAt: null,
    checkouts: [
      {
        planId: "individual-monthly",
        sessionId: "cs_test_monthly",
        checkoutUrl: "https://checkout.stripe.com/c/pay/test-monthly",
      },
      {
        planId: "individual-lifetime",
        sessionId: "cs_test_lifetime",
        checkoutUrl: "https://checkout.stripe.com/c/pay/test-lifetime",
      },
    ],
  };
}

function completedSession(
  id: string,
  monthly: boolean,
): Stripe.Checkout.Session {
  return {
    id,
    object: "checkout.session",
    livemode: false,
    status: "complete",
    payment_status: "paid",
    amount_total: monthly ? 4_900 : 89_900,
    currency: "usd",
    customer: "cus_sandbox",
    payment_intent: monthly ? null : "pi_sandbox",
    subscription: monthly
      ? {
          id: "sub_sandbox",
          object: "subscription",
          latest_invoice: "in_initial",
        }
      : null,
    metadata: {
      commercial_offer_ref:
        monthly ? "individual-monthly" : "individual-lifetime",
      immediate_supply_requested: "true",
      cancellation_loss_acknowledged: "true",
    },
  } as unknown as Stripe.Checkout.Session;
}

function event(
  id: string,
  type: string,
  object: Record<string, unknown>,
): Stripe.Event {
  return {
    id,
    object: "event",
    livemode: false,
    type,
    data: { object },
  } as unknown as Stripe.Event;
}

function fakeProvider() {
  return {
    prepare: vi.fn(async () => ({
      pricesVerified: 9,
      checkouts: continuationState().checkouts,
    })),
    validateForResume: vi.fn(async () => undefined),
    resume: vi.fn(async () => ({ realEventsProjected: 7 })),
  } satisfies StripeSandboxJourneyProvider;
}

function fakeAttestation() {
  return vi.fn(async () => undefined);
}

function fakeStateStore(state = continuationState()) {
  let currentState = state;
  return {
    read: vi.fn(async () => currentState),
    create: vi.fn(async () => undefined),
    replace: vi.fn(async (
      _path: string,
      replacement: StripeSandboxJourneyState,
    ) => {
      currentState = replacement;
    }),
    remove: vi.fn(async () => undefined),
  };
}
