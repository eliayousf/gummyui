export type ServiceProviderRecord = {
  name: string;
  service: string;
  dataContext: string;
  role: string;
};

export const serviceProviders: readonly ServiceProviderRecord[] = [
  {
    name: "Vercel",
    service: "Production hosting, edge delivery, deployment and request handling.",
    dataContext:
      "Website requests, IP address, browser and device metadata, request timing, route and operational logs.",
    role: "Service provider and processor for hosting operations.",
  },
  {
    name: "WorkOS",
    service: "Authentication, account recovery, sessions, organisations and invitations.",
    dataContext:
      "Name, email address, identity-provider identifier, session and security state, workspace and role.",
    role: "Service provider and processor for identity operations.",
  },
  {
    name: "Convex",
    service: "Application data, backend functions and transactional product state.",
    dataContext:
      "Account and workspace references, entitlement state, licence records, download history and operational events.",
    role: "Service provider and processor for application operations.",
  },
  {
    name: "Resend",
    service: "Transactional product, account, security and support email delivery.",
    dataContext:
      "Recipient email address, message type, delivery state and provider message reference.",
    role: "Service provider and processor for email operations.",
  },
  {
    name: "Better Stack",
    service: "Availability monitoring, incident alerting and operational log review.",
    dataContext:
      "Health checks, route and response status, timestamps, errors and privacy-minimised diagnostic events.",
    role: "Service provider and processor for reliability operations.",
  },
  {
    name: "Backblaze B2",
    service: "Encrypted off-provider backups and restore verification.",
    dataContext:
      "Encrypted backup objects containing the application records covered by the backup schedule.",
    role: "Service provider and processor for backup operations.",
  },
  {
    name: "Stripe Managed Payments",
    service: "Checkout, payment, tax support, invoices, refunds and transaction support.",
    dataContext:
      "Customer and order references, product, amount, currency, tax, payment and refund state. Gummy UI does not store full card details.",
    role: "Managed Payments provider; Stripe and Link are separately responsible for payment and transaction-support data as described in the privacy notice.",
  },
] as const;
