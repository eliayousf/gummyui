"use client";

import * as React from "react";
import { GummyLabel } from "./GummyLabel";

export type GummyNativeSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "multiple" | "size"
> & {
  children: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  successMessage?: React.ReactNode;
  optional?: boolean;
  readOnly?: boolean;
  wrapperClassName?: string;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function joinIds(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ") || undefined;
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export const GummyNativeSelect = React.forwardRef<
  HTMLSelectElement,
  GummyNativeSelectProps
>(function GummyNativeSelect(
  {
    children,
    label,
    description,
    errorMessage,
    successMessage,
    optional = false,
    readOnly = false,
    wrapperClassName,
    className,
    id: providedId,
    required,
    disabled,
    value,
    defaultValue,
    onChange,
    onKeyDown,
    onPointerDown,
    "aria-describedby": ariaDescribedBy,
    "aria-errormessage": ariaErrorMessage,
    "aria-invalid": ariaInvalid,
    ...selectProps
  },
  forwardedRef,
) {
  const generatedId = React.useId().replace(/:/g, "");
  const id = providedId ?? `gummy-native-select-${generatedId}`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const successId =
    !errorMessage && successMessage ? `${id}-success` : undefined;
  const status = errorMessage
    ? "error"
    : successMessage
      ? "success"
      : "default";
  const selectRef = React.useRef<HTMLSelectElement | null>(null);
  const lastAcceptedValue = React.useRef<string>(
    value === undefined
      ? defaultValue === undefined
        ? ""
        : String(defaultValue)
      : String(value),
  );

  React.useEffect(() => {
    if (value !== undefined) lastAcceptedValue.current = String(value);
  }, [value]);

  return (
    <div
      className={joinClassNames("gummy-native-select", wrapperClassName)}
      data-status={status}
      data-disabled={disabled || undefined}
      data-read-only={readOnly || undefined}
    >
      <GummyLabel
        htmlFor={id}
        required={required}
        optional={optional}
        disabled={disabled}
        readOnly={readOnly}
      >
        {label}
      </GummyLabel>
      <div className="gummy-native-select__shell">
        <span className="gummy-native-select__pool" aria-hidden="true" />
        <select
          {...selectProps}
          ref={(node) => {
            selectRef.current = node;
            assignRef(forwardedRef, node);
          }}
          id={id}
          className={joinClassNames("gummy-native-select__control", className)}
          required={required}
          disabled={disabled}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          aria-readonly={readOnly || undefined}
          aria-describedby={joinIds(
            ariaDescribedBy,
            descriptionId,
            errorId,
            successId,
          )}
          aria-errormessage={ariaErrorMessage ?? errorId}
          aria-invalid={ariaInvalid ?? (errorMessage ? true : undefined)}
          onPointerDown={(event) => {
            if (readOnly) {
              event.preventDefault();
              event.currentTarget.focus();
            }
            onPointerDown?.(event);
          }}
          onKeyDown={(event) => {
            if (
              readOnly &&
              [
                " ",
                "Enter",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
                "PageUp",
                "PageDown",
              ].includes(event.key)
            ) {
              event.preventDefault();
            }
            onKeyDown?.(event);
          }}
          onChange={(event) => {
            if (readOnly) {
              event.currentTarget.value = lastAcceptedValue.current;
              return;
            }
            lastAcceptedValue.current = event.currentTarget.value;
            onChange?.(event);
          }}
        >
          {children}
        </select>
        <span className="gummy-native-select__chevron" aria-hidden="true">
          <svg viewBox="0 0 16 10" focusable="false">
            <path d="m2 2 6 6 6-6" />
          </svg>
        </span>
        {status !== "default" ? (
          <span className="gummy-native-select__status" aria-hidden="true">
            {status === "error" ? "!" : "✓"}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="gummy-native-select__message" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          className="gummy-native-select__message gummy-native-select__message--error"
          id={errorId}
          role="alert"
        >
          <span className="gummy-form-message-mark" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      ) : successId ? (
        <p
          className="gummy-native-select__message gummy-native-select__message--success"
          id={successId}
        >
          <span className="gummy-form-message-mark" aria-hidden="true" />
          <span>{successMessage}</span>
        </p>
      ) : null}
    </div>
  );
});

GummyNativeSelect.displayName = "GummyNativeSelect";
