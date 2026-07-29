import { pathToFileURL } from "node:url";
import {
  type StripePriceReader,
  verifyStripeProductionReadiness,
} from "../lib/commerce/stripe-production-readiness";

export async function runStripeProductionReadiness(
  dependencies: {
    environment?: Readonly<Record<string, string | undefined>>;
    prices?: StripePriceReader;
    writeOutput?: (output: string) => void;
  } = {},
): Promise<void> {
  const writeOutput = dependencies.writeOutput
    ?? ((output: string) => console.log(output));
  const result = await verifyStripeProductionReadiness(dependencies);
  writeOutput(JSON.stringify(result));
}

const directEntryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (directEntryUrl === import.meta.url) {
  runStripeProductionReadiness().catch((error: unknown) => {
    const message = error instanceof Error
      ? error.message
      : "Unknown readiness failure";
    console.error(`Stripe production readiness failed: ${message}`);
    process.exitCode = 1;
  });
}
