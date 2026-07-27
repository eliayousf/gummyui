import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummySkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  shape?: "line" | "text" | "circle" | "card";
  loadingLabel?: string;
  lines?: number;
};

export const GummySkeleton = React.forwardRef<
  HTMLDivElement,
  GummySkeletonProps
>(function GummySkeleton(
  {
    shape = "line",
    loadingLabel,
    lines = 1,
    className,
    style,
    ...skeletonProps
  },
  ref,
) {
  const safeLines = Math.max(1, Math.min(12, Math.floor(lines)));
  return (
    <div
      {...skeletonProps}
      ref={ref}
      className={joinClassNames("gummy-skeleton", className)}
      data-shape={shape}
      role={loadingLabel ? "status" : undefined}
      aria-label={loadingLabel}
      aria-hidden={loadingLabel ? undefined : true}
      style={{
        ...style,
        "--gummy-skeleton-lines": safeLines,
      } as React.CSSProperties}
    >
      {shape === "text"
        ? Array.from({ length: safeLines }, (_, index) => (
            <span key={index} className="gummy-skeleton__line" />
          ))
        : <span className="gummy-skeleton__body" />}
    </div>
  );
});

GummySkeleton.displayName = "GummySkeleton";

export type GummySkeletonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export const GummySkeletonGroup = React.forwardRef<
  HTMLDivElement,
  GummySkeletonGroupProps
>(function GummySkeletonGroup(
  { label = "Loading content", className, ...groupProps },
  ref,
) {
  return (
    <div
      {...groupProps}
      ref={ref}
      className={joinClassNames("gummy-skeleton-group", className)}
      aria-busy="true"
      aria-label={label}
      role="status"
    />
  );
});

GummySkeletonGroup.displayName = "GummySkeletonGroup";
