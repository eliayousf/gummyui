CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_provider` text NOT NULL,
	`identity_subject` text NOT NULL,
	`email_hash` text,
	`status` text DEFAULT 'active' NOT NULL,
	`deactivated_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "accounts_status_check" CHECK("accounts"."status" in ('active', 'disabled', 'deletion_pending', 'deleted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_identity_subject_unique` ON `accounts` (`identity_provider`,`identity_subject`);--> statement-breakpoint
CREATE INDEX `accounts_status_idx` ON `accounts` (`status`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_account_id` text,
	`workspace_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`outcome` text NOT NULL,
	`metadata` text,
	`occurred_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "audit_events_outcome_check" CHECK("audit_events"."outcome" in ('allowed', 'denied', 'succeeded', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `audit_events_workspace_occurred_idx` ON `audit_events` (`workspace_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_events_target_idx` ON `audit_events` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`workspace_id` text,
	`purpose` text NOT NULL,
	`state` text NOT NULL,
	`notice_version` text NOT NULL,
	`source` text NOT NULL,
	`evidence_hash` text,
	`occurred_at` integer NOT NULL,
	`withdrawn_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "consent_records_state_check" CHECK("consent_records"."state" in ('granted', 'denied', 'withdrawn', 'not_required'))
);
--> statement-breakpoint
CREATE INDEX `consent_records_account_purpose_idx` ON `consent_records` (`account_id`,`purpose`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `data_deletions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`workspace_id` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`requested_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`verified_at` integer,
	`retention_until` integer,
	`completed_at` integer,
	`blocker_code` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "data_deletions_status_check" CHECK("data_deletions"."status" in ('requested', 'verified', 'queued', 'processing', 'blocked', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE INDEX `data_deletions_account_status_idx` ON `data_deletions` (`account_id`,`status`);--> statement-breakpoint
CREATE TABLE `data_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`workspace_id` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`storage_key` text,
	`checksum_sha256` text,
	`requested_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer,
	`expires_at` integer,
	`failure_code` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "data_exports_status_check" CHECK("data_exports"."status" in ('requested', 'queued', 'processing', 'ready', 'downloaded', 'expired', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE INDEX `data_exports_account_status_idx` ON `data_exports` (`account_id`,`status`);--> statement-breakpoint
CREATE TABLE `dead_letters` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`reason_code` text NOT NULL,
	`payload_hash` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "dead_letters_status_check" CHECK("dead_letters"."status" in ('open', 'retrying', 'resolved', 'discarded')),
	CONSTRAINT "dead_letters_attempts_check" CHECK("dead_letters"."attempts" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dead_letters_source_unique` ON `dead_letters` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `dead_letters_status_seen_idx` ON `dead_letters` (`status`,`last_seen_at`);--> statement-breakpoint
CREATE TABLE `download_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`nonce_hash` text NOT NULL,
	`account_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`release_id` text NOT NULL,
	`entitlement_id` text NOT NULL,
	`request_fingerprint_hash` text,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`release_id`) REFERENCES `release_records`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`entitlement_id`) REFERENCES `entitlements`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "download_grants_expiry_check" CHECK("download_grants"."expires_at" > "download_grants"."created_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `download_grants_nonce_hash_unique` ON `download_grants` (`nonce_hash`);--> statement-breakpoint
CREATE INDEX `download_grants_account_created_idx` ON `download_grants` (`account_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `download_grants_expiry_idx` ON `download_grants` (`expires_at`);--> statement-breakpoint
CREATE TABLE `entitlements` (
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
	CONSTRAINT "entitlements_status_check" CHECK("entitlements"."status" in ('pending', 'active', 'suspended', 'revoked', 'expired')),
	CONSTRAINT "entitlements_validity_check" CHECK("entitlements"."valid_until" is null or "entitlements"."valid_until" >= "entitlements"."valid_from")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_scope_unique` ON `entitlements` (`workspace_id`,`account_id`,`licence_id`,`product_ref`);--> statement-breakpoint
CREATE INDEX `entitlements_workspace_product_status_idx` ON `entitlements` (`workspace_id`,`product_ref`,`status`);--> statement-breakpoint
CREATE INDEX `entitlements_account_status_idx` ON `entitlements` (`account_id`,`status`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`invited_email_hash` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invited_by_account_id` text,
	`accepted_by_account_id` text,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`accepted_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "invitations_role_check" CHECK("invitations"."role" in ('owner', 'admin', 'billing', 'member', 'viewer')),
	CONSTRAINT "invitations_status_check" CHECK("invitations"."status" in ('pending', 'accepted', 'revoked', 'expired'))
);
--> statement-breakpoint
CREATE INDEX `invitations_workspace_status_idx` ON `invitations` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `invitations_email_status_idx` ON `invitations` (`invited_email_hash`,`status`);--> statement-breakpoint
CREATE TABLE `invoices` (
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
	CONSTRAINT "invoices_status_check" CHECK("invoices"."status" in ('draft', 'open', 'paid', 'void', 'uncollectible', 'refunded')),
	CONSTRAINT "invoices_total_check" CHECK("invoices"."total_minor" >= 0),
	CONSTRAINT "invoices_currency_check" CHECK(length("invoices"."currency") = 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_provider_invoice_unique` ON `invoices` (`billing_provider`,`provider_invoice_id`);--> statement-breakpoint
CREATE INDEX `invoices_workspace_status_idx` ON `invoices` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `licence_seats` (
	`id` text PRIMARY KEY NOT NULL,
	`licence_id` text NOT NULL,
	`account_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`licence_id`) REFERENCES `licences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "licence_seats_status_check" CHECK("licence_seats"."status" in ('active', 'revoked'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `licence_seats_licence_account_unique` ON `licence_seats` (`licence_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `licence_seats_account_status_idx` ON `licence_seats` (`account_id`,`status`);--> statement-breakpoint
CREATE TABLE `licences` (
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
	CONSTRAINT "licences_status_check" CHECK("licences"."status" in ('pending', 'active', 'suspended', 'revoked', 'expired')),
	CONSTRAINT "licences_seat_limit_check" CHECK("licences"."seat_limit" is null or "licences"."seat_limit" > 0),
	CONSTRAINT "licences_expiry_check" CHECK("licences"."expires_at" is null or "licences"."expires_at" >= "licences"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `licences_workspace_product_status_idx` ON `licences` (`workspace_id`,`product_ref`,`status`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_membership_id` text,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_since` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "memberships_role_check" CHECK("memberships"."role" in ('owner', 'admin', 'billing', 'member', 'viewer')),
	CONSTRAINT "memberships_status_check" CHECK("memberships"."status" in ('invited', 'active', 'suspended', 'revoked'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_workspace_account_unique` ON `memberships` (`workspace_id`,`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_provider_membership_unique` ON `memberships` (`provider_membership_id`);--> statement-breakpoint
CREATE INDEX `memberships_account_status_idx` ON `memberships` (`account_id`,`status`);--> statement-breakpoint
CREATE INDEX `memberships_workspace_status_idx` ON `memberships` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `outbox_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`deduplication_key` text NOT NULL,
	`topic` text NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`payload` text NOT NULL,
	`payload_hash` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer,
	`delivered_at` integer,
	`last_error_code` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "outbox_messages_status_check" CHECK("outbox_messages"."status" in ('pending', 'processing', 'delivered', 'failed', 'dead_letter')),
	CONSTRAINT "outbox_messages_attempts_check" CHECK("outbox_messages"."attempts" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbox_messages_deduplication_unique` ON `outbox_messages` (`deduplication_key`);--> statement-breakpoint
CREATE INDEX `outbox_messages_status_attempt_idx` ON `outbox_messages` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`account_id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`locale` text,
	`time_zone` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `provider_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_kind` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`event_type` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`received_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`payload_hash` text NOT NULL,
	`payload_envelope` text,
	`signature_verified` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`processed_at` integer,
	`error_code` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "provider_events_kind_check" CHECK("provider_events"."provider_kind" in ('identity', 'billing', 'email', 'storage', 'queue')),
	CONSTRAINT "provider_events_status_check" CHECK("provider_events"."status" in ('received', 'processing', 'applied', 'ignored', 'failed', 'dead_letter')),
	CONSTRAINT "provider_events_verified_check" CHECK("provider_events"."signature_verified" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_events_provider_event_unique` ON `provider_events` (`provider_kind`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `provider_events_aggregate_idx` ON `provider_events` (`provider_kind`,`aggregate_type`,`aggregate_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `provider_events_status_received_idx` ON `provider_events` (`status`,`received_at`);--> statement-breakpoint
CREATE TABLE `purchases` (
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
	CONSTRAINT "purchases_status_check" CHECK("purchases"."status" in ('pending', 'completed', 'partially_refunded', 'refunded', 'disputed', 'void')),
	CONSTRAINT "purchases_amount_check" CHECK("purchases"."amount_minor" >= 0),
	CONSTRAINT "purchases_currency_check" CHECK(length("purchases"."currency") = 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_provider_purchase_unique` ON `purchases` (`billing_provider`,`provider_purchase_id`);--> statement-breakpoint
CREATE INDEX `purchases_workspace_status_idx` ON `purchases` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `reconciliation_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_kind` text NOT NULL,
	`scope` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`cursor` text,
	`checked_count` integer DEFAULT 0 NOT NULL,
	`discrepancy_count` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`failure_code` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "reconciliation_runs_status_check" CHECK("reconciliation_runs"."status" in ('pending', 'running', 'completed', 'failed')),
	CONSTRAINT "reconciliation_runs_counts_check" CHECK("reconciliation_runs"."checked_count" >= 0 and "reconciliation_runs"."discrepancy_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `reconciliation_runs_provider_status_idx` ON `reconciliation_runs` (`provider_kind`,`status`);--> statement-breakpoint
CREATE TABLE `release_records` (
	`id` text PRIMARY KEY NOT NULL,
	`product_ref` text NOT NULL,
	`version` text NOT NULL,
	`storage_key` text NOT NULL,
	`checksum_sha256` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`released_at` integer,
	`withdrawn_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "release_records_status_check" CHECK("release_records"."status" in ('draft', 'published', 'withdrawn', 'retired')),
	CONSTRAINT "release_records_size_check" CHECK("release_records"."size_bytes" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `release_records_product_version_unique` ON `release_records` (`product_ref`,`version`);--> statement-breakpoint
CREATE UNIQUE INDEX `release_records_storage_key_unique` ON `release_records` (`storage_key`);--> statement-breakpoint
CREATE INDEX `release_records_product_status_idx` ON `release_records` (`product_ref`,`status`);--> statement-breakpoint
CREATE TABLE `retention_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`record_type` text NOT NULL,
	`record_id` text NOT NULL,
	`policy_ref` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`retain_until` integer NOT NULL,
	`legal_hold` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`failure_code` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "retention_actions_status_check" CHECK("retention_actions"."status" in ('scheduled', 'held', 'eligible', 'purging', 'purged', 'failed')),
	CONSTRAINT "retention_actions_legal_hold_check" CHECK("retention_actions"."legal_hold" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `retention_actions_record_policy_unique` ON `retention_actions` (`record_type`,`record_id`,`policy_ref`);--> statement-breakpoint
CREATE INDEX `retention_actions_status_due_idx` ON `retention_actions` (`status`,`retain_until`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
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
	CONSTRAINT "subscriptions_status_check" CHECK("subscriptions"."status" in ('pending', 'active', 'past_due', 'paused', 'canceled', 'expired')),
	CONSTRAINT "subscriptions_cancel_check" CHECK("subscriptions"."cancel_at_period_end" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_provider_subscription_unique` ON `subscriptions` (`billing_provider`,`provider_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_workspace_status_idx` ON `subscriptions` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_provider` text,
	`provider_organization_id` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "workspaces_status_check" CHECK("workspaces"."status" in ('active', 'suspended', 'deletion_pending', 'deleted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_provider_organization_unique` ON `workspaces` (`identity_provider`,`provider_organization_id`);--> statement-breakpoint
CREATE INDEX `workspaces_status_idx` ON `workspaces` (`status`);