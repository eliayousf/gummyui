CREATE TABLE `billing_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_provider` text NOT NULL,
	`provider_adjustment_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`purchase_id` text,
	`invoice_id` text,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`currency` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`provider_occurred_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "billing_adjustments_reference_check" CHECK("billing_adjustments"."purchase_id" is not null or "billing_adjustments"."invoice_id" is not null),
	CONSTRAINT "billing_adjustments_kind_check" CHECK("billing_adjustments"."kind" in ('refund', 'credit', 'chargeback', 'chargeback_reversal', 'adjustment')),
	CONSTRAINT "billing_adjustments_status_check" CHECK("billing_adjustments"."status" in ('pending', 'approved', 'processed', 'failed', 'reversed')),
	CONSTRAINT "billing_adjustments_currency_check" CHECK("billing_adjustments"."currency" glob '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "billing_adjustments_amount_check" CHECK("billing_adjustments"."amount_minor" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_adjustments_provider_adjustment_unique` ON `billing_adjustments` (`billing_provider`,`provider_adjustment_id`);--> statement-breakpoint
CREATE INDEX `billing_adjustments_workspace_occurred_idx` ON `billing_adjustments` (`workspace_id`,`provider_occurred_at`);--> statement-breakpoint
CREATE INDEX `billing_adjustments_purchase_idx` ON `billing_adjustments` (`purchase_id`);--> statement-breakpoint
CREATE INDEX `billing_adjustments_invoice_idx` ON `billing_adjustments` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `billing_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`account_id` text,
	`billing_provider` text NOT NULL,
	`provider_customer_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`provider_occurred_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "billing_customers_status_check" CHECK("billing_customers"."status" in ('active', 'inactive', 'deletion_pending', 'deleted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customers_provider_customer_unique` ON `billing_customers` (`billing_provider`,`provider_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customers_provider_workspace_unique` ON `billing_customers` (`billing_provider`,`workspace_id`);--> statement-breakpoint
CREATE INDEX `billing_customers_workspace_status_idx` ON `billing_customers` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `billing_customers_account_idx` ON `billing_customers` (`account_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_provider` text NOT NULL,
	`provider_invoice_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`purchase_id` text,
	`subscription_id` text,
	`status` text NOT NULL,
	`currency` text NOT NULL,
	`total_minor` integer NOT NULL,
	`issued_at` integer,
	`paid_at` integer,
	`provider_occurred_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "invoices_status_check" CHECK("__new_invoices"."status" in ('draft', 'open', 'paid', 'void', 'uncollectible', 'refunded')),
	CONSTRAINT "invoices_total_check" CHECK("__new_invoices"."total_minor" >= 0),
	CONSTRAINT "invoices_currency_check" CHECK("__new_invoices"."currency" glob '[A-Z][A-Z][A-Z]')
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "billing_provider", "provider_invoice_id", "workspace_id", "purchase_id", "subscription_id", "status", "currency", "total_minor", "issued_at", "paid_at", "provider_occurred_at", "created_at", "updated_at") SELECT "id", "billing_provider", "provider_invoice_id", "workspace_id", "purchase_id", "subscription_id", "status", "currency", "total_minor", "issued_at", "paid_at", "provider_occurred_at", "created_at", "updated_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_provider_invoice_unique` ON `invoices` (`billing_provider`,`provider_invoice_id`);--> statement-breakpoint
CREATE INDEX `invoices_workspace_status_idx` ON `invoices` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `__new_purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_provider` text NOT NULL,
	`provider_purchase_id` text NOT NULL,
	`account_id` text,
	`workspace_id` text NOT NULL,
	`product_ref` text NOT NULL,
	`status` text NOT NULL,
	`currency` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`purchased_at` integer NOT NULL,
	`provider_occurred_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "purchases_status_check" CHECK("__new_purchases"."status" in ('pending', 'completed', 'partially_refunded', 'refunded', 'disputed', 'void')),
	CONSTRAINT "purchases_amount_check" CHECK("__new_purchases"."amount_minor" >= 0),
	CONSTRAINT "purchases_currency_check" CHECK("__new_purchases"."currency" glob '[A-Z][A-Z][A-Z]')
);
--> statement-breakpoint
INSERT INTO `__new_purchases`("id", "billing_provider", "provider_purchase_id", "account_id", "workspace_id", "product_ref", "status", "currency", "amount_minor", "purchased_at", "provider_occurred_at", "created_at", "updated_at") SELECT "id", "billing_provider", "provider_purchase_id", "account_id", "workspace_id", "product_ref", "status", "currency", "amount_minor", "purchased_at", "provider_occurred_at", "created_at", "updated_at" FROM `purchases`;--> statement-breakpoint
DROP TABLE `purchases`;--> statement-breakpoint
ALTER TABLE `__new_purchases` RENAME TO `purchases`;--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_provider_purchase_unique` ON `purchases` (`billing_provider`,`provider_purchase_id`);--> statement-breakpoint
CREATE INDEX `purchases_workspace_status_idx` ON `purchases` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `__new_entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`account_id` text,
	`licence_id` text NOT NULL,
	`product_ref` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`valid_from` integer NOT NULL,
	`valid_until` integer,
	`updates_until` integer,
	`source_event_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`licence_id`) REFERENCES `licences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_event_id`) REFERENCES `provider_events`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "entitlements_status_check" CHECK("__new_entitlements"."status" in ('pending', 'active', 'suspended', 'revoked', 'expired')),
	CONSTRAINT "entitlements_validity_check" CHECK("__new_entitlements"."valid_until" is null or "__new_entitlements"."valid_until" >= "__new_entitlements"."valid_from"),
	CONSTRAINT "entitlements_updates_check" CHECK("__new_entitlements"."updates_until" is null or "__new_entitlements"."updates_until" >= "__new_entitlements"."valid_from")
);
--> statement-breakpoint
INSERT INTO `__new_entitlements`("id", "workspace_id", "account_id", "licence_id", "product_ref", "status", "valid_from", "valid_until", "updates_until", "source_event_id", "created_at", "updated_at") SELECT "id", "workspace_id", "account_id", "licence_id", "product_ref", "status", "valid_from", "valid_until", "updates_until", "source_event_id", "created_at", "updated_at" FROM `entitlements`;--> statement-breakpoint
DROP TABLE `entitlements`;--> statement-breakpoint
ALTER TABLE `__new_entitlements` RENAME TO `entitlements`;--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_account_scope_unique` ON `entitlements` (`workspace_id`,`account_id`,`licence_id`,`product_ref`) WHERE "entitlements"."account_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_workspace_scope_unique` ON `entitlements` (`workspace_id`,`licence_id`,`product_ref`) WHERE "entitlements"."account_id" is null;--> statement-breakpoint
CREATE INDEX `entitlements_scope_idx` ON `entitlements` (`workspace_id`,`account_id`,`licence_id`,`product_ref`);--> statement-breakpoint
CREATE INDEX `entitlements_workspace_product_status_idx` ON `entitlements` (`workspace_id`,`product_ref`,`status`);--> statement-breakpoint
CREATE INDEX `entitlements_account_status_idx` ON `entitlements` (`account_id`,`status`);--> statement-breakpoint
CREATE TABLE `__new_licences` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`purchase_id` text,
	`subscription_id` text,
	`product_ref` text NOT NULL,
	`status` text NOT NULL,
	`starts_at` integer NOT NULL,
	`expires_at` integer,
	`updates_until` integer,
	`seat_limit` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "licences_status_check" CHECK("__new_licences"."status" in ('pending', 'active', 'suspended', 'revoked', 'expired')),
	CONSTRAINT "licences_seat_limit_check" CHECK("__new_licences"."seat_limit" is null or "__new_licences"."seat_limit" > 0),
	CONSTRAINT "licences_expiry_check" CHECK("__new_licences"."expires_at" is null or "__new_licences"."expires_at" >= "__new_licences"."starts_at"),
	CONSTRAINT "licences_updates_check" CHECK("__new_licences"."updates_until" is null or "__new_licences"."updates_until" >= "__new_licences"."starts_at")
);
--> statement-breakpoint
INSERT INTO `__new_licences`("id", "workspace_id", "purchase_id", "subscription_id", "product_ref", "status", "starts_at", "expires_at", "updates_until", "seat_limit", "created_at", "updated_at") SELECT "id", "workspace_id", "purchase_id", "subscription_id", "product_ref", "status", "starts_at", "expires_at", "updates_until", "seat_limit", "created_at", "updated_at" FROM `licences`;--> statement-breakpoint
DROP TABLE `licences`;--> statement-breakpoint
ALTER TABLE `__new_licences` RENAME TO `licences`;--> statement-breakpoint
CREATE INDEX `licences_workspace_product_status_idx` ON `licences` (`workspace_id`,`product_ref`,`status`);--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_provider` text NOT NULL,
	`provider_subscription_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`account_id` text,
	`plan_ref` text NOT NULL,
	`status` text NOT NULL,
	`current_period_starts_at` integer,
	`current_period_ends_at` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`canceled_at` integer,
	`provider_occurred_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "subscriptions_status_check" CHECK("__new_subscriptions"."status" in ('pending', 'active', 'past_due', 'paused', 'canceled', 'expired')),
	CONSTRAINT "subscriptions_cancel_check" CHECK("__new_subscriptions"."cancel_at_period_end" in (0, 1)),
	CONSTRAINT "subscriptions_period_check" CHECK("__new_subscriptions"."current_period_starts_at" is null or "__new_subscriptions"."current_period_ends_at" is null or "__new_subscriptions"."current_period_ends_at" >= "__new_subscriptions"."current_period_starts_at")
);
--> statement-breakpoint
INSERT INTO `__new_subscriptions`("id", "billing_provider", "provider_subscription_id", "workspace_id", "account_id", "plan_ref", "status", "current_period_starts_at", "current_period_ends_at", "cancel_at_period_end", "canceled_at", "provider_occurred_at", "created_at", "updated_at") SELECT "id", "billing_provider", "provider_subscription_id", "workspace_id", "account_id", "plan_ref", "status", "current_period_starts_at", "current_period_ends_at", "cancel_at_period_end", "canceled_at", "provider_occurred_at", "created_at", "updated_at" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_provider_subscription_unique` ON `subscriptions` (`billing_provider`,`provider_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_workspace_status_idx` ON `subscriptions` (`workspace_id`,`status`);