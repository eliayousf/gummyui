import * as React from "react";

export type GummyBadgeVariant =
  | "neutral"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "info";

export type GummyBadgeFinish = "solid" | "translucent";
export type GummyBadgeMotion = "alive" | "settle" | "none";

export type GummyBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: GummyBadgeVariant;
  finish?: GummyBadgeFinish;
  /** Restrained ambient gel motion, a one-shot settle, or a static badge. */
  motion?: GummyBadgeMotion;
  /** Decorative dot. Visible text must still communicate the badge meaning. */
  dot?: boolean;
  /** Decorative icon. It is hidden from assistive technology by design. */
  icon?: React.ReactNode;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyBadge = React.forwardRef<HTMLSpanElement, GummyBadgeProps>(
  function GummyBadge(
    {
      variant = "neutral",
      finish = "solid",
      motion = "alive",
      dot = false,
      icon,
      className,
      children,
      ...badgeProps
    },
    ref,
  ) {
    return (
      <span
        {...badgeProps}
        ref={ref}
        className={joinClassNames("gummy-badge", className)}
        data-variant={variant}
        data-finish={finish}
        data-motion={motion}
      >
        {dot ? <span className="gummy-badge__dot" aria-hidden="true" /> : null}
        {icon ? (
          <span className="gummy-badge__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="gummy-badge__label">{children}</span>
      </span>
    );
  },
);

GummyBadge.displayName = "GummyBadge";
