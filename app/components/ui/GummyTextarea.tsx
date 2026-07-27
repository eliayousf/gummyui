"use client";

import * as React from "react";
import { GummyLabel } from "./GummyLabel";

export type GummyTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  successMessage?: React.ReactNode;
  optional?: boolean;
  resize?: "none" | "vertical" | "both";
  showCount?: boolean;
  wrapperClassName?: string;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function joinIds(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ") || undefined;
}

export const GummyTextarea = React.forwardRef<
  HTMLTextAreaElement,
  GummyTextareaProps
>(function GummyTextarea(
  {
    label,
    description,
    errorMessage,
    successMessage,
    optional = false,
    resize = "vertical",
    showCount = false,
    wrapperClassName,
    className,
    id: providedId,
    required,
    disabled,
    readOnly,
    value,
    defaultValue,
    maxLength,
    onChange,
    "aria-describedby": ariaDescribedBy,
    "aria-errormessage": ariaErrorMessage,
    "aria-invalid": ariaInvalid,
    ...textareaProps
  },
  ref,
) {
  const generatedId = React.useId().replace(/:/g, "");
  const id = providedId ?? `gummy-textarea-${generatedId}`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const successId =
    !errorMessage && successMessage ? `${id}-success` : undefined;
  const countId = showCount ? `${id}-count` : undefined;
  const status = errorMessage
    ? "error"
    : successMessage
      ? "success"
      : "default";
  const [uncontrolledValue, setUncontrolledValue] = React.useState(() =>
    defaultValue === undefined || defaultValue === null ? "" : String(defaultValue),
  );
  const currentValue = value === undefined ? uncontrolledValue : String(value);

  return (
    <div
      className={joinClassNames("gummy-textarea", wrapperClassName)}
      data-status={status}
      data-disabled={disabled || undefined}
      data-read-only={readOnly || undefined}
      data-filled={currentValue.length > 0 || undefined}
      data-resize={resize}
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
      <div className="gummy-textarea__shell">
        <span className="gummy-textarea__pool" aria-hidden="true" />
        <textarea
          {...textareaProps}
          ref={ref}
          id={id}
          className={joinClassNames("gummy-textarea__control", className)}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          maxLength={maxLength}
          aria-describedby={joinIds(
            ariaDescribedBy,
            descriptionId,
            errorId,
            successId,
            countId,
          )}
          aria-errormessage={ariaErrorMessage ?? errorId}
          aria-invalid={ariaInvalid ?? (errorMessage ? true : undefined)}
          onChange={(event) => {
            if (value === undefined) setUncontrolledValue(event.currentTarget.value);
            onChange?.(event);
          }}
        />
        {status !== "default" ? (
          <span className="gummy-textarea__status" aria-hidden="true">
            {status === "error" ? "!" : "✓"}
          </span>
        ) : null}
      </div>
      <div className="gummy-textarea__support">
        <div>
          {description ? (
            <p className="gummy-textarea__message" id={descriptionId}>
              {description}
            </p>
          ) : null}
          {errorMessage ? (
            <p
              className="gummy-textarea__message gummy-textarea__message--error"
              id={errorId}
              role="alert"
            >
              <span className="gummy-form-message-mark" aria-hidden="true" />
              <span>{errorMessage}</span>
            </p>
          ) : successId ? (
            <p
              className="gummy-textarea__message gummy-textarea__message--success"
              id={successId}
            >
              <span className="gummy-form-message-mark" aria-hidden="true" />
              <span>{successMessage}</span>
            </p>
          ) : null}
        </div>
        {showCount ? (
          <span className="gummy-textarea__count" id={countId} aria-live="polite">
            {currentValue.length}
            {maxLength ? ` / ${maxLength}` : null}
          </span>
        ) : null}
      </div>
    </div>
  );
});

GummyTextarea.displayName = "GummyTextarea";
