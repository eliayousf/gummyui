"use client";

import * as React from "react";

export type GummyButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "info";

export type GummyButtonSize = "small" | "medium" | "large";
export type GummyButtonFinish = "gel" | "translucent";

export type GummyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Fruit-colour treatment. The label remains on an optically stable layer. */
  variant?: GummyButtonVariant;
  /** Preserves a 44px minimum touch target at every visual size. */
  size?: GummyButtonSize;
  /** Controls optical transmission without changing semantic colour. */
  finish?: GummyButtonFinish;
  /** Disables activation, exposes busy state, and shows a non-motion-dependent cue. */
  loading?: boolean;
  /** Visible label while loading. */
  loadingText?: React.ReactNode;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyButton = React.forwardRef<
  HTMLButtonElement,
  GummyButtonProps
>(function GummyButton(
  {
    variant = "primary",
    size = "medium",
    finish = "gel",
    loading = false,
    loadingText = "Loading",
    disabled = false,
    type = "button",
    className,
    children,
    ...buttonProps
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      className={joinClassNames("gummy-button", className)}
      data-variant={variant}
      data-size={size}
      data-finish={finish}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={isDisabled}
    >
      <span className="gummy-button__body">
        <span className="gummy-button__content">
          {loading ? (
            <span className="gummy-button__spinner" aria-hidden="true" />
          ) : null}
          <span>{loading ? loadingText : children}</span>
        </span>
      </span>
    </button>
  );
});

GummyButton.displayName = "GummyButton";
