"use client";

import * as React from "react";

const ComponentInspectorRuntime = React.lazy(async () => {
  const loadedModule = await import("./ComponentInspectorRuntime");
  return { default: loadedModule.ComponentInspector };
});

export function ComponentInspector({
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
        aria-labelledby="component-preview-title"
      >
        <header className="component-inspector__heading">
          <div>
            <p className="showcase-kicker">Interactive inspection</p>
            <h2 id="component-preview-title">Try {componentName} in context</h2>
          </div>
          <p>
            Load the real component preview when you are ready to interact with
            its responsive, theme, and direction controls.
          </p>
        </header>
        <button type="button" onClick={() => setRequested(true)}>
          Load interactive preview
        </button>
      </section>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="component-inspector__loading" aria-live="polite">
          Loading interactive preview…
        </div>
      }
    >
      <ComponentInspectorRuntime
        slug={slug}
        componentName={componentName}
      />
    </React.Suspense>
  );
}
