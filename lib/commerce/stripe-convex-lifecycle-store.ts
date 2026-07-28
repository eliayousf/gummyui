import "server-only";
import { executeConvex } from "../../db";
import type {
  StripeLifecycleProjection,
  StripeLifecycleStore,
} from "./stripe-lifecycle";

export class ConvexStripeLifecycleStore implements StripeLifecycleStore {
  async apply(
    projection: StripeLifecycleProjection,
  ): Promise<"applied" | "duplicate" | "ignored"> {
    return executeConvex("stripe.lifecycle.apply", projection);
  }
}
