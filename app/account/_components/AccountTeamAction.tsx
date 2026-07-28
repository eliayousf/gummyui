"use client";

import { useState, type FormEvent } from "react";

export function AccountTeamAction({
  href,
  label,
  kind,
}: {
  href: string;
  label: string;
  kind: "create-workspace" | "invite-member";
}) {
  const [state, setState] = useState<
    "idle" | "working" | "failed" | "sent"
  >("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "working") return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = String(
      form.get(kind === "create-workspace" ? "workspaceName" : "email")
        ?? "",
    ).trim();
    if (!value) {
      setState("failed");
      return;
    }
    setState("working");
    try {
      const response = await fetch(href, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          kind === "create-workspace"
            ? {
                name: value,
                requestId: `browser:${crypto.randomUUID()}`,
              }
            : { email: value, role: "member" },
        ),
      });
      if (response.status !== 201) {
        throw new Error("Team operation unavailable");
      }
      const result = await response.json() as {
        organizationId?: unknown;
      };
      if (kind === "create-workspace") {
        if (
          typeof result.organizationId !== "string"
          || !/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u
            .test(result.organizationId)
        ) {
          throw new Error("Workspace switch unavailable");
        }
        const switchResponse = await fetch("/api/team/switch", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            organizationId: result.organizationId,
          }),
        });
        if (switchResponse.status !== 204) {
          throw new Error("Workspace switch unavailable");
        }
        window.location.assign("/account/team");
        return;
      }
      formElement.reset();
      setState("sent");
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      setState("failed");
    }
  }

  return (
    <form className="account-team-action" onSubmit={submit}>
      <label
        htmlFor={
          kind === "create-workspace"
            ? "account-workspace-name"
            : "account-invitation-email"
        }
      >
        {kind === "create-workspace" ? "Workspace name" : "Member email"}
      </label>
      <input
        id={
          kind === "create-workspace"
            ? "account-workspace-name"
            : "account-invitation-email"
        }
        name={kind === "create-workspace" ? "workspaceName" : "email"}
        type={kind === "create-workspace" ? "text" : "email"}
        autoComplete={kind === "create-workspace" ? "organization" : "email"}
        minLength={kind === "create-workspace" ? 2 : undefined}
        maxLength={kind === "create-workspace" ? 100 : 254}
        required
      />
      <button type="submit" disabled={state === "working"}>
        {state === "working" ? "Submitting…" : label}
      </button>
      {state === "sent" ? (
        <small role="status">
          Invitation sent. WorkOS will email the recipient securely.
        </small>
      ) : null}
      {state === "failed" ? (
        <small role="alert">
          The request could not be completed. Check the details and try again.
        </small>
      ) : null}
    </form>
  );
}
