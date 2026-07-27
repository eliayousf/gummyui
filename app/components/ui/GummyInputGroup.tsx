import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyInputGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function GummyInputGroup({ className, ...props }, ref) {
    return <div {...props} ref={ref} className={joinClassNames("gummy-input-group", className)} />;
  },
);
export const GummyInputGroupAddon = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { position?: "start" | "end" }>(
  function GummyInputGroupAddon({ position = "start", className, ...props }, ref) {
    return <span {...props} ref={ref} className={joinClassNames("gummy-input-group__addon", className)} data-position={position} />;
  },
);
export const GummyInputGroupControl = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function GummyInputGroupControl({ className, ...props }, ref) {
    return <input {...props} ref={ref} className={joinClassNames("gummy-input-group__control", className)} />;
  },
);
export const GummyInputGroupButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function GummyInputGroupButton({ className, type = "button", ...props }, ref) {
    return <button {...props} ref={ref} type={type} className={joinClassNames("gummy-input-group__button", className)} />;
  },
);

GummyInputGroup.displayName = "GummyInputGroup";
GummyInputGroupAddon.displayName = "GummyInputGroupAddon";
GummyInputGroupControl.displayName = "GummyInputGroupControl";
GummyInputGroupButton.displayName = "GummyInputGroupButton";
