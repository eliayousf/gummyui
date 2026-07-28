"use client";

import { useState } from "react";

export function DownloadGrantButton({
  releaseId,
}: {
  releaseId: string;
}) {
  const [state, setState] = useState<
    "idle" | "working" | "failed"
  >("idle");

  async function startDownload() {
    if (state === "working") return;
    setState("working");
    try {
      const response = await fetch("/api/download-grants", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ releaseId }),
      });
      const body = await response.json() as { path?: unknown };
      if (
        response.status !== 201
        || typeof body.path !== "string"
        || !body.path.startsWith("/downloads/")
      ) {
        throw new Error("Download grant unavailable");
      }
      window.location.assign(body.path);
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="account-download-action">
      <button
        type="button"
        onClick={startDownload}
        disabled={state === "working"}
      >
        {state === "working" ? "Preparing…" : "Download"}
      </button>
      {state === "failed" ? (
        <small role="status">
          The secure download could not be prepared. Please try again.
        </small>
      ) : null}
    </div>
  );
}
