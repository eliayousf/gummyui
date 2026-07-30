import {
  chmod,
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import Stripe from "stripe";
import {
  commercialPlans,
  type CommercialPlanId,
} from "../app/data/commercial";
import {
  StripeCheckoutSessionRetriever,
  StripeManagedPaymentsService,
  STRIPE_MANAGED_PAYMENTS_API_VERSION,
} from "../lib/commerce/stripe-managed-payments";
import type { AccountId, WorkspaceId } from "../lib/commerce/model";

const EXECUTION_CONFIRMATION = "RUN_GUMMYUI_STRIPE_SANDBOX_JOURNEY";
const STATE_SCHEMA_VERSION = 6;
const DEFAULT_STATE_PATH = "work/stripe-sandbox/journey.json";
const EVENT_WAIT_TIMEOUT_MS = 90_000;
const EVENT_POLL_INTERVAL_MS = 1_000;
const WEBHOOK_FETCH_TIMEOUT_MS = 10_000;
const TEST_RUNTIME_KEY = /^rk_test_[A-Za-z0-9][A-Za-z0-9_-]{5,}$/u;
const TEST_OPERATOR_KEY = /^sk_test_[A-Za-z0-9][A-Za-z0-9_-]{5,}$/u;
const ANY_LIVE_KEY = /^(?:rk|sk)_live_/u;
const PRICE_ID = /^price_[A-Za-z0-9]+$/u;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{5,255}$/u;
const SANDBOX_ACCOUNT_ID =
  /^account:(?:sandbox|restore-query-proof-)[A-Za-z0-9._:-]{4,240}$/u;
const SANDBOX_WORKSPACE_ID =
  /^workspace:(?:sandbox|restore-query-proof-)[A-Za-z0-9._:-]{4,240}$/u;

type JourneyOperation =
  | "prepare"
  | "resume"
  | "recover-anchor-no-invoice"
  | "repair-invoice-create-rejected"
  | "finish-managed-lifecycle";

export interface StripeSandboxJourneyConfig {
  runtimeKey: string;
  operatorKey: string;
  webhookSecret: string;
  applicationOrigin: string;
  convexTargetUrl: string;
  convexTargetFingerprint: string;
  accountId: string;
  workspaceId: string;
  priceIds: Readonly<Record<CommercialPlanId, string>>;
}

interface CheckoutContinuation {
  planId: "individual-monthly" | "individual-lifetime";
  sessionId: string;
  checkoutUrl: string;
}

export interface StripeSandboxJourneyState {
  schemaVersion: 2 | 3 | 4 | 5 | 6;
  phase?:
    | "ready"
    | "purchases-attested"
    | "repair-attempted"
    | "managed-lifecycle-attempted";
  runId: string;
  createdAt: number;
  applicationOrigin: string;
  accountId: string;
  workspaceId: string;
  checkouts: [CheckoutContinuation, CheckoutContinuation];
  resumeAttemptedAt: number | null;
  recoveryAttemptedAt?: number | null;
  repairAttemptedAt?: number | null;
  managedFinishAttemptedAt?: number | null;
}

interface StripeSandboxPreparingState {
  schemaVersion: 6;
  phase: "preparing";
  runId: string;
  createdAt: number;
  applicationOrigin: string;
  accountId: string;
  workspaceId: string;
  checkouts: [];
  resumeAttemptedAt: null;
  recoveryAttemptedAt: null;
  repairAttemptedAt: null;
  managedFinishAttemptedAt: null;
}

type StripeSandboxStoredState =
  | StripeSandboxJourneyState
  | StripeSandboxPreparingState;

interface RedactedJourneyEvidence {
  mode: "executed";
  operation: JourneyOperation;
  sandboxOnly: true;
  pricesVerified?: number;
  checkoutsCreated?: number;
  checkoutModes?: readonly ["subscription", "payment"];
  realEventsProjected?: number;
  lifecycle?: readonly (
    | "purchase"
    | "subscription_invoice_paid"
    | "failed_payment"
    | "cancellation"
    | "refund"
  )[];
  mutatingResumeRetryable?: false;
  mutatingRecoveryRetryable?: false;
  mutatingRepairRetryable?: false;
  mutatingManagedFinishRetryable?: false;
  purchaseEventsPreviouslyAttested?: 2;
  recovery?: "anchor-no-invoice" | "invoice-create-rejected";
  renewalEvidence?: "separate-test-clock-required";
  isolatedConvexAttested?: true;
  accessRevocationVerified?: true;
  accessGrantVerified?: true;
  continuationState?: string;
  continuationRemoved?: boolean;
}

export interface StripeSandboxJourneyProvider {
  prepare(
    config: StripeSandboxJourneyConfig,
    runId: string,
  ): Promise<{
    pricesVerified: number;
    checkouts: [CheckoutContinuation, CheckoutContinuation];
  }>;
  validateForResume(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<void>;
  resume(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
    hooks: {
      afterPurchasesProjected(): Promise<void>;
    },
  ): Promise<{
    realEventsProjected: number;
  }>;
  validateForAnchorRecovery?(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<void>;
  recoverAnchorNoInvoice?(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<{
    realEventsProjected: number;
  }>;
  finishManagedLifecycle?(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<{
    realEventsProjected: number;
  }>;
}

interface StripeSandboxStateStore {
  read(path: string): Promise<StripeSandboxJourneyState>;
  create(path: string, state: StripeSandboxStoredState): Promise<void>;
  replace(path: string, state: StripeSandboxStoredState): Promise<void>;
  remove(path: string): Promise<void>;
}

interface RunDependencies {
  argv?: string[];
  environment?: Readonly<Record<string, string | undefined>>;
  provider?: StripeSandboxJourneyProvider;
  stateStore?: StripeSandboxStateStore;
  now?: () => number;
  randomId?: () => string;
  attestApplication?: typeof attestSandboxApplication;
  writeOutput?: (output: string) => void;
}

export class StripeSandboxJourneyError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "StripeSandboxJourneyError";
  }
}

export async function runStripeSandboxJourney(
  dependencies: RunDependencies = {},
): Promise<void> {
  const argv = dependencies.argv ?? process.argv.slice(2);
  const parsed = parseArguments(argv);
  const writeOutput = dependencies.writeOutput
    ?? ((output: string) => process.stdout.write(`${output}\n`));

  if (!parsed.execute) {
    writeOutput(JSON.stringify({
      mode: "dry-run",
      operation: parsed.operation,
      sandboxOnly: true,
      externalMutation: false,
      requires: [
        "dedicated-rk-test-runtime-key",
        "dedicated-sk-test-operator-key",
        "completed-sandbox-checkouts",
        "signed-sandbox-webhook-projection",
      ],
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      mutatingRepairRetryable: false,
      mutatingManagedFinishRetryable: false,
    }));
    return;
  }

  const environment = dependencies.environment ?? process.env;
  const config = readStripeSandboxJourneyConfig(
    environment,
  );
  const statePath = safeStatePath(parsed.statePath);
  const stateStore = dependencies.stateStore ?? fileStateStore;
  const provider = dependencies.provider
    ?? new RealStripeSandboxJourneyProvider();
  const now = dependencies.now ?? Date.now;
  const randomId = dependencies.randomId
    ?? (() => crypto.randomUUID().replaceAll("-", ""));
  const attestApplication = dependencies.attestApplication
    ?? attestSandboxApplication;

  let evidence: RedactedJourneyEvidence;
  if (parsed.operation === "prepare") {
    const runId = `gummyui-sandbox-${randomId()}`;
    const createdAt = now();
    await attestApplication(
      config,
      "identity",
      attestationChallenge(runId, "prepare"),
    );
    const preparingState: StripeSandboxPreparingState = {
      schemaVersion: STATE_SCHEMA_VERSION,
      phase: "preparing",
      runId,
      createdAt,
      applicationOrigin: config.applicationOrigin,
      accountId: config.accountId,
      workspaceId: config.workspaceId,
      checkouts: [],
      resumeAttemptedAt: null,
      recoveryAttemptedAt: null,
      repairAttemptedAt: null,
      managedFinishAttemptedAt: null,
    };
    assertPreparingStateMatchesConfig(preparingState, config);
    await stateStore.create(statePath, preparingState);
    const prepared = await provider.prepare(config, runId);
    if (prepared.pricesVerified !== commercialPlans.length) {
      throw new StripeSandboxJourneyError(
        "sandbox_journey_evidence_incomplete",
      );
    }
    const state: StripeSandboxJourneyState = {
      schemaVersion: STATE_SCHEMA_VERSION,
      phase: "ready",
      runId,
      createdAt,
      applicationOrigin: config.applicationOrigin,
      accountId: config.accountId,
      workspaceId: config.workspaceId,
      checkouts: prepared.checkouts,
      resumeAttemptedAt: null,
      recoveryAttemptedAt: null,
      repairAttemptedAt: null,
      managedFinishAttemptedAt: null,
    };
    assertStateMatchesConfig(state, config);
    await stateStore.replace(statePath, state);
    evidence = {
      mode: "executed",
      operation: "prepare",
      sandboxOnly: true,
      pricesVerified: prepared.pricesVerified,
      checkoutsCreated: state.checkouts.length,
      checkoutModes: ["subscription", "payment"],
      isolatedConvexAttested: true,
      continuationState: relative(process.cwd(), statePath),
    };
  } else if (parsed.operation === "resume") {
    const state = await stateStore.read(statePath);
    assertStateMatchesConfig(state, config);
    if (state.resumeAttemptedAt !== null) {
      throw new StripeSandboxJourneyError(
        "sandbox_resume_already_attempted",
      );
    }
    await attestApplication(
      config,
      "identity",
      attestationChallenge(state.runId, "resume-readiness"),
    );
    await provider.validateForResume(config, state);
    const startedState: StripeSandboxJourneyState = {
      ...state,
      schemaVersion: STATE_SCHEMA_VERSION,
      phase: "ready",
      resumeAttemptedAt: now(),
    };
    assertStateMatchesConfig(startedState, config);
    await stateStore.replace(statePath, startedState);
    const checkoutSessionIds = state.checkouts.map(
      (checkout) => checkout.sessionId,
    ) as [string, string];
    let accessGrantAttested = false;
    const result = await provider.resume(config, startedState, {
      afterPurchasesProjected: async () => {
        await attestApplication(
          config,
          "access-granted",
          attestationChallenge(state.runId, "resume-access-granted"),
          checkoutSessionIds,
        );
        accessGrantAttested = true;
      },
    });
    if (!accessGrantAttested || result.realEventsProjected !== 5) {
      throw new StripeSandboxJourneyError(
        "sandbox_journey_evidence_incomplete",
      );
    }
    await attestApplication(
      config,
      "access-revoked",
      attestationChallenge(state.runId, "resume-access-revoked"),
      checkoutSessionIds,
    );
    await stateStore.remove(statePath);
    evidence = {
      mode: "executed",
      operation: "resume",
      sandboxOnly: true,
      realEventsProjected: result.realEventsProjected,
      lifecycle: [
        "purchase",
        "cancellation",
        "refund",
      ],
      renewalEvidence: "separate-test-clock-required",
      mutatingResumeRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    };
  } else if (parsed.operation === "recover-anchor-no-invoice") {
    const state = await stateStore.read(statePath);
    assertStateMatchesConfig(state, config);
    if (
      state.schemaVersion !== 3
      || state.phase !== "ready"
      || state.resumeAttemptedAt === null
      || state.recoveryAttemptedAt != null
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_anchor_recovery_state_invalid",
      );
    }
    const checkoutSessionIds = state.checkouts.map(
      (checkout) => checkout.sessionId,
    ) as [string, string];
    await attestApplication(
      config,
      "identity",
      attestationChallenge(state.runId, "recover-identity"),
    );
    await provider.validateForResume(config, state);
    await attestApplication(
      config,
      "access-granted",
      attestationChallenge(state.runId, "recover-access-granted"),
      checkoutSessionIds,
    );
    if (
      !provider.validateForAnchorRecovery
      || !provider.recoverAnchorNoInvoice
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_anchor_recovery_provider_unavailable",
      );
    }
    await provider.validateForAnchorRecovery(config, state);
    const recoveryState: StripeSandboxJourneyState = {
      ...state,
      schemaVersion: STATE_SCHEMA_VERSION,
      phase: "purchases-attested",
      recoveryAttemptedAt: now(),
      repairAttemptedAt: null,
      managedFinishAttemptedAt: null,
    };
    assertStateMatchesConfig(recoveryState, config);
    await stateStore.replace(statePath, recoveryState);
    const result = await provider.recoverAnchorNoInvoice(
      config,
      recoveryState,
    );
    if (result.realEventsProjected !== 5) {
      throw new StripeSandboxJourneyError(
        "sandbox_journey_evidence_incomplete",
      );
    }
    await attestApplication(
      config,
      "access-revoked",
      attestationChallenge(state.runId, "recover-access-revoked"),
      checkoutSessionIds,
    );
    await stateStore.remove(statePath);
    evidence = {
      mode: "executed",
      operation: "recover-anchor-no-invoice",
      sandboxOnly: true,
      realEventsProjected: result.realEventsProjected,
      purchaseEventsPreviouslyAttested: 2,
      lifecycle: [
        "purchase",
        "subscription_invoice_paid",
        "failed_payment",
        "cancellation",
        "refund",
      ],
      recovery: "anchor-no-invoice",
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    };
  } else if (parsed.operation === "repair-invoice-create-rejected") {
    const state = await stateStore.read(statePath);
    assertStateMatchesConfig(state, config);
    if (
      state.schemaVersion !== 4
      || state.phase !== "purchases-attested"
      || state.resumeAttemptedAt === null
      || state.recoveryAttemptedAt == null
      || state.repairAttemptedAt != null
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_invoice_repair_state_invalid",
      );
    }
    const checkoutSessionIds = state.checkouts.map(
      (checkout) => checkout.sessionId,
    ) as [string, string];
    await attestApplication(
      config,
      "identity",
      attestationChallenge(state.runId, "repair-identity"),
    );
    await provider.validateForResume(config, state);
    await attestApplication(
      config,
      "access-granted",
      attestationChallenge(state.runId, "repair-access-granted"),
      checkoutSessionIds,
    );
    if (
      !provider.validateForAnchorRecovery
      || !provider.recoverAnchorNoInvoice
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_invoice_repair_provider_unavailable",
      );
    }
    await provider.validateForAnchorRecovery(config, state);
    const repairState: StripeSandboxJourneyState = {
      ...state,
      schemaVersion: STATE_SCHEMA_VERSION,
      phase: "repair-attempted",
      repairAttemptedAt: now(),
      managedFinishAttemptedAt: null,
    };
    assertStateMatchesConfig(repairState, config);
    await stateStore.replace(statePath, repairState);
    const result = await provider.recoverAnchorNoInvoice(
      config,
      repairState,
    );
    if (result.realEventsProjected !== 5) {
      throw new StripeSandboxJourneyError(
        "sandbox_journey_evidence_incomplete",
      );
    }
    await attestApplication(
      config,
      "access-revoked",
      attestationChallenge(state.runId, "repair-access-revoked"),
      checkoutSessionIds,
    );
    await stateStore.remove(statePath);
    evidence = {
      mode: "executed",
      operation: "repair-invoice-create-rejected",
      sandboxOnly: true,
      realEventsProjected: result.realEventsProjected,
      purchaseEventsPreviouslyAttested: 2,
      lifecycle: [
        "purchase",
        "subscription_invoice_paid",
        "failed_payment",
        "cancellation",
        "refund",
      ],
      recovery: "invoice-create-rejected",
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      mutatingRepairRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    };
  } else {
    const state = await stateStore.read(statePath);
    assertStateMatchesConfig(state, config);
    if (
      (state.schemaVersion !== 5 && state.schemaVersion !== 6)
      || state.phase !== "repair-attempted"
      || state.resumeAttemptedAt === null
      || state.recoveryAttemptedAt == null
      || state.repairAttemptedAt == null
      || state.managedFinishAttemptedAt != null
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_managed_finish_state_invalid",
      );
    }
    const checkoutSessionIds = state.checkouts.map(
      (checkout) => checkout.sessionId,
    ) as [string, string];
    await attestApplication(
      config,
      "identity",
      attestationChallenge(state.runId, "managed-finish-identity"),
    );
    await provider.validateForResume(config, state);
    await attestApplication(
      config,
      "access-granted",
      attestationChallenge(state.runId, "managed-finish-access-granted"),
      checkoutSessionIds,
    );
    if (
      !provider.validateForAnchorRecovery
      || !provider.finishManagedLifecycle
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_managed_finish_provider_unavailable",
      );
    }
    await provider.validateForAnchorRecovery(config, state);
    const finishState: StripeSandboxJourneyState = {
      ...state,
      schemaVersion: STATE_SCHEMA_VERSION,
      phase: "managed-lifecycle-attempted",
      managedFinishAttemptedAt: now(),
    };
    assertStateMatchesConfig(finishState, config);
    await stateStore.replace(statePath, finishState);
    const result = await provider.finishManagedLifecycle(
      config,
      finishState,
    );
    if (result.realEventsProjected !== 3) {
      throw new StripeSandboxJourneyError(
        "sandbox_journey_evidence_incomplete",
      );
    }
    await attestApplication(
      config,
      "access-revoked",
      attestationChallenge(state.runId, "managed-finish-access-revoked"),
      checkoutSessionIds,
    );
    await stateStore.remove(statePath);
    evidence = {
      mode: "executed",
      operation: "finish-managed-lifecycle",
      sandboxOnly: true,
      realEventsProjected: result.realEventsProjected,
      purchaseEventsPreviouslyAttested: 2,
      lifecycle: [
        "purchase",
        "cancellation",
        "refund",
      ],
      renewalEvidence: "separate-test-clock-required",
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      mutatingRepairRetryable: false,
      mutatingManagedFinishRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    };
  }

  writeOutput(JSON.stringify(evidence));
}

export function readStripeSandboxJourneyConfig(
  environment: Readonly<Record<string, string | undefined>>,
): StripeSandboxJourneyConfig {
  const runtimeKey = required(
    environment,
    "STRIPE_SANDBOX_RUNTIME_KEY",
  );
  const operatorKey = required(
    environment,
    "STRIPE_SANDBOX_OPERATOR_KEY",
  );
  if (ANY_LIVE_KEY.test(runtimeKey) || ANY_LIVE_KEY.test(operatorKey)) {
    throw new StripeSandboxJourneyError("live_stripe_key_refused");
  }
  if (!TEST_RUNTIME_KEY.test(runtimeKey)) {
    throw new StripeSandboxJourneyError(
      "restricted_test_runtime_key_required",
    );
  }
  if (!TEST_OPERATOR_KEY.test(operatorKey)) {
    throw new StripeSandboxJourneyError(
      "standard_test_operator_key_required",
    );
  }
  if (runtimeKey === operatorKey) {
    throw new StripeSandboxJourneyError("separate_sandbox_keys_required");
  }

  const webhookSecret = required(
    environment,
    "STRIPE_SANDBOX_WEBHOOK_SECRET",
  );
  if (!/^whsec_[A-Za-z0-9_-]{16,}$/u.test(webhookSecret)) {
    throw new StripeSandboxJourneyError(
      "sandbox_webhook_secret_invalid",
    );
  }
  if (webhookSecret === environment.STRIPE_WEBHOOK_SECRET?.trim()) {
    throw new StripeSandboxJourneyError(
      "sandbox_webhook_secret_reuse_refused",
    );
  }
  const confirmation = required(
    environment,
    "STRIPE_SANDBOX_EXECUTION_CONFIRMATION",
  );
  if (confirmation !== EXECUTION_CONFIRMATION) {
    throw new StripeSandboxJourneyError(
      "sandbox_execution_confirmation_required",
    );
  }

  const applicationOrigin = safeApplicationOrigin(
    required(environment, "STRIPE_SANDBOX_APP_ORIGIN"),
  );
  const convexTargetUrl = safeConvexTargetUrl(
    required(environment, "STRIPE_SANDBOX_CONVEX_URL"),
  );
  const accountId = required(environment, "STRIPE_SANDBOX_ACCOUNT_ID");
  const workspaceId = required(environment, "STRIPE_SANDBOX_WORKSPACE_ID");
  if (
    !SANDBOX_ACCOUNT_ID.test(accountId)
    || !SANDBOX_WORKSPACE_ID.test(workspaceId)
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_projection_identity_invalid",
    );
  }

  const priceIds = Object.fromEntries(commercialPlans.map((plan) => {
    const key =
      `STRIPE_SANDBOX_PRICE_${plan.id.replaceAll("-", "_").toUpperCase()}`;
    const value = required(environment, key);
    if (!PRICE_ID.test(value)) {
      throw new StripeSandboxJourneyError(
        "sandbox_price_configuration_invalid",
      );
    }
    return [plan.id, value];
  })) as Record<CommercialPlanId, string>;
  if (new Set(Object.values(priceIds)).size !== commercialPlans.length) {
    throw new StripeSandboxJourneyError(
      "sandbox_price_configuration_duplicate",
    );
  }

  return {
    runtimeKey,
    operatorKey,
    webhookSecret,
    applicationOrigin,
    convexTargetUrl,
    convexTargetFingerprint: createHash("sha256")
      .update(convexTargetUrl)
      .digest("hex"),
    accountId,
    workspaceId,
    priceIds,
  };
}

function safeConvexTargetUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new StripeSandboxJourneyError("sandbox_convex_target_invalid");
  }
  if (
    url.protocol !== "https:"
    || !url.hostname.endsWith(".convex.cloud")
    || url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash
  ) {
    throw new StripeSandboxJourneyError("sandbox_convex_target_invalid");
  }
  return url.origin;
}

function safeApplicationOrigin(
  raw: string,
): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new StripeSandboxJourneyError("sandbox_origin_invalid");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.+$/u, "");
  if (
    url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash
  ) {
    throw new StripeSandboxJourneyError("sandbox_origin_invalid");
  }
  const loopback =
    hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "[::1]";
  if (
    !loopback
    || url.protocol !== "http:"
  ) {
    throw new StripeSandboxJourneyError(
      "non_loopback_sandbox_origin_refused",
    );
  }
  return url.origin;
}

function parseArguments(argv: string[]): {
  operation: JourneyOperation;
  execute: boolean;
  statePath: string;
} {
  const operation = argv[0];
  if (
    operation !== "prepare"
    && operation !== "resume"
    && operation !== "recover-anchor-no-invoice"
    && operation !== "repair-invoice-create-rejected"
    && operation !== "finish-managed-lifecycle"
  ) {
    throw new StripeSandboxJourneyError("sandbox_journey_usage_invalid");
  }
  let execute = false;
  let statePath = DEFAULT_STATE_PATH;
  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--execute" && !execute) {
      execute = true;
    } else if (value === "--state" && argv[index + 1]) {
      statePath = argv[index + 1];
      index += 1;
    } else {
      throw new StripeSandboxJourneyError("sandbox_journey_usage_invalid");
    }
  }
  return { operation, execute, statePath };
}

function safeStatePath(value: string): string {
  const root = resolve(process.cwd(), "work", "stripe-sandbox");
  const candidate = resolve(process.cwd(), value);
  if (
    dirname(candidate) !== root
    || !candidate.endsWith(".json")
  ) {
    throw new StripeSandboxJourneyError("sandbox_state_path_refused");
  }
  return candidate;
}

function required(
  environment: Readonly<Record<string, string | undefined>>,
  key: string,
): string {
  const value = environment[key]?.trim();
  if (!value) {
    throw new StripeSandboxJourneyError(
      "sandbox_journey_configuration_unavailable",
    );
  }
  return value;
}

function assertStateMatchesConfig(
  state: StripeSandboxJourneyState,
  config: StripeSandboxJourneyConfig,
): void {
  if (
    !(
      (state.schemaVersion === 2 && state.phase === undefined)
      || (state.schemaVersion === 3 && state.phase === "ready")
      || (
        state.schemaVersion === 4
        && (
          state.phase === "ready"
          || state.phase === "purchases-attested"
        )
      )
      || (
        state.schemaVersion === 5
        && (
          state.phase === "ready"
          || state.phase === "purchases-attested"
          || state.phase === "repair-attempted"
        )
      )
      || (
        state.schemaVersion === 6
        && (
          state.phase === "ready"
          || state.phase === "purchases-attested"
          || state.phase === "repair-attempted"
          || state.phase === "managed-lifecycle-attempted"
        )
      )
    )
    || state.applicationOrigin !== config.applicationOrigin
    || !SANDBOX_ACCOUNT_ID.test(state.accountId)
    || !SANDBOX_WORKSPACE_ID.test(state.workspaceId)
    || state.accountId !== config.accountId
    || state.workspaceId !== config.workspaceId
    || !OPAQUE_ID.test(state.runId)
    || !Number.isSafeInteger(state.createdAt)
    || state.createdAt <= 0
    || (
      state.resumeAttemptedAt !== null
      && (
        !Number.isSafeInteger(state.resumeAttemptedAt)
        || state.resumeAttemptedAt < state.createdAt
      )
    )
    || (
      state.recoveryAttemptedAt != null
      && (
        (
          state.schemaVersion !== 4
          && state.schemaVersion !== 5
          && state.schemaVersion !== 6
        )
        || (
          state.phase !== "purchases-attested"
          && state.phase !== "repair-attempted"
          && state.phase !== "managed-lifecycle-attempted"
        )
        || state.resumeAttemptedAt === null
        || !Number.isSafeInteger(state.recoveryAttemptedAt)
        || state.recoveryAttemptedAt < state.resumeAttemptedAt
      )
    )
    || (
      state.repairAttemptedAt != null
      && (
        (
          state.schemaVersion !== 5
          && state.schemaVersion !== 6
        )
        || (
          state.phase !== "repair-attempted"
          && state.phase !== "managed-lifecycle-attempted"
        )
        || state.recoveryAttemptedAt == null
        || !Number.isSafeInteger(state.repairAttemptedAt)
        || state.repairAttemptedAt < state.recoveryAttemptedAt
      )
    )
    || (
      state.managedFinishAttemptedAt != null
      && (
        state.schemaVersion !== 6
        || state.phase !== "managed-lifecycle-attempted"
        || state.repairAttemptedAt == null
        || !Number.isSafeInteger(state.managedFinishAttemptedAt)
        || state.managedFinishAttemptedAt < state.repairAttemptedAt
      )
    )
    || state.checkouts.length !== 2
    || state.checkouts[0].planId !== "individual-monthly"
    || state.checkouts[1].planId !== "individual-lifetime"
    || state.checkouts.some((checkout) =>
      !/^cs_test_[A-Za-z0-9_]+$/u.test(checkout.sessionId)
      || !isStripeCheckoutUrl(checkout.checkoutUrl))
  ) {
    throw new StripeSandboxJourneyError("sandbox_state_invalid");
  }
}

function assertPreparingStateMatchesConfig(
  state: StripeSandboxPreparingState,
  config: StripeSandboxJourneyConfig,
): void {
  if (
    state.schemaVersion !== STATE_SCHEMA_VERSION
    || state.phase !== "preparing"
    || state.applicationOrigin !== config.applicationOrigin
    || state.accountId !== config.accountId
    || state.workspaceId !== config.workspaceId
    || !SANDBOX_ACCOUNT_ID.test(state.accountId)
    || !SANDBOX_WORKSPACE_ID.test(state.workspaceId)
    || !OPAQUE_ID.test(state.runId)
    || !Number.isSafeInteger(state.createdAt)
    || state.createdAt <= 0
    || state.checkouts.length !== 0
    || state.resumeAttemptedAt !== null
    || state.recoveryAttemptedAt !== null
    || state.repairAttemptedAt !== null
    || state.managedFinishAttemptedAt !== null
  ) {
    throw new StripeSandboxJourneyError("sandbox_state_invalid");
  }
}

const fileStateStore: StripeSandboxStateStore = {
  async create(path, state) {
    await preparePrivateStateDirectory(path);
    try {
      await writeFile(path, `${JSON.stringify(state)}\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
    } catch {
      throw new StripeSandboxJourneyError("sandbox_state_create_failed");
    }
  },
  async read(path) {
    await assertPrivateStateDirectory(path);
    let details;
    let raw;
    try {
      details = await lstat(path);
      raw = await readFile(path, "utf8");
    } catch {
      throw new StripeSandboxJourneyError("sandbox_state_unavailable");
    }
    if (
      !details.isFile()
      || details.isSymbolicLink()
      || (details.mode & 0o077) !== 0
      || Buffer.byteLength(raw, "utf8") > 16_384
    ) {
      throw new StripeSandboxJourneyError("sandbox_state_permissions_invalid");
    }
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new StripeSandboxJourneyError("sandbox_state_invalid");
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new StripeSandboxJourneyError("sandbox_state_invalid");
    }
    const state = value as StripeSandboxStoredState;
    if (state.phase === "preparing") {
      throw new StripeSandboxJourneyError("sandbox_prepare_incomplete");
    }
    return state as StripeSandboxJourneyState;
  },
  async replace(path, state) {
    await assertPrivateStateDirectory(path);
    const temporaryPath =
      `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, `${JSON.stringify(state)}\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
      await rename(temporaryPath, path);
    } catch {
      await rm(temporaryPath, { force: true });
      throw new StripeSandboxJourneyError("sandbox_state_replace_failed");
    }
  },
  async remove(path) {
    await assertPrivateStateDirectory(path);
    try {
      await rm(path);
    } catch {
      throw new StripeSandboxJourneyError("sandbox_state_remove_failed");
    }
  },
};

async function preparePrivateStateDirectory(path: string): Promise<void> {
  const sandboxDirectory = dirname(path);
  const workDirectory = dirname(sandboxDirectory);
  await ensureDirectory(workDirectory, false);
  await ensureDirectory(sandboxDirectory, true);
}

async function ensureDirectory(
  path: string,
  requirePrivatePermissions: boolean,
): Promise<void> {
  try {
    await mkdir(path, { mode: 0o700 });
  } catch {
    // A pre-existing directory is valid only after the lstat checks below.
  }
  let details;
  try {
    details = await lstat(path);
  } catch {
    throw new StripeSandboxJourneyError(
      "sandbox_state_directory_invalid",
    );
  }
  if (!details.isDirectory() || details.isSymbolicLink()) {
    throw new StripeSandboxJourneyError(
      "sandbox_state_directory_invalid",
    );
  }
  if (requirePrivatePermissions) {
    await chmod(path, 0o700);
    const secured = await lstat(path);
    if (
      !secured.isDirectory()
      || secured.isSymbolicLink()
      || (secured.mode & 0o077) !== 0
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_state_directory_invalid",
      );
    }
  }
}

async function assertPrivateStateDirectory(path: string): Promise<void> {
  const sandboxDirectory = dirname(path);
  const workDirectory = dirname(sandboxDirectory);
  for (const directory of [workDirectory, sandboxDirectory]) {
    let details;
    try {
      details = await lstat(directory);
    } catch {
      throw new StripeSandboxJourneyError(
        "sandbox_state_directory_invalid",
      );
    }
    if (!details.isDirectory() || details.isSymbolicLink()) {
      throw new StripeSandboxJourneyError(
        "sandbox_state_directory_invalid",
      );
    }
  }
  const sandboxDetails = await lstat(sandboxDirectory);
  if ((sandboxDetails.mode & 0o077) !== 0) {
    throw new StripeSandboxJourneyError(
      "sandbox_state_directory_invalid",
    );
  }
}

export interface RealStripeSandboxJourneyProviderDependencies {
  stripeFactory?: (key: string) => Stripe;
  fetchImplementation?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  eventWaitTimeoutMs?: number;
  webhookFetchTimeoutMs?: number;
}

export class RealStripeSandboxJourneyProvider
  implements StripeSandboxJourneyProvider {
  private readonly stripeFactory: (key: string) => Stripe;
  private readonly fetchImplementation: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly eventWaitTimeoutMs: number;
  private readonly webhookFetchTimeoutMs: number;

  constructor(
    dependencies: RealStripeSandboxJourneyProviderDependencies = {},
  ) {
    this.stripeFactory = dependencies.stripeFactory ?? stripeClient;
    this.fetchImplementation = dependencies.fetchImplementation ?? fetch;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep
      ?? ((milliseconds) => new Promise((resolvePromise) =>
        setTimeout(resolvePromise, milliseconds)));
    this.eventWaitTimeoutMs =
      dependencies.eventWaitTimeoutMs ?? EVENT_WAIT_TIMEOUT_MS;
    this.webhookFetchTimeoutMs =
      dependencies.webhookFetchTimeoutMs ?? WEBHOOK_FETCH_TIMEOUT_MS;
  }

  async prepare(
    config: StripeSandboxJourneyConfig,
    runId: string,
  ): Promise<{
    pricesVerified: number;
    checkouts: [CheckoutContinuation, CheckoutContinuation];
  }> {
    try {
      const runtime = this.stripeFactory(config.runtimeKey);
      await verifySandboxPrices(runtime, config.priceIds);
      const service = new StripeManagedPaymentsService(
        runtime.checkout.sessions,
        {
          secretKey: config.runtimeKey,
          applicationOrigin: config.applicationOrigin,
          priceIds: config.priceIds,
        },
      );
      const create = async (
        planId: "individual-monthly" | "individual-lifetime",
      ): Promise<CheckoutContinuation> => {
        const result = await service.createHostedCheckout({
          idempotencyKey: `${runId}:${planId}`,
          accountId: config.accountId as AccountId,
          workspaceId: config.workspaceId as WorkspaceId,
          commercialOfferRef: planId,
          returnPath: "/account/purchases",
          consent: {
            immediateSupplyRequested: true,
            cancellationLossAcknowledged: true,
            policyVersion: "2026-07-27",
            capturedAt: Date.now(),
          },
        });
        const session = await runtime.checkout.sessions.retrieve(
          result.checkoutRef,
          {},
          { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
        );
        if (
          session.livemode
          || session.status !== "open"
          || session.url !== result.checkoutUrl
          || !isStripeCheckoutUrl(result.checkoutUrl)
        ) {
          throw new StripeSandboxJourneyError(
            "sandbox_checkout_state_invalid",
          );
        }
        return {
          planId,
          sessionId: result.checkoutRef,
          checkoutUrl: result.checkoutUrl,
        };
      };
      return {
        pricesVerified: commercialPlans.length,
        checkouts: [
          await create("individual-monthly"),
          await create("individual-lifetime"),
        ],
      };
    } catch (error) {
      throw safeProviderError(error, "sandbox_prepare_provider_failed");
    }
  }

  async validateForResume(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<void> {
    try {
      const runtime = this.stripeFactory(config.runtimeKey);
      const operator = this.stripeFactory(config.operatorKey);
      await verifySandboxPrices(runtime, config.priceIds);
      await verifySandboxPrices(operator, config.priceIds);
      const runtimeRetriever = new StripeCheckoutSessionRetriever(
        runtime.checkout.sessions,
      );
      const operatorRetriever = new StripeCheckoutSessionRetriever(
        operator.checkout.sessions,
      );
      for (const [index, planId] of [
        "individual-monthly",
        "individual-lifetime",
      ].entries()) {
        const sessionId = state.checkouts[index].sessionId;
        assertCompletedSandboxCheckout(
          await runtimeRetriever.retrieve(sessionId),
          planId as CheckoutContinuation["planId"],
        );
        assertCompletedSandboxCheckout(
          await operatorRetriever.retrieve(sessionId),
          planId as CheckoutContinuation["planId"],
        );
      }
    } catch (error) {
      throw safeProviderError(
        error,
        "sandbox_resume_validation_failed",
      );
    }
  }

  async validateForAnchorRecovery(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<void> {
    try {
      const operator = this.stripeFactory(config.operatorKey);
      await loadAnchorRecoveryContext(operator, config, state);
    } catch (error) {
      throw safeProviderError(
        error,
        "sandbox_anchor_recovery_validation_failed",
      );
    }
  }

  async recoverAnchorNoInvoice(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<{ realEventsProjected: number }> {
    try {
      const operator = this.stripeFactory(config.operatorKey);
      const context = await loadAnchorRecoveryContext(
        operator,
        config,
        state,
      );
      const projectedEvents: Stripe.Event[] = [];
      const project = async (event: Stripe.Event) => {
        await projectSandboxEvent(
          config,
          event,
          this.fetchImplementation,
          this.webhookFetchTimeoutMs,
        );
        projectedEvents.push(event);
      };

      const paidInvoice = await createControlledSubscriptionInvoice({
        stripe: operator,
        config,
        state,
        context,
        leg: "paid",
        paymentMethodId: context.goodPaymentMethodId,
      });
      const paidMarker = nowSeconds(this.now);
      await payControlledInvoice(
        operator,
        paidInvoice.id,
        context.goodPaymentMethodId,
        state.runId,
        "paid",
      );
      await project(await waitForEvent(
        operator,
        ["invoice.paid"],
        paidInvoice.id,
        paidMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const failedMethod = await operator.paymentMethods.create({
        type: "card",
        card: { token: "tok_chargeDeclined" },
        metadata: {
          gummyui_sandbox_run_id: state.runId,
          gummyui_sandbox_step: "failed-payment",
        },
      }, idempotencyOptions(state.runId, "failed-payment-method"));
      if (failedMethod.livemode) {
        throw new StripeSandboxJourneyError(
          "live_sandbox_resource_refused",
        );
      }
      await operator.paymentMethods.attach(
        failedMethod.id,
        { customer: context.customerId },
        idempotencyOptions(state.runId, "failed-payment-attach"),
      );
      await operator.subscriptions.update(
        context.subscriptionId,
        { default_payment_method: failedMethod.id },
        idempotencyOptions(state.runId, "failed-payment-default"),
      );

      const failedInvoice = await createControlledSubscriptionInvoice({
        stripe: operator,
        config,
        state,
        context,
        leg: "failed",
        paymentMethodId: failedMethod.id,
      });
      const failureMarker = nowSeconds(this.now);
      await attemptDeclinedInvoicePayment(
        operator,
        failedInvoice.id,
        failedMethod.id,
        state.runId,
      );
      await project(await waitForEvent(
        operator,
        ["invoice.payment_failed"],
        failedInvoice.id,
        failureMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const scheduledCancellationMarker = nowSeconds(this.now);
      await operator.subscriptions.update(
        context.subscriptionId,
        { cancel_at_period_end: true },
        idempotencyOptions(state.runId, "schedule-cancellation"),
      );
      await project(await waitForEvent(
        operator,
        ["customer.subscription.updated"],
        context.subscriptionId,
        scheduledCancellationMarker,
        (event) => {
          const value = event.data.object as Stripe.Subscription;
          return value.cancel_at_period_end === true;
        },
        this.eventWaitOptions(),
      ));
      const cancellationMarker = nowSeconds(this.now);
      await operator.subscriptions.cancel(
        context.subscriptionId,
        {},
        idempotencyOptions(state.runId, "cancel-subscription"),
      );
      await project(await waitForEvent(
        operator,
        ["customer.subscription.deleted"],
        context.subscriptionId,
        cancellationMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const refundMarker = nowSeconds(this.now);
      const refund = await operator.refunds.create({
        payment_intent: context.lifetimePaymentIntentId,
        metadata: {
          gummyui_sandbox_run_id: state.runId,
          gummyui_sandbox_step: "lifetime-refund",
        },
      }, idempotencyOptions(state.runId, "lifetime-refund"));
      if (
        refund.status !== "succeeded"
        || context.lifetime.amount_total == null
        || refund.amount !== context.lifetime.amount_total
        || refund.currency.toLowerCase()
          !== context.lifetime.currency?.toLowerCase()
      ) {
        throw new StripeSandboxJourneyError(
          "sandbox_full_refund_not_succeeded",
        );
      }
      await project(await waitForEvent(
        operator,
        ["refund.created"],
        refund.id,
        refundMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      try {
        await operator.paymentMethods.detach(
          failedMethod.id,
          {},
          idempotencyOptions(state.runId, "failed-payment-detach"),
        );
      } catch {
        // The exact lifecycle has completed. Cleanup remains best effort.
      }
      return { realEventsProjected: projectedEvents.length };
    } catch (error) {
      throw safeProviderError(
        error,
        "sandbox_anchor_recovery_provider_failed",
      );
    }
  }

  async finishManagedLifecycle(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
  ): Promise<{ realEventsProjected: number }> {
    try {
      const operator = this.stripeFactory(config.operatorKey);
      const context = await loadAnchorRecoveryContext(
        operator,
        config,
        state,
      );
      const projectedEvents: Stripe.Event[] = [];
      const project = async (event: Stripe.Event) => {
        await projectSandboxEvent(
          config,
          event,
          this.fetchImplementation,
          this.webhookFetchTimeoutMs,
        );
        projectedEvents.push(event);
      };

      const scheduledCancellationMarker = nowSeconds(this.now);
      await operator.subscriptions.update(
        context.subscriptionId,
        { cancel_at_period_end: true },
        idempotencyOptions(state.runId, "schedule-cancellation"),
      );
      await project(await waitForEvent(
        operator,
        ["customer.subscription.updated"],
        context.subscriptionId,
        scheduledCancellationMarker,
        (event) => {
          const value = event.data.object as Stripe.Subscription;
          return value.cancel_at_period_end === true;
        },
        this.eventWaitOptions(),
      ));

      const cancellationMarker = nowSeconds(this.now);
      await operator.subscriptions.cancel(
        context.subscriptionId,
        {},
        idempotencyOptions(state.runId, "cancel-subscription"),
      );
      await project(await waitForEvent(
        operator,
        ["customer.subscription.deleted"],
        context.subscriptionId,
        cancellationMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const refundMarker = nowSeconds(this.now);
      const refund = await operator.refunds.create({
        payment_intent: context.lifetimePaymentIntentId,
        metadata: {
          gummyui_sandbox_run_id: state.runId,
          gummyui_sandbox_step: "lifetime-refund",
        },
      }, idempotencyOptions(state.runId, "lifetime-refund"));
      if (
        refund.status !== "succeeded"
        || context.lifetime.amount_total == null
        || refund.amount !== context.lifetime.amount_total
        || refund.currency.toLowerCase()
          !== context.lifetime.currency?.toLowerCase()
      ) {
        throw new StripeSandboxJourneyError(
          "sandbox_full_refund_not_succeeded",
        );
      }
      await project(await waitForEvent(
        operator,
        ["refund.created"],
        refund.id,
        refundMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      return { realEventsProjected: projectedEvents.length };
    } catch (error) {
      throw safeProviderError(
        error,
        "sandbox_managed_finish_provider_failed",
      );
    }
  }

  async resume(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
    hooks: {
      afterPurchasesProjected(): Promise<void>;
    },
  ): Promise<{ realEventsProjected: number }> {
    try {
      const runtime = this.stripeFactory(config.runtimeKey);
      const operator = this.stripeFactory(config.operatorKey);
      await verifySandboxPrices(runtime, config.priceIds);
      const retriever = new StripeCheckoutSessionRetriever(
        runtime.checkout.sessions,
      );
      const monthly = await retriever.retrieve(state.checkouts[0].sessionId);
      const lifetime = await retriever.retrieve(state.checkouts[1].sessionId);
      assertCompletedSandboxCheckout(monthly, "individual-monthly");
      assertCompletedSandboxCheckout(lifetime, "individual-lifetime");

      const projectedEvents: Stripe.Event[] = [];
      const project = async (event: Stripe.Event) => {
        await projectSandboxEvent(
          config,
          event,
          this.fetchImplementation,
          this.webhookFetchTimeoutMs,
        );
        projectedEvents.push(event);
      };
      const createdAfter = Math.floor(state.createdAt / 1_000) - 5;
      await project(await waitForEvent(
        operator,
        ["checkout.session.completed"],
        monthly.id,
        createdAfter,
        undefined,
        this.eventWaitOptions(),
      ));
      await project(await waitForEvent(
        operator,
        ["checkout.session.completed"],
        lifetime.id,
        createdAfter,
        undefined,
        this.eventWaitOptions(),
      ));
      await hooks.afterPurchasesProjected();

      const subscriptionId = expandableId(
        monthly.subscription,
        "sandbox_subscription_unavailable",
      );
      const lifetimePaymentIntentId = expandableId(
        lifetime.payment_intent,
        "sandbox_payment_intent_unavailable",
      );

      const scheduledCancellationMarker = nowSeconds(this.now);
      await operator.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: true },
        idempotencyOptions(state.runId, "schedule-cancellation"),
      );
      await project(await waitForEvent(
        operator,
        ["customer.subscription.updated"],
        subscriptionId,
        scheduledCancellationMarker,
        (event) => {
          const value = event.data.object as Stripe.Subscription;
          return value.cancel_at_period_end === true;
        },
        this.eventWaitOptions(),
      ));
      const cancellationMarker = nowSeconds(this.now);
      await operator.subscriptions.cancel(
        subscriptionId,
        {},
        idempotencyOptions(state.runId, "cancel-subscription"),
      );
      await project(await waitForEvent(
        operator,
        ["customer.subscription.deleted"],
        subscriptionId,
        cancellationMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const refundMarker = nowSeconds(this.now);
      const refund = await operator.refunds.create({
        payment_intent: lifetimePaymentIntentId,
        metadata: {
          gummyui_sandbox_run_id: state.runId,
          gummyui_sandbox_step: "lifetime-refund",
        },
      }, idempotencyOptions(state.runId, "lifetime-refund"));
      if (
        refund.status !== "succeeded"
        || lifetime.amount_total == null
        || refund.amount !== lifetime.amount_total
        || refund.currency.toLowerCase() !== lifetime.currency?.toLowerCase()
      ) {
        throw new StripeSandboxJourneyError(
          "sandbox_full_refund_not_succeeded",
        );
      }
      await project(await waitForEvent(
        operator,
        ["refund.created"],
        refund.id,
        refundMarker,
        undefined,
        this.eventWaitOptions(),
      ));
      return { realEventsProjected: projectedEvents.length };
    } catch (error) {
      throw safeProviderError(error, "sandbox_resume_provider_failed");
    }
  }

  private eventWaitOptions(): EventWaitOptions {
    return {
      now: this.now,
      sleep: this.sleep,
      timeoutMs: this.eventWaitTimeoutMs,
    };
  }
}

interface AnchorRecoveryContext {
  monthly: Stripe.Checkout.Session;
  lifetime: Stripe.Checkout.Session;
  subscriptionId: string;
  customerId: string;
  goodPaymentMethodId: string;
  lifetimePaymentIntentId: string;
  initialInvoiceId: string;
}

async function loadAnchorRecoveryContext(
  stripe: Stripe,
  config: StripeSandboxJourneyConfig,
  state: StripeSandboxJourneyState,
): Promise<AnchorRecoveryContext> {
  await verifySandboxPrices(stripe, config.priceIds);
  const retriever = new StripeCheckoutSessionRetriever(
    stripe.checkout.sessions,
  );
  const monthly = await retriever.retrieve(state.checkouts[0].sessionId);
  const lifetime = await retriever.retrieve(state.checkouts[1].sessionId);
  assertCompletedSandboxCheckout(monthly, "individual-monthly");
  assertCompletedSandboxCheckout(lifetime, "individual-lifetime");
  const subscriptionId = expandableId(
    monthly.subscription,
    "sandbox_subscription_unavailable",
  );
  const customerId = expandableId(
    monthly.customer,
    "sandbox_customer_unavailable",
  );
  if (
    expandableId(
      lifetime.customer,
      "sandbox_customer_unavailable",
    ) === customerId
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_anchor_recovery_customer_invalid",
    );
  }
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId,
    { expand: ["latest_invoice"] },
  );
  const item = subscription.items.data[0];
  const itemPriceId = typeof item?.price === "string"
    ? item.price
    : item?.price?.id;
  const subscriptionCustomerId = expandableId(
    subscription.customer,
    "sandbox_customer_unavailable",
  );
  if (
    subscription.livemode
    || subscription.status !== "active"
    || subscription.cancel_at_period_end
    || subscription.canceled_at !== null
    || subscriptionCustomerId !== customerId
    || subscription.metadata?.commercial_offer_ref !== "individual-monthly"
    || subscription.metadata?.account_id !== state.accountId
    || subscription.metadata?.workspace_id !== state.workspaceId
    || subscription.items.data.length !== 1
    || item?.quantity !== 1
    || itemPriceId !== config.priceIds["individual-monthly"]
    || !Number.isSafeInteger(item.current_period_start)
    || !Number.isSafeInteger(item.current_period_end)
    || item.current_period_start <= subscription.created
    || item.current_period_end <= item.current_period_start
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_anchor_recovery_subscription_invalid",
    );
  }
  const initialInvoiceId = expandableId(
    subscription.latest_invoice,
    "sandbox_initial_invoice_unavailable",
  );
  const invoices = await stripe.invoices.list({
    subscription: subscriptionId,
    limit: 100,
  });
  if (
    invoices.has_more
    || invoices.data.length !== 1
    || invoices.data[0].id !== initialInvoiceId
    || invoices.data[0].livemode
    || invoices.data[0].status !== "paid"
    || invoices.data[0].billing_reason !== "subscription_create"
    || expandableId(
      invoices.data[0].customer,
      "sandbox_customer_unavailable",
    ) !== customerId
    || invoiceSubscriptionId(invoices.data[0]) !== subscriptionId
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_anchor_recovery_invoice_state_invalid",
    );
  }
  const goodPaymentMethodId = expandableId(
    subscription.default_payment_method,
    "sandbox_payment_method_unavailable",
  );
  const lifetimePaymentIntentId = expandableId(
    lifetime.payment_intent,
    "sandbox_payment_intent_unavailable",
  );
  const lifetimePaymentIntent = await stripe.paymentIntents.retrieve(
    lifetimePaymentIntentId,
  );
  if (
    lifetimePaymentIntent.livemode
    || lifetimePaymentIntent.status !== "succeeded"
    || lifetimePaymentIntent.amount_received !== lifetime.amount_total
    || lifetimePaymentIntent.currency.toLowerCase()
      !== lifetime.currency?.toLowerCase()
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_anchor_recovery_lifetime_invalid",
    );
  }
  const refunds = await stripe.refunds.list({
    payment_intent: lifetimePaymentIntentId,
    limit: 100,
  });
  if (refunds.has_more || refunds.data.length !== 0) {
    throw new StripeSandboxJourneyError(
      "sandbox_anchor_recovery_refund_state_invalid",
    );
  }
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 100,
  });
  if (
    paymentMethods.has_more
    || paymentMethods.data.some((paymentMethod) =>
      paymentMethod.livemode
      || paymentMethod.metadata?.gummyui_sandbox_run_id === state.runId)
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_anchor_recovery_payment_method_state_invalid",
    );
  }
  const laterEvents = await stripe.events.list({
    created: { gte: Math.floor(state.createdAt / 1_000) - 5 },
    types: [
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_failed",
      "refund.created",
    ],
    limit: 100,
  });
  if (
    laterEvents.has_more
    || laterEvents.data.some((event) => {
      if (event.livemode) return true;
      if (
        event.type === "customer.subscription.updated"
        && containsIdentifier(event.data.object, subscriptionId)
      ) {
        return (
          event.data.object as Stripe.Subscription
        ).cancel_at_period_end === true;
      }
      return (
        containsIdentifier(event.data.object, subscriptionId)
        || containsIdentifier(event.data.object, lifetimePaymentIntentId)
        || containsIdentifier(event.data.object, state.runId)
      );
    })
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_anchor_recovery_lifecycle_already_advanced",
    );
  }
  return {
    monthly,
    lifetime,
    subscriptionId,
    customerId,
    goodPaymentMethodId,
    lifetimePaymentIntentId,
    initialInvoiceId,
  };
}

async function createControlledSubscriptionInvoice(input: {
  stripe: Stripe;
  config: StripeSandboxJourneyConfig;
  state: StripeSandboxJourneyState;
  context: AnchorRecoveryContext;
  leg: "paid" | "failed";
  paymentMethodId: string;
}): Promise<Stripe.Invoice> {
  const metadata = {
    gummyui_sandbox_run_id: input.state.runId,
    gummyui_sandbox_step: `${input.leg}-subscription-invoice`,
  };
  const invoice = await input.stripe.invoices.create({
    customer: input.context.customerId,
    subscription: input.context.subscriptionId,
    default_payment_method: input.paymentMethodId,
    collection_method: "charge_automatically",
    auto_advance: false,
    metadata,
  }, idempotencyOptions(
    input.state.runId,
    `${input.leg}-invoice-create`,
  ));
  if (
    invoice.livemode
    || invoice.status !== "draft"
    || expandableId(
      invoice.customer,
      "sandbox_customer_unavailable",
    ) !== input.context.customerId
    || invoiceSubscriptionId(invoice) !== input.context.subscriptionId
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_controlled_invoice_invalid",
    );
  }
  const item = await input.stripe.invoiceItems.create({
    customer: input.context.customerId,
    subscription: input.context.subscriptionId,
    invoice: invoice.id,
    pricing: {
      price: input.config.priceIds["individual-monthly"],
    },
    quantity: 1,
    metadata,
  }, idempotencyOptions(
    input.state.runId,
    `${input.leg}-invoice-item`,
  ));
  if (
    item.livemode
    || expandableId(
      item.customer,
      "sandbox_customer_unavailable",
    ) !== input.context.customerId
    || expandableId(
      item.invoice,
      "sandbox_invoice_unavailable",
    ) !== invoice.id
    || item.amount !== 4_900
    || item.currency.toLowerCase() !== "usd"
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_controlled_invoice_item_invalid",
    );
  }
  const finalized = await input.stripe.invoices.finalizeInvoice(
    invoice.id,
    { auto_advance: false },
    idempotencyOptions(
      input.state.runId,
      `${input.leg}-invoice-finalize`,
    ),
  );
  if (
    finalized.livemode
    || finalized.status !== "open"
    || finalized.amount_due <= 0
    || expandableId(
      finalized.customer,
      "sandbox_customer_unavailable",
    ) !== input.context.customerId
    || invoiceSubscriptionId(finalized)
      !== input.context.subscriptionId
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_controlled_invoice_invalid",
    );
  }
  return finalized;
}

async function payControlledInvoice(
  stripe: Stripe,
  invoiceId: string,
  paymentMethodId: string,
  runId: string,
  leg: "paid",
): Promise<void> {
  const paid = await stripe.invoices.pay(
    invoiceId,
    { payment_method: paymentMethodId },
    idempotencyOptions(runId, `${leg}-invoice-pay`),
  );
  if (
    paid.livemode
    || paid.status !== "paid"
    || paid.amount_paid <= 0
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_controlled_invoice_payment_invalid",
    );
  }
}

async function attemptDeclinedInvoicePayment(
  stripe: Stripe,
  invoiceId: string,
  paymentMethodId: string,
  runId: string,
): Promise<void> {
  try {
    const result = await stripe.invoices.pay(
      invoiceId,
      { payment_method: paymentMethodId },
      idempotencyOptions(runId, "failed-invoice-pay"),
    );
    if (result.status !== "open") {
      throw new StripeSandboxJourneyError(
        "sandbox_declined_invoice_payment_invalid",
      );
    }
  } catch (error) {
    if (!isExpectedCardDecline(error)) throw error;
  }
  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (
    invoice.livemode
    || invoice.status !== "open"
    || invoice.attempted !== true
    || invoice.amount_due <= 0
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_declined_invoice_payment_invalid",
    );
  }
}

function isExpectedCardDecline(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as {
    type?: unknown;
    code?: unknown;
    decline_code?: unknown;
  };
  return (
    value.type === "StripeCardError"
    && value.code === "card_declined"
    && typeof value.decline_code === "string"
  );
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string {
  const parent = invoice.parent as {
    subscription_details?: {
      subscription?: string | { id: string } | null;
    } | null;
  } | null;
  return expandableId(
    parent?.subscription_details?.subscription ?? null,
    "sandbox_subscription_unavailable",
  );
}

function idempotencyOptions(
  runId: string,
  step: string,
): Stripe.RequestOptions {
  const idempotencyKey = `gummyui:${runId}:${step}`;
  if (idempotencyKey.length > 255) {
    throw new StripeSandboxJourneyError(
      "sandbox_idempotency_key_invalid",
    );
  }
  return { idempotencyKey };
}

function stripeClient(key: string): Stripe {
  return new Stripe(key, {
    maxNetworkRetries: 2,
    timeout: 20_000,
    typescript: true,
  });
}

async function verifySandboxPrices(
  stripe: Stripe,
  priceIds: Readonly<Record<CommercialPlanId, string>>,
): Promise<void> {
  for (const plan of commercialPlans) {
    const price = await stripe.prices.retrieve(priceIds[plan.id]);
    const expectedRecurring = plan.billingInterval === "lifetime"
      ? null
      : plan.billingInterval;
    if (
      price.livemode
      || !price.active
      || price.id !== priceIds[plan.id]
      || price.currency.toLowerCase() !== "usd"
      || price.unit_amount !== plan.priceUsd * 100
      || (
        expectedRecurring === null
          ? price.type !== "one_time" || price.recurring !== null
          : price.type !== "recurring"
            || price.recurring?.interval !== expectedRecurring
            || price.recurring.interval_count !== 1
      )
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_price_contract_mismatch",
      );
    }
  }
}

function assertCompletedSandboxCheckout(
  session: Stripe.Checkout.Session,
  planId: "individual-monthly" | "individual-lifetime",
): void {
  if (
    session.livemode
    || session.status !== "complete"
    || session.payment_status !== "paid"
    || session.metadata?.commercial_offer_ref !== planId
    || session.metadata.immediate_supply_requested !== "true"
    || session.metadata.cancellation_loss_acknowledged !== "true"
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_checkout_completion_required",
    );
  }
}

interface EventWaitOptions {
  now: () => number;
  sleep: (milliseconds: number) => Promise<void>;
  timeoutMs: number;
}

async function waitForEvent(
  stripe: Stripe,
  types: string[],
  targetId: string,
  createdAfter: number,
  predicate: (event: Stripe.Event) => boolean = () => true,
  options: EventWaitOptions = {
    now: Date.now,
    sleep: (milliseconds) => new Promise((resolvePromise) =>
      setTimeout(resolvePromise, milliseconds)),
    timeoutMs: EVENT_WAIT_TIMEOUT_MS,
  },
): Promise<Stripe.Event> {
  const deadline = options.now() + options.timeoutMs;
  do {
    const events = await stripe.events.list({
      created: { gte: Math.max(0, createdAfter - 2) },
      types,
      limit: 100,
    });
    const event = events.data.find((candidate) =>
      !candidate.livemode
      && containsIdentifier(candidate.data.object, targetId)
      && predicate(candidate));
    if (event) return event;
    await options.sleep(EVENT_POLL_INTERVAL_MS);
  } while (options.now() < deadline);
  throw new StripeSandboxJourneyError("sandbox_event_wait_timeout");
}

function containsIdentifier(value: unknown, targetId: string): boolean {
  if (value === targetId) return true;
  if (Array.isArray(value)) {
    return value.some((item) => containsIdentifier(item, targetId));
  }
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((item) =>
    containsIdentifier(item, targetId));
}

export async function projectSandboxEvent(
  config: StripeSandboxJourneyConfig,
  event: Stripe.Event,
  fetchImplementation: typeof fetch = fetch,
  fetchTimeoutMs: number = WEBHOOK_FETCH_TIMEOUT_MS,
  acceptedStatuses: readonly ("applied" | "duplicate")[] = ["applied"],
): Promise<void> {
  if (event.livemode) {
    throw new StripeSandboxJourneyError("live_sandbox_event_refused");
  }
  const payload = JSON.stringify(event);
  const signature = await Stripe.webhooks.generateTestHeaderStringAsync({
    payload,
    secret: config.webhookSecret,
  });
  let response: Response;
  try {
    response = await fetchImplementation(
      new URL("/api/webhooks/stripe", config.applicationOrigin),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature,
        },
        body: payload,
        redirect: "error",
        signal: AbortSignal.timeout(fetchTimeoutMs),
      },
    );
  } catch {
    throw new StripeSandboxJourneyError(
      "sandbox_webhook_projection_unavailable",
    );
  }
  if (response.status !== 200) {
    throw new StripeSandboxJourneyError(
      "sandbox_webhook_projection_rejected",
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new StripeSandboxJourneyError(
      "sandbox_webhook_projection_invalid",
    );
  }
  if (
    !body
    || typeof body !== "object"
    || (body as { received?: unknown }).received !== true
    || !acceptedStatuses.some((status) =>
      status === (body as { status?: unknown }).status)
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_webhook_projection_not_applied",
    );
  }
}

export async function attestSandboxApplication(
  config: StripeSandboxJourneyConfig,
  phase: "identity" | "access-granted" | "access-revoked",
  challenge: string,
  checkoutSessionIds?: [string, string],
  fetchImplementation: typeof fetch = fetch,
  fetchTimeoutMs: number = WEBHOOK_FETCH_TIMEOUT_MS,
): Promise<void> {
  let response: Response;
  try {
    response = await fetchImplementation(
      new URL(
        "/api/internal/stripe-sandbox-attestation",
        config.applicationOrigin,
      ),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challenge,
          phase,
          accountId: config.accountId,
          workspaceId: config.workspaceId,
          ...(checkoutSessionIds ? { checkoutSessionIds } : {}),
        }),
        redirect: "error",
        signal: AbortSignal.timeout(fetchTimeoutMs),
      },
    );
  } catch {
    throw new StripeSandboxJourneyError(
      "sandbox_application_attestation_unavailable",
    );
  }
  if (response.status !== 200) {
    throw new StripeSandboxJourneyError(
      "sandbox_application_attestation_rejected",
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new StripeSandboxJourneyError(
      "sandbox_application_attestation_invalid",
    );
  }
  const value = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  if (
    value.challenge !== challenge
    || value.targetClass !== "isolated-test"
    || value.targetFingerprint !== config.convexTargetFingerprint
    || value.identityReady !== true
    || (phase === "access-granted" && value.accessGranted !== true)
    || (phase === "access-revoked" && value.accessRevoked !== true)
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_application_attestation_invalid",
    );
  }
}

function attestationChallenge(runId: string, phase: string): string {
  return createHash("sha256").update(`${runId}:${phase}`).digest("hex");
}

function expandableId(
  value: string | { id: string } | null,
  code: string,
): string {
  const id = typeof value === "string" ? value : value?.id;
  if (!id || !OPAQUE_ID.test(id)) {
    throw new StripeSandboxJourneyError(code);
  }
  return id;
}

function nowSeconds(now: () => number = Date.now): number {
  return Math.floor(now() / 1_000);
}

function isStripeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && (
        url.hostname === "stripe.com"
        || url.hostname.endsWith(".stripe.com")
      );
  } catch {
    return false;
  }
}

function safeProviderError(
  error: unknown,
  fallbackCode: string,
): StripeSandboxJourneyError {
  return error instanceof StripeSandboxJourneyError
    ? error
    : new StripeSandboxJourneyError(fallbackCode);
}

const directEntryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (directEntryUrl === import.meta.url) {
  runStripeSandboxJourney().catch((error: unknown) => {
    const code = error instanceof StripeSandboxJourneyError
      ? error.code
      : "stripe_sandbox_journey_failed";
    process.stderr.write(`${JSON.stringify({ ok: false, error: code })}\n`);
    process.exitCode = 1;
  });
}
