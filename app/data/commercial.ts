export const commercialFacts = {
  tradingName: "GUMMY UI",
  legalName: "KREYD LABS LTD",
  companyNumber: "17152066",
  registeredAddress:
    "133 Whitmore Road, Harrow, United Kingdom, HA1 4AG",
  supportEmail: "support@kreydlabs.com",
  supportHref: "mailto:support@kreydlabs.com",
  vatStatus: "Not VAT registered",
  governingLaw: "England and Wales",
  effectiveDate: "27 July 2026",
} as const;

export type CommercialAudience = "Individual" | "Team" | "Organization";
export type CommercialBillingInterval = "month" | "year" | "lifetime";
export type CommercialCheckoutMode = "subscription" | "payment";

export type CommercialPlanId =
  | "individual-monthly"
  | "individual-yearly"
  | "individual-lifetime"
  | "team-monthly"
  | "team-yearly"
  | "team-lifetime"
  | "organization-monthly"
  | "organization-yearly"
  | "organization-lifetime";

export type CommercialPlan = {
  id: CommercialPlanId;
  audience: CommercialAudience;
  billingInterval: CommercialBillingInterval;
  checkoutMode: CommercialCheckoutMode;
  priceUsd: number;
  seats: 1 | 5 | null;
  includesTemplatesAndDesignKit: true;
  features: readonly string[];
};

const allAccess = [
  "All released Pro UI blocks",
  "All six released website and product templates",
  "The released Gummy UI design kit",
  "Unlimited permitted projects",
] as const;

const subscriptionAccess = [
  "Updates, new downloads and support while subscribed",
  "Keep using versions already delivered in existing projects after cancellation",
] as const;

const lifetimeAccess = [
  "Future releases and support for the commercial lifetime of Gummy UI Pro",
  "No recurring charge",
] as const;

export const commercialPlans: readonly CommercialPlan[] = [
  {
    id: "individual-monthly",
    audience: "Individual",
    billingInterval: "month",
    checkoutMode: "subscription",
    priceUsd: 49,
    seats: 1,
    includesTemplatesAndDesignKit: true,
    features: ["One named user", ...allAccess, ...subscriptionAccess],
  },
  {
    id: "individual-yearly",
    audience: "Individual",
    billingInterval: "year",
    checkoutMode: "subscription",
    priceUsd: 389,
    seats: 1,
    includesTemplatesAndDesignKit: true,
    features: ["One named user", ...allAccess, ...subscriptionAccess],
  },
  {
    id: "individual-lifetime",
    audience: "Individual",
    billingInterval: "lifetime",
    checkoutMode: "payment",
    priceUsd: 899,
    seats: 1,
    includesTemplatesAndDesignKit: true,
    features: ["One named user", ...allAccess, ...lifetimeAccess],
  },
  {
    id: "team-monthly",
    audience: "Team",
    billingInterval: "month",
    checkoutMode: "subscription",
    priceUsd: 99,
    seats: 5,
    includesTemplatesAndDesignKit: true,
    features: [
      "Up to five named users",
      "Team invitations and seat management",
      ...allAccess,
      ...subscriptionAccess,
    ],
  },
  {
    id: "team-yearly",
    audience: "Team",
    billingInterval: "year",
    checkoutMode: "subscription",
    priceUsd: 789,
    seats: 5,
    includesTemplatesAndDesignKit: true,
    features: [
      "Up to five named users",
      "Team invitations and seat management",
      ...allAccess,
      ...subscriptionAccess,
    ],
  },
  {
    id: "team-lifetime",
    audience: "Team",
    billingInterval: "lifetime",
    checkoutMode: "payment",
    priceUsd: 1_899,
    seats: 5,
    includesTemplatesAndDesignKit: true,
    features: [
      "Up to five named users",
      "Team invitations and seat management",
      ...allAccess,
      ...lifetimeAccess,
    ],
  },
  {
    id: "organization-monthly",
    audience: "Organization",
    billingInterval: "month",
    checkoutMode: "subscription",
    priceUsd: 199,
    seats: null,
    includesTemplatesAndDesignKit: true,
    features: [
      "Unlimited named users in one purchasing organisation",
      "Organisation-wide invitations and seat management",
      ...allAccess,
      ...subscriptionAccess,
    ],
  },
  {
    id: "organization-yearly",
    audience: "Organization",
    billingInterval: "year",
    checkoutMode: "subscription",
    priceUsd: 1_589,
    seats: null,
    includesTemplatesAndDesignKit: true,
    features: [
      "Unlimited named users in one purchasing organisation",
      "Organisation-wide invitations and seat management",
      ...allAccess,
      ...subscriptionAccess,
    ],
  },
  {
    id: "organization-lifetime",
    audience: "Organization",
    billingInterval: "lifetime",
    checkoutMode: "payment",
    priceUsd: 3_899,
    seats: null,
    includesTemplatesAndDesignKit: true,
    features: [
      "Unlimited named users in one purchasing organisation",
      "Organisation-wide invitations and seat management",
      ...allAccess,
      ...lifetimeAccess,
    ],
  },
] as const;

export const commercialPolicy = {
  currency: "USD",
  billingIntervals: ["month", "year", "lifetime"],
  subscriptionUpdates: "active-subscription",
  lifetimeUpdates: "product-lifetime",
  refundDays: 14,
  supportFirstResponse: "two UK business days",
  paymentProvider: "Stripe Managed Payments",
  worldwide: true,
  checkoutStatus: "pre-launch",
} as const;
