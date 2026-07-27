import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyEmpty = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(function GummyEmpty({ className, ...props }, ref) {
  return (
    <section
      {...props}
      ref={ref}
      className={joinClassNames("gummy-empty", className)}
    />
  );
});

GummyEmpty.displayName = "GummyEmpty";

export const GummyEmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyEmptyMedia({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={joinClassNames("gummy-empty__media", className)}
      aria-hidden="true"
    />
  );
});

GummyEmptyMedia.displayName = "GummyEmptyMedia";

export const GummyEmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function GummyEmptyTitle({ className, ...props }, ref) {
  return (
    <h3
      {...props}
      ref={ref}
      className={joinClassNames("gummy-empty__title", className)}
    />
  );
});

GummyEmptyTitle.displayName = "GummyEmptyTitle";

export const GummyEmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function GummyEmptyDescription({ className, ...props }, ref) {
  return (
    <p
      {...props}
      ref={ref}
      className={joinClassNames("gummy-empty__description", className)}
    />
  );
});

GummyEmptyDescription.displayName = "GummyEmptyDescription";

export const GummyEmptyActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyEmptyActions({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={joinClassNames("gummy-empty__actions", className)}
    />
  );
});

GummyEmptyActions.displayName = "GummyEmptyActions";
