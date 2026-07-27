"use client";

import Link from "next/link";
import * as React from "react";
import type {
  CatalogueGroupId,
  ComponentDefinition,
} from "../data/catalogue";

type GroupDefinition = {
  id: CatalogueGroupId;
  label: string;
  description: string;
};

export function CatalogueSearch({
  components,
  groups,
}: {
  components: readonly ComponentDefinition[];
  groups: readonly GroupDefinition[];
}) {
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<CatalogueGroupId | "all">("all");
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = components.filter((component) => {
    const inGroup = group === "all" || component.group === group;
    const searchable = `${component.name} ${component.description} ${component.semantics} ${component.dependencies.join(" ")}`.toLocaleLowerCase();
    return inGroup && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  return (
    <section className="catalogue-browser" aria-labelledby="catalogue-browser-title">
      <div className="catalogue-browser__toolbar">
        <div>
          <h2 id="catalogue-browser-title">Browse components</h2>
          <p aria-live="polite">{matches.length} {matches.length === 1 ? "result" : "results"}</p>
        </div>
        <label className="catalogue-search">
          <span>Search components</span>
          <span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Try “menu”, “form”, or “RTL”…"
            />
            <kbd aria-hidden="true">/</kbd>
          </span>
        </label>
      </div>
      <div className="catalogue-filters" role="group" aria-label="Filter by component family">
        <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>
          All
        </button>
        {groups.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            aria-pressed={group === candidate.id}
            onClick={() => setGroup(candidate.id)}
          >
            {candidate.label}
          </button>
        ))}
      </div>
      {matches.length ? (
        <div className="catalogue-grid">
          {matches.map((component) => (
            <Link href={`/components/${component.slug}`} className="catalogue-card" key={component.slug}>
              <span className="catalogue-card__mark" aria-hidden="true">{component.name.slice(0, 1)}</span>
              <div>
                <span>{groups.find(({ id }) => id === component.group)?.label}</span>
                <h3>{component.name}</h3>
                <p>{component.description}</p>
              </div>
              <span className="catalogue-card__arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="catalogue-empty">
          <h3>No matching component</h3>
          <p>Clear the search or choose another family.</p>
          <button type="button" onClick={() => { setQuery(""); setGroup("all"); }}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
