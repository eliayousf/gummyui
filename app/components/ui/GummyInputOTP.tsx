"use client";

import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyInputOTPProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {
  label: string;
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
};

export const GummyInputOTP = React.forwardRef<HTMLDivElement, GummyInputOTPProps>(
  function GummyInputOTP(
    {
      label,
      length = 6,
      value,
      defaultValue = "",
      onValueChange,
      disabled,
      invalid,
      name,
      className,
      ...props
    },
    ref,
  ) {
    const safeLength = Math.max(4, Math.min(8, Math.floor(length)));
    const [internal, setInternal] = React.useState(defaultValue.replace(/\D/g, "").slice(0, safeLength));
    const current = (value ?? internal).padEnd(safeLength, " ").slice(0, safeLength);
    const id = React.useId().replace(/:/g, "");
    function update(next: string) {
      const clean = next.replace(/\D/g, "").slice(0, safeLength);
      if (value === undefined) setInternal(clean);
      onValueChange?.(clean);
    }
    function focus(index: number) {
      document.getElementById(`${id}-${Math.max(0, Math.min(safeLength - 1, index))}`)?.focus();
    }
    return (
      <div {...props} ref={ref} className={joinClassNames("gummy-otp", className)} role="group" aria-labelledby={`${id}-label`} data-invalid={invalid || undefined}>
        <span id={`${id}-label`} className="gummy-otp__label">{label}</span>
        <div className="gummy-otp__slots" dir="ltr" onPaste={(event) => {
          const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
          if (pasted) {
            event.preventDefault();
            update(pasted);
            requestAnimationFrame(() => focus(Math.min(pasted.length, safeLength) - 1));
          }
        }}>
          {Array.from({ length: safeLength }, (_, index) => (
            <input
              key={index}
              id={`${id}-${index}`}
              aria-label={`Digit ${index + 1} of ${safeLength}`}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              pattern="[0-9]*"
              maxLength={1}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              value={current[index].trim()}
              onChange={(event) => {
                const digit = event.currentTarget.value.replace(/\D/g, "").slice(-1);
                const chars = current.trimEnd().split("");
                chars[index] = digit;
                update(chars.join(""));
                if (digit) focus(index + 1);
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !current[index].trim() && index > 0) {
                  event.preventDefault();
                  const chars = current.trimEnd().split("");
                  chars[index - 1] = "";
                  update(chars.join(""));
                  focus(index - 1);
                } else if (event.key === "ArrowLeft") focus(index - 1);
                else if (event.key === "ArrowRight") focus(index + 1);
              }}
            />
          ))}
        </div>
        {name ? <input type="hidden" name={name} value={current.trim()} /> : null}
      </div>
    );
  },
);

GummyInputOTP.displayName = "GummyInputOTP";
