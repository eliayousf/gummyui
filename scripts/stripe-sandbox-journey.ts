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
const STATE_SCHEMA_VERSION = 3;
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

type JourneyOperation = "prepare" | "resume";

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
  schemaVersion: 2 | 3;
  phase?: "ready";
  runId: string;
  createdAt: number;
  applicationOrigin: string;
  accountId: string;
  workspaceId: string;
  checkouts: [CheckoutContinuation, CheckoutContinuation];
  resumeAttemptedAt: number | null;
}

interface StripeSandboxPreparingState {
  schemaVersion: 3;
  phase: "preparing";
  runId: string;
  createdAt: number;
  applicationOrigin: string;
  accountId: string;
  workspaceId: string;
  checkouts: [];
  resumeAttemptedAt: null;
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
  lifecycle?: readonly [
    "purchase",
    "billing_anchor_reset_invoice",
    "failed_payment",
    "cancellation",
    "refund",
  ];
  mutatingResumeRetryable?: false;
  isolatedConvexAttested?: true;
  accessRevocationVerified?: true;
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
  } else {
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
    const result = await provider.resume(config, startedState);
    if (result.realEventsProjected !== 7) {
      throw new StripeSandboxJourneyError(
        "sandbox_journey_evidence_incomplete",
      );
    }
    await attestApplication(
      config,
      "access-revoked",
      attestationChallenge(state.runId, "resume-access-revoked"),
      state.checkouts.map((checkout) => checkout.sessionId) as [string, string],
    );
    await stateStore.remove(statePath);
    evidence = {
      mode: "executed",
      operation: "resume",
      sandboxOnly: true,
      realEventsProjected: result.realEventsProjected,
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
    || (url.protocol !== "http:" && url.protocol !== "https:")
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
  if (operation !== "prepare" && operation !== "resume") {
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
    if (state.schemaVersion === 3 && state.phase === "preparing") {
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

  async resume(
    config: StripeSandboxJourneyConfig,
    state: StripeSandboxJourneyState,
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

      const subscriptionId = expandableId(
        monthly.subscription,
        "sandbox_subscription_unavailable",
      );
      const subscriptionMarker = nowSeconds(this.now);
      const initialInvoiceId = expandableId(
        monthly.subscription && typeof monthly.subscription === "object"
          ? monthly.subscription.latest_invoice
          : null,
        "sandbox_initial_invoice_unavailable",
      );
      const renewedSubscription = await operator.subscriptions.update(
        subscriptionId,
        {
          billing_cycle_anchor: "now",
          expand: ["latest_invoice"],
          proration_behavior: "none",
        },
      );
      const renewalInvoiceId = expandableId(
        renewedSubscription.latest_invoice,
        "sandbox_renewal_invoice_unavailable",
      );
      if (renewalInvoiceId === initialInvoiceId) {
        throw new StripeSandboxJourneyError(
          "sandbox_renewal_invoice_unavailable",
        );
      }
      await project(await waitForEvent(
        operator,
        ["invoice.paid"],
        renewalInvoiceId,
        subscriptionMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const customerId = expandableId(
        monthly.customer,
        "sandbox_customer_unavailable",
      );
      const failedMethod = await operator.paymentMethods.create({
        type: "card",
        card: { token: "tok_chargeDeclined" },
        metadata: { gummyui_sandbox_run_id: state.runId },
      });
      if (failedMethod.livemode) {
        throw new StripeSandboxJourneyError(
          "live_sandbox_resource_refused",
        );
      }
      await operator.paymentMethods.attach(failedMethod.id, {
        customer: customerId,
      });
      await operator.subscriptions.update(subscriptionId, {
        default_payment_method: failedMethod.id,
      });
      const failureMarker = nowSeconds(this.now);
      const failedSubscription = await operator.subscriptions.update(
        subscriptionId,
        {
          billing_cycle_anchor: "now",
          expand: ["latest_invoice"],
          proration_behavior: "none",
        },
      );
      const failedInvoiceId = expandableId(
        failedSubscription.latest_invoice,
        "sandbox_failed_invoice_unavailable",
      );
      if (failedInvoiceId === renewalInvoiceId) {
        throw new StripeSandboxJourneyError(
          "sandbox_failed_invoice_unavailable",
        );
      }
      await project(await waitForEvent(
        operator,
        ["invoice.payment_failed"],
        failedInvoiceId,
        failureMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const scheduledCancellationMarker = nowSeconds(this.now);
      await operator.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
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
      await operator.subscriptions.cancel(subscriptionId);
      await project(await waitForEvent(
        operator,
        ["customer.subscription.deleted"],
        subscriptionId,
        cancellationMarker,
        undefined,
        this.eventWaitOptions(),
      ));

      const paymentIntentId = expandableId(
        lifetime.payment_intent,
        "sandbox_payment_intent_unavailable",
      );
      const refundMarker = nowSeconds(this.now);
      const refund = await operator.refunds.create({
        payment_intent: paymentIntentId,
        metadata: { gummyui_sandbox_run_id: state.runId },
      });
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

      try {
        await operator.paymentMethods.detach(failedMethod.id);
      } catch {
        // The journey has already completed. Cleanup remains best effort and
        // intentionally does not turn a verified projection into a retry.
      }
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
    || (body as { status?: unknown }).status !== "applied"
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_webhook_projection_not_applied",
    );
  }
}

export async function attestSandboxApplication(
  config: StripeSandboxJourneyConfig,
  phase: "identity" | "access-revoked",
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
