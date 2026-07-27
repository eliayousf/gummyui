import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyAlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "neutral" | "info" | "success" | "warning" | "danger";
  live?: "off" | "polite" | "assertive";
  icon?: React.ReactNode;
};

const fallbackIcons = {
  neutral: "•",
  info: "i",
  success: "✓",
  warning: "!",
  danger: "×",
} as const;

export const GummyAlert = React.forwardRef<HTMLDivElement, GummyAlertProps>(
  function GummyAlert(
    {
      variant = "neutral",
      live = "off",
      icon,
      className,
      children,
      ...alertProps
    },
    ref,
  ) {
    const role = live === "assertive" ? "alert" : live === "polite" ? "status" : undefined;
    return (
      <div
        {...alertProps}
        ref={ref}
        className={joinClassNames("gummy-alert", className)}
        data-variant={variant}
        role={role}
      >
        <span className="gummy-alert__reservoir" aria-hidden="true">
          {icon ?? fallbackIcons[variant]}
        </span>
        <div className="gummy-alert__content">{children}</div>
      </div>
    );
  },
);

GummyAlert.displayName = "GummyAlert";

export const GummyAlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function GummyAlertTitle({ className, ...props }, ref) {
  return (
    <h3
      {...props}
      ref={ref}
      className={joinClassNames("gummy-alert__title", className)}
    />
  );
});

GummyAlertTitle.displayName = "GummyAlertTitle";

export const GummyAlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function GummyAlertDescription({ className, ...props }, ref) {
  return (
    <p
      {...props}
      ref={ref}
      className={joinClassNames("gummy-alert__description", className)}
    />
  );
});

GummyAlertDescription.displayName = "GummyAlertDescription";
