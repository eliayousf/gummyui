"use client";

import { useState } from "react";

export function AccountPrivacyAction({
  href,
  label,
  kind,
}: {
  href: string;
  label: string;
  kind: "create-export" | "request-deletion";
}) {
  const [state, setState] = useState<
    "idle" | "working" | "failed"
  >("idle");
  const [confirmation, setConfirmation] = useState("");

  async function submit() {
    if (
      state === "working"
      || (kind === "request-deletion" && confirmation !== "DELETE")
    ) return;
    setState("working");
    try {
      const response = await fetch(href, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          kind === "request-deletion"
            ? { confirmation }
            : {},
        ),
      });
      if (![201, 202, 409].includes(response.status)) {
        throw new Error("Privacy operation unavailable");
      }
      window.location.reload();
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="account-privacy-action">
      {kind === "request-deletion" ? (
        <>
          <label htmlFor="deletion-confirmation">
            Type DELETE to confirm
          </label>
          <input
            id="deletion-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </>
      ) : null}
      <button
        type="button"
        onClick={submit}
        disabled={
          state === "working"
          || (kind === "request-deletion" && confirmation !== "DELETE")
        }
      >
        {state === "working" ? "Submitting…" : label}
      </button>
      {state === "failed" ? (
        <small role="status">
          The request could not be completed. Please try again.
        </small>
      ) : null}
    </div>
  );
}

export function CancelDeletionButton({
  deletionId,
}: {
  deletionId: string;
}) {
  const [state, setState] = useState<
    "idle" | "working" | "failed"
  >("idle");

  async function cancel() {
    if (state === "working") return;
    setState("working");
    try {
      const response = await fetch(
        `/api/privacy/deletions/${encodeURIComponent(deletionId)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      );
      if (response.status !== 200) {
        throw new Error("Deletion cancellation unavailable");
      }
      window.location.reload();
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="account-download-action">
      <button
        type="button"
        onClick={cancel}
        disabled={state === "working"}
      >
        {state === "working" ? "Cancelling…" : "Cancel request"}
      </button>
      {state === "failed" ? (
        <small role="status">
          The request could not be cancelled. Please try again.
        </small>
      ) : null}
    </div>
  );
}
