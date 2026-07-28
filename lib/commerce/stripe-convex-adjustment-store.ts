import "server-only";
import { executeConvex } from "../../db";
import type {
  StripeAdjustmentProjection,
  StripeAdjustmentStore,
} from "./stripe-adjustments";

export class ConvexStripeAdjustmentStore implements StripeAdjustmentStore {
  async apply(
    projection: StripeAdjustmentProjection,
  ): Promise<"applied" | "duplicate" | "ignored"> {
    return executeConvex("stripe.adjustment.apply", projection);
  }
}
