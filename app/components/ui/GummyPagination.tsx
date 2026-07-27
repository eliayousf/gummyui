import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyPaginationProps = React.HTMLAttributes<HTMLElement> & {
  label?: string;
};

export const GummyPagination = React.forwardRef<
  HTMLElement,
  GummyPaginationProps
>(function GummyPagination(
  { label = "Pagination", className, children, ...props },
  ref,
) {
  return (
    <nav
      {...props}
      ref={ref}
      className={joinClassNames("gummy-pagination", className)}
      aria-label={label}
    >
      <ol>{children}</ol>
    </nav>
  );
});

GummyPagination.displayName = "GummyPagination";

export const GummyPaginationItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(function GummyPaginationItem({ className, ...props }, ref) {
  return (
    <li
      {...props}
      ref={ref}
      className={joinClassNames("gummy-pagination__item", className)}
    />
  );
});

GummyPaginationItem.displayName = "GummyPaginationItem";

export type GummyPaginationLinkProps =
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    current?: boolean;
    size?: "page" | "wide";
  };

export const GummyPaginationLink = React.forwardRef<
  HTMLAnchorElement,
  GummyPaginationLinkProps
>(function GummyPaginationLink(
  { current = false, size = "page", className, ...props },
  ref,
) {
  return (
    <a
      {...props}
      ref={ref}
      className={joinClassNames("gummy-pagination__link", className)}
      data-size={size}
      aria-current={current ? "page" : undefined}
    />
  );
});

GummyPaginationLink.displayName = "GummyPaginationLink";

export function GummyPaginationPrevious(
  props: Omit<GummyPaginationLinkProps, "children" | "size">,
) {
  return (
    <GummyPaginationLink {...props} size="wide">
      <span aria-hidden="true">←</span>
      <span>Previous</span>
    </GummyPaginationLink>
  );
}

export function GummyPaginationNext(
  props: Omit<GummyPaginationLinkProps, "children" | "size">,
) {
  return (
    <GummyPaginationLink {...props} size="wide">
      <span>Next</span>
      <span aria-hidden="true">→</span>
    </GummyPaginationLink>
  );
}

export function GummyPaginationEllipsis({
  label = "More pages",
}: {
  label?: string;
}) {
  return (
    <span className="gummy-pagination__ellipsis">
      <span aria-hidden="true">•••</span>
      <span className="gummy-visually-hidden">{label}</span>
    </span>
  );
}
