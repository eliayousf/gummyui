"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { CommercialPlan } from "../data/commercial";

export function CheckoutForm({ plan }: { plan: CommercialPlan }) {
  const [state, setState] = useState<
    "idle" | "working" | "signed-out" | "failed"
  >("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "working") return;
    const form = new FormData(event.currentTarget);
    if (
      form.get("immediateSupply") !== "on"
      || form.get("cancellationLoss") !== "on"
    ) {
      setState("failed");
      return;
    }
    setState("working");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          requestId: `browser:${crypto.randomUUID()}`,
          immediateSupplyRequested: true,
          cancellationLossAcknowledged: true,
        }),
      });
      if (response.status === 404) {
        setState("signed-out");
        return;
      }
      const body = await response.json() as { checkoutUrl?: unknown };
      if (
        response.status !== 201
        || typeof body.checkoutUrl !== "string"
      ) {
        throw new Error("Checkout unavailable");
      }
      const url = new URL(body.checkoutUrl);
      if (
        url.protocol !== "https:"
        || url.hostname !== "checkout.stripe.com"
      ) {
        throw new Error("Unexpected checkout destination");
      }
      window.location.assign(url.toString());
    } catch {
      setState("failed");
    }
  }

  return (
    <form className="checkout-confirmation" onSubmit={submit}>
      <label>
        <input type="checkbox" name="immediateSupply" required />
        <span>
          I ask Gummy UI to supply the paid digital files immediately after
          payment.
        </span>
      </label>
      <label>
        <input type="checkbox" name="cancellationLoss" required />
        <span>
          I understand that accessing the paid files may end my statutory
          cancellation right. The 14-day goodwill refund applies only while
          paid files have not been accessed.
        </span>
      </label>
      <p>
        By continuing, you agree to the <Link href="/terms">terms</Link>,
        {" "}<Link href="/commercial-license">commercial licence</Link> and
        {" "}<Link href="/refund">refund policy</Link>.
      </p>
      <button type="submit" disabled={state === "working"}>
        {state === "working"
          ? "Opening secure checkout…"
          : `Continue to Stripe · $${plan.priceUsd.toLocaleString("en-US")} USD`}
      </button>
      {state === "signed-out" ? (
        <p role="status">
          Please <Link href="/sign-in">sign in securely</Link> and then return
          to this plan.
        </p>
      ) : null}
      {state === "failed" ? (
        <p role="alert">
          Checkout could not be opened. Check both confirmations and try
          again, or contact support.
        </p>
      ) : null}
    </form>
  );
}
