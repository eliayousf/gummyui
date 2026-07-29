"use client";

import * as React from "react";

export type GummyCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "children" | "size" | "type"
> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  indeterminate?: boolean;
  readOnly?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
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

export const GummyCheckbox = React.forwardRef<
  HTMLInputElement,
  GummyCheckboxProps
>(function GummyCheckbox(
  {
    label,
    description,
    errorMessage,
    indeterminate = false,
    readOnly = false,
    onCheckedChange,
    wrapperClassName,
    className,
    id: providedId,
    disabled,
    required,
    checked,
    defaultChecked,
    onChange,
    onClick,
    onKeyDown,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...inputProps
  },
  forwardedRef,
) {
  const generatedId = React.useId().replace(/:/g, "");
  const id = providedId ?? `gummy-checkbox-${generatedId}`;
  const titleId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(
    Boolean(defaultChecked),
  );
  const renderedChecked =
    checked === undefined ? uncontrolledChecked : Boolean(checked);

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div
      className={joinClassNames("gummy-checkbox", wrapperClassName)}
      data-disabled={disabled || undefined}
      data-read-only={readOnly || undefined}
      data-invalid={Boolean(errorMessage) || undefined}
      data-indeterminate={indeterminate || undefined}
    >
      <div className="gummy-checkbox__label">
        <span className="gummy-checkbox__target">
          <input
            {...inputProps}
            ref={(node) => {
              inputRef.current = node;
              assignRef(forwardedRef, node);
            }}
            id={id}
            type="checkbox"
            className={joinClassNames("gummy-checkbox__input", className)}
            checked={renderedChecked}
            disabled={disabled}
            required={required}
            aria-readonly={readOnly || undefined}
            aria-checked={indeterminate ? "mixed" : undefined}
            aria-describedby={joinIds(ariaDescribedBy, descriptionId, errorId)}
            aria-invalid={ariaInvalid ?? (errorMessage ? true : undefined)}
            onClick={(event) => {
              if (readOnly) {
                event.preventDefault();
                event.currentTarget.checked = renderedChecked;
                queueMicrotask(() => {
                  if (inputRef.current) {
                    inputRef.current.checked = renderedChecked;
                  }
                });
              }
              onClick?.(event);
            }}
            onKeyDown={(event) => {
              if (readOnly && (event.key === " " || event.key === "Enter")) {
                event.preventDefault();
              }
              onKeyDown?.(event);
            }}
            onChange={(event) => {
              if (!readOnly) {
                if (checked === undefined) {
                  setUncontrolledChecked(event.currentTarget.checked);
                }
                onCheckedChange?.(event.currentTarget.checked);
                onChange?.(event);
              } else {
                event.currentTarget.checked = renderedChecked;
                queueMicrotask(() => {
                  if (inputRef.current) {
                    inputRef.current.checked = renderedChecked;
                  }
                });
              }
            }}
          />
          <span className="gummy-checkbox__indicator" aria-hidden="true">
            <span className="gummy-checkbox__pool" />
            <svg viewBox="0 0 18 14" focusable="false">
              <path d="M2 7.4 6.7 12 16 2" />
            </svg>
            <span className="gummy-checkbox__mixed" />
          </span>
        </span>
        <span className="gummy-checkbox__copy">
          <label className="gummy-checkbox__title" id={titleId} htmlFor={id}>
            {label}
            {required ? (
              <span className="gummy-checkbox__required" aria-hidden="true">
                Required
              </span>
            ) : null}
            {readOnly ? (
              <span className="gummy-checkbox__read-only" aria-hidden="true">
                Read only
              </span>
            ) : null}
          </label>
          {description ? (
            <span className="gummy-checkbox__description" id={descriptionId}>
              {description}
            </span>
          ) : null}
          {errorMessage ? (
            <span
              className="gummy-checkbox__error"
              id={errorId}
              role="alert"
            >
              <span className="gummy-form-message-mark" aria-hidden="true" />
              <span>{errorMessage}</span>
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
});

GummyCheckbox.displayName = "GummyCheckbox";
