import "server-only";
import { executeConvex } from "../../db";
import type {
  StripeFulfillmentProjection,
  StripeFulfillmentStore,
} from "./stripe-fulfillment";

export class ConvexStripeFulfillmentStore implements StripeFulfillmentStore {
  async apply(
    projection: StripeFulfillmentProjection,
  ): Promise<"applied" | "duplicate"> {
    return executeConvex("stripe.fulfillment.apply", projection);
  }
}
