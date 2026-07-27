"use client";

import * as React from "react";

export type GummyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  /** Visible label programmatically associated with the native input. */
  label: React.ReactNode;
  /** Supporting copy associated through aria-describedby. */
  description?: React.ReactNode;
  /** Error feedback; takes precedence over success feedback. */
  errorMessage?: React.ReactNode;
  /** Positive feedback that supplements, rather than replaces, colour. */
  successMessage?: React.ReactNode;
  /** Decorative content placed before the editing surface. */
  leadingAdornment?: React.ReactNode;
  /** Decorative content placed after the editing surface. */
  trailingAdornment?: React.ReactNode;
  /** Class applied to the outer field composition. */
  wrapperClassName?: string;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function hasInputValue(value: unknown) {
  return value !== undefined && value !== null && String(value).length > 0;
}

export const GummyInput = React.forwardRef<HTMLInputElement, GummyInputProps>(
  function GummyInput(
    {
      label,
      description,
      errorMessage,
      successMessage,
      leadingAdornment,
      trailingAdornment,
      wrapperClassName,
      className,
      id: providedId,
      required,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      "aria-describedby": ariaDescribedBy,
      "aria-errormessage": ariaErrorMessage,
      "aria-invalid": ariaInvalid,
      ...inputProps
    },
    ref,
  ) {
    const generatedId = React.useId();
    const inputId = providedId ?? `gummy-input-${generatedId.replace(/:/g, "")}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const successId = !errorMessage && successMessage
      ? `${inputId}-success`
      : undefined;
    const describedBy = [
      ariaDescribedBy,
      descriptionId,
      errorId,
      successId,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
    const status = errorMessage ? "error" : successMessage ? "success" : "default";
    const [filled, setFilled] = React.useState(
      hasInputValue(value) || hasInputValue(defaultValue),
    );

    React.useEffect(() => {
      if (value !== undefined) setFilled(hasInputValue(value));
    }, [value]);

    return (
      <div
        className={joinClassNames("gummy-input", wrapperClassName)}
        data-status={status}
        data-disabled={disabled || undefined}
        data-read-only={readOnly || undefined}
        data-filled={filled || undefined}
      >
        <div className="gummy-input__label-row">
          <label className="gummy-input__label" htmlFor={inputId}>
            {label}
          </label>
          {required ? <span className="gummy-input__required">Required</span> : null}
          {readOnly ? <span className="gummy-input__read-only">Read only</span> : null}
        </div>

        <div className="gummy-input__control">
          {leadingAdornment ? (
            <span className="gummy-input__adornment" aria-hidden="true">
              {leadingAdornment}
            </span>
          ) : null}
          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            className={joinClassNames("gummy-input__field", className)}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            defaultValue={defaultValue}
            aria-describedby={describedBy}
            aria-errormessage={ariaErrorMessage ?? errorId}
            aria-invalid={ariaInvalid ?? (errorMessage ? true : undefined)}
            onChange={(event) => {
              setFilled(hasInputValue(event.currentTarget.value));
              onChange?.(event);
            }}
          />
          {trailingAdornment ? (
            <span className="gummy-input__adornment" aria-hidden="true">
              {trailingAdornment}
            </span>
          ) : null}
          {status !== "default" ? (
            <span className="gummy-input__status-icon" aria-hidden="true">
              {status === "error" ? "!" : "✓"}
            </span>
          ) : null}
        </div>

        {description ? (
          <p className="gummy-input__message" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="gummy-input__message gummy-input__message--error" id={errorId} role="alert">
            <span className="gummy-input__message-mark" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        ) : successId ? (
          <p className="gummy-input__message gummy-input__message--success" id={successId}>
            <span className="gummy-input__message-mark" aria-hidden="true" />
            <span>{successMessage}</span>
          </p>
        ) : null}
      </div>
    );
  },
);

GummyInput.displayName = "GummyInput";
