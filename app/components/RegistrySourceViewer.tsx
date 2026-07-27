"use client";

import * as React from "react";

type RegistryFile = {
  path: string;
  type: string;
  content: string;
};

type RegistryPayload = {
  title: string;
  files: RegistryFile[];
};

export function CopyTextButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {copied ? copiedLabel : label}
    </button>
  );
}

export function RegistrySourceViewer({
  registryName,
}: {
  registryName: string;
}) {
  const [payload, setPayload] = React.useState<RegistryPayload | null>(null);
  const [error, setError] = React.useState("");
  const [activePath, setActivePath] = React.useState("");
  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/r/${registryName}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Registry returned ${response.status}.`);
        return response.json() as Promise<RegistryPayload>;
      })
      .then((nextPayload) => {
        setPayload(nextPayload);
        setActivePath(nextPayload.files[0]?.path ?? "");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("Source could not be loaded from the local registry payload.");
      });
    return () => controller.abort();
  }, [registryName]);
  if (error) return <p className="source-viewer__error" role="alert">{error}</p>;
  if (!payload) return <div className="source-viewer__loading" aria-live="polite">Loading editable source…</div>;
  const activeFile = payload.files.find(({ path }) => path === activePath) ?? payload.files[0];
  return (
    <div className="source-viewer">
      <div className="source-viewer__toolbar">
        <div role="tablist" aria-label={`${payload.title} source files`}>
          {payload.files.map((file) => (
            <button
              key={file.path}
              type="button"
              role="tab"
              aria-selected={file.path === activeFile.path}
              onClick={() => setActivePath(file.path)}
            >
              {file.path.split("/").at(-1)}
            </button>
          ))}
        </div>
        <CopyTextButton value={activeFile.content} label="Copy source" />
      </div>
      <div role="tabpanel" aria-label={activeFile.path} tabIndex={0}>
        <pre><code>{activeFile.content}</code></pre>
      </div>
    </div>
  );
}
