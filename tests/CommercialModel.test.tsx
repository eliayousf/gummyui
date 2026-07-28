import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CommercialLicensePage from "../app/commercial-license/page";
import {
  commercialFacts,
  commercialPlans,
  commercialPolicy,
} from "../app/data/commercial";
import PricingPage from "../app/pricing/page";
import RefundPage from "../app/refund/page";
import TermsPage from "../app/terms/page";

afterEach(cleanup);

describe("approved commercial model", () => {
  it("keeps the approved identity, email, tax status, and payment model canonical", () => {
    expect(commercialFacts).toMatchObject({
      tradingName: "GUMMY UI",
      legalName: "KREYD LABS LTD",
      companyNumber: "17152066",
      supportEmail: "support@kreydlabs.com",
      vatStatus: "Not VAT registered",
    });
    expect(commercialPolicy).toMatchObject({
      currency: "USD",
      billingIntervals: ["month", "year", "lifetime"],
      subscriptionUpdates: "active-subscription",
      lifetimeUpdates: "product-lifetime",
      refundDays: 14,
      supportFirstResponse: "two UK business days",
      paymentProvider: "Stripe Managed Payments",
      worldwide: true,
      checkoutStatus: "pre-launch",
    });
  });

  it("keeps all nine benchmark-aligned prices, billing modes, seats, and all-access boundaries", () => {
    expect(
      commercialPlans.map(
        ({
          id,
          priceUsd,
          seats,
          billingInterval,
          checkoutMode,
          includesTemplatesAndDesignKit,
        }) => ({
          id,
          priceUsd,
          seats,
          billingInterval,
          checkoutMode,
          includesTemplatesAndDesignKit,
        }),
      ),
    ).toEqual([
      {
        id: "individual-monthly",
        priceUsd: 49,
        seats: 1,
        billingInterval: "month",
        checkoutMode: "subscription",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "individual-yearly",
        priceUsd: 389,
        seats: 1,
        billingInterval: "year",
        checkoutMode: "subscription",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "individual-lifetime",
        priceUsd: 899,
        seats: 1,
        billingInterval: "lifetime",
        checkoutMode: "payment",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "team-monthly",
        priceUsd: 99,
        seats: 5,
        billingInterval: "month",
        checkoutMode: "subscription",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "team-yearly",
        priceUsd: 789,
        seats: 5,
        billingInterval: "year",
        checkoutMode: "subscription",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "team-lifetime",
        priceUsd: 1_899,
        seats: 5,
        billingInterval: "lifetime",
        checkoutMode: "payment",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "organization-monthly",
        priceUsd: 199,
        seats: null,
        billingInterval: "month",
        checkoutMode: "subscription",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "organization-yearly",
        priceUsd: 1_589,
        seats: null,
        billingInterval: "year",
        checkoutMode: "subscription",
        includesTemplatesAndDesignKit: true,
      },
      {
        id: "organization-lifetime",
        priceUsd: 3_899,
        seats: null,
        billingInterval: "lifetime",
        checkoutMode: "payment",
        includesTemplatesAndDesignKit: true,
      },
    ]);
  });
});

describe("approved commercial pages", () => {
  it("publishes the approved prices without pretending checkout is open", () => {
    render(<PricingPage />);

    for (const price of [
      "$49 USD",
      "$389 USD",
      "$899 USD",
      "$99 USD",
      "$789 USD",
      "$1,899 USD",
      "$199 USD",
      "$1,589 USD",
      "$3,899 USD",
    ]) {
      expect(screen.getByText(price)).toBeInTheDocument();
    }
    expect(
      screen.getByText(/An active subscription is required/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/checkout is not live yet/i),
    ).toBeInTheDocument();
  });

  it("identifies the contracting company and preserves mandatory rights", () => {
    render(<TermsPage />);

    expect(screen.getAllByText(/KREYD LABS LTD/).length).toBeGreaterThan(0);
    expect(screen.getByText(/company number 17152066/)).toBeInTheDocument();
    expect(
      screen.getByText(/Nothing in these terms excludes a consumer right/),
    ).toBeInTheDocument();
  });

  it("keeps the approved unopened-file refund boundary", () => {
    render(<RefundPage />);

    expect(
      screen.getByText(/within 14 calendar days of purchase/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only if no paid file from that order has been accessed/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mandatory consumer law/),
    ).toBeInTheDocument();
  });

  it("prevents redistribution and competing paid UI kits", () => {
    render(<CommercialLicensePage />);

    expect(
      screen.getByText(/paid source in a public repository/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/competing UI kit/i),
    ).toBeInTheDocument();
  });
});
