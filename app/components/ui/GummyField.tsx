"use client";

import * as React from "react";
import { GummyLabel } from "./GummyLabel";

type GummyFieldControlProps = {
  id?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
};

export type GummyFieldProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** One native or custom form control. Its accessibility props are composed. */
  children: React.ReactElement<GummyFieldControlProps>;
  /** Visible label associated to the child control. */
  label: React.ReactNode;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  successMessage?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  orientation?: "vertical" | "horizontal";
  density?: "default" | "compact";
  controlId?: string;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function joinIds(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ") || undefined;
}

export const GummyField = React.forwardRef<HTMLDivElement, GummyFieldProps>(
  function GummyField(
    {
      children,
      label,
      description,
      errorMessage,
      successMessage,
      required = false,
      optional = false,
      disabled = false,
      readOnly = false,
      orientation = "vertical",
      density = "default",
      controlId: providedControlId,
      className,
      ...rootProps
    },
    ref,
  ) {
    const generatedId = React.useId().replace(/:/g, "");
    const controlId =
      providedControlId ?? children.props.id ?? `gummy-field-${generatedId}`;
    const descriptionId = description ? `${controlId}-description` : undefined;
    const errorId = errorMessage ? `${controlId}-error` : undefined;
    const successId =
      !errorMessage && successMessage ? `${controlId}-success` : undefined;
    const status = errorMessage
      ? "error"
      : successMessage
        ? "success"
        : "default";
    const control = React.cloneElement(children, {
      id: controlId,
      className: joinClassNames(
        "gummy-field__control",
        children.props.className,
      ),
      required: children.props.required ?? required,
      disabled: children.props.disabled ?? disabled,
      readOnly: children.props.readOnly ?? readOnly,
      "aria-describedby": joinIds(
        children.props["aria-describedby"],
        descriptionId,
        errorId,
        successId,
      ),
      "aria-errormessage":
        children.props["aria-errormessage"] ?? errorId,
      "aria-invalid":
        children.props["aria-invalid"] ?? (errorMessage ? true : undefined),
    });

    return (
      <div
        {...rootProps}
        ref={ref}
        className={joinClassNames("gummy-field", className)}
        data-status={status}
        data-disabled={disabled || undefined}
        data-read-only={readOnly || undefined}
        data-orientation={orientation}
        data-density={density}
      >
        <GummyLabel
          htmlFor={controlId}
          required={required}
          optional={optional}
          disabled={disabled}
          readOnly={readOnly}
        >
          {label}
        </GummyLabel>
        <div className="gummy-field__body">
          <div className="gummy-field__control-shell">
            <span className="gummy-field__pool" aria-hidden="true" />
            {control}
            {status !== "default" ? (
              <span className="gummy-field__status" aria-hidden="true">
                {status === "error" ? "!" : "✓"}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="gummy-field__message" id={descriptionId}>
              {description}
            </p>
          ) : null}
          {errorMessage ? (
            <p
              className="gummy-field__message gummy-field__message--error"
              id={errorId}
              role="alert"
            >
              <span className="gummy-form-message-mark" aria-hidden="true" />
              <span>{errorMessage}</span>
            </p>
          ) : successId ? (
            <p
              className="gummy-field__message gummy-field__message--success"
              id={successId}
            >
              <span className="gummy-form-message-mark" aria-hidden="true" />
              <span>{successMessage}</span>
            </p>
          ) : null}
        </div>
      </div>
    );
  },
);

GummyField.displayName = "GummyField";
