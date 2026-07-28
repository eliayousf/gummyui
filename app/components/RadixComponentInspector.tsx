"use client";

import * as React from "react";

const RadixComponentInspectorRuntime = React.lazy(async () => {
  const loadedModule = await import("./RadixComponentInspectorRuntime");
  return { default: loadedModule.RadixComponentInspector };
});

export function RadixComponentInspector({
  slug,
  componentName,
}: {
  slug: string;
  componentName: string;
}) {
  const [requested, setRequested] = React.useState(false);

  if (!requested) {
    return (
      <section
        className="component-inspector component-inspector--deferred"
        aria-labelledby="radix-preview-title"
      >
        <div className="component-detail__section-heading">
          <p className="showcase-kicker">Radix UI counterpart</p>
          <h2 id="radix-preview-title">Try {componentName} with Radix UI</h2>
        </div>
        <p>
          Load the separately installable Radix counterpart when you are ready
          to interact with its real behavior.
        </p>
        <button type="button" onClick={() => setRequested(true)}>
          Load Radix preview
        </button>
      </section>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="component-inspector__loading" aria-live="polite">
          Loading Radix preview…
        </div>
      }
    >
      <RadixComponentInspectorRuntime
        slug={slug}
        componentName={componentName}
      />
    </React.Suspense>
  );
}
