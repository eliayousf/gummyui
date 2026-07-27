import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyBreadcrumbProps = React.HTMLAttributes<HTMLElement> & {
  label?: string;
};

export const GummyBreadcrumb = React.forwardRef<
  HTMLElement,
  GummyBreadcrumbProps
>(function GummyBreadcrumb(
  { label = "Breadcrumb", className, children, ...props },
  ref,
) {
  return (
    <nav
      {...props}
      ref={ref}
      className={joinClassNames("gummy-breadcrumb", className)}
      aria-label={label}
    >
      <ol>{children}</ol>
    </nav>
  );
});

GummyBreadcrumb.displayName = "GummyBreadcrumb";

export const GummyBreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(function GummyBreadcrumbItem({ className, ...props }, ref) {
  return (
    <li
      {...props}
      ref={ref}
      className={joinClassNames("gummy-breadcrumb__item", className)}
    />
  );
});

GummyBreadcrumbItem.displayName = "GummyBreadcrumbItem";

export const GummyBreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(function GummyBreadcrumbLink({ className, ...props }, ref) {
  return (
    <a
      {...props}
      ref={ref}
      className={joinClassNames("gummy-breadcrumb__link", className)}
    />
  );
});

GummyBreadcrumbLink.displayName = "GummyBreadcrumbLink";

export const GummyBreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function GummyBreadcrumbPage({ className, ...props }, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClassNames("gummy-breadcrumb__page", className)}
      aria-current="page"
    />
  );
});

GummyBreadcrumbPage.displayName = "GummyBreadcrumbPage";

export function GummyBreadcrumbSeparator({
  children = "›",
}: {
  children?: React.ReactNode;
}) {
  return (
    <li className="gummy-breadcrumb__separator" aria-hidden="true">
      {children}
    </li>
  );
}

export function GummyBreadcrumbEllipsis({
  label = "More pages",
}: {
  label?: string;
}) {
  return (
    <li className="gummy-breadcrumb__ellipsis">
      <span aria-hidden="true">•••</span>
      <span className="gummy-visually-hidden">{label}</span>
    </li>
  );
}
