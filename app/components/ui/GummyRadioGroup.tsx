"use client";

import * as React from "react";

type GummyRadioGroupContextValue = {
  name: string;
  value: string | undefined;
  describedBy: string | undefined;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  selectValue: (value: string) => void;
};

const GummyRadioGroupContext =
  React.createContext<GummyRadioGroupContextValue | null>(null);

export type GummyRadioGroupProps = Omit<
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "onChange"
> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  readOnly?: boolean;
  required?: boolean;
};

export type GummyRadioItemProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "name" | "type"
> & {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function joinIds(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ") || undefined;
}

export const GummyRadioGroup = React.forwardRef<
  HTMLFieldSetElement,
  GummyRadioGroupProps
>(function GummyRadioGroup(
  {
    label,
    description,
    errorMessage,
    value: controlledValue,
    defaultValue,
    onValueChange,
    orientation = "vertical",
    readOnly = false,
    required = false,
    disabled = false,
    name: providedName,
    className,
    children,
    ...fieldsetProps
  },
  ref,
) {
  const generatedId = React.useId().replace(/:/g, "");
  const name = providedName ?? `gummy-radio-${generatedId}`;
  const descriptionId = description ? `${name}-description` : undefined;
  const errorId = errorMessage ? `${name}-error` : undefined;
  const readOnlyId = readOnly ? `${name}-readonly` : undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value =
    controlledValue === undefined ? uncontrolledValue : controlledValue;

  const selectValue = React.useCallback(
    (nextValue: string) => {
      if (disabled || readOnly) return;
      if (controlledValue === undefined) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [controlledValue, disabled, onValueChange, readOnly],
  );

  const contextValue = React.useMemo<GummyRadioGroupContextValue>(
    () => ({
      name,
      value,
      describedBy: joinIds(descriptionId, errorId, readOnlyId),
      required,
      disabled,
      readOnly,
      selectValue,
    }),
    [
      descriptionId,
      disabled,
      errorId,
      name,
      readOnlyId,
      readOnly,
      required,
      selectValue,
      value,
    ],
  );

  return (
    <GummyRadioGroupContext.Provider value={contextValue}>
      <fieldset
        {...fieldsetProps}
        ref={ref}
        className={joinClassNames("gummy-radio-group", className)}
        disabled={disabled}
        aria-describedby={joinIds(descriptionId, errorId, readOnlyId)}
        aria-invalid={errorMessage ? true : undefined}
        data-orientation={orientation}
        data-disabled={disabled || undefined}
        data-read-only={readOnly || undefined}
        data-invalid={errorMessage || undefined}
      >
        <legend className="gummy-radio-group__legend">
          <span>{label}</span>
          {required ? <span aria-hidden="true">Required</span> : null}
          {readOnly ? <span aria-hidden="true">Read only</span> : null}
        </legend>
        {description ? (
          <p className="gummy-radio-group__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {readOnlyId ? (
          <span className="gummy-sr-only" id={readOnlyId}>
            Selection is read only and cannot be changed.
          </span>
        ) : null}
        <div className="gummy-radio-group__items">{children}</div>
        {errorMessage ? (
          <p className="gummy-radio-group__error" id={errorId} role="alert">
            <span className="gummy-form-message-mark" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        ) : null}
      </fieldset>
    </GummyRadioGroupContext.Provider>
  );
});

GummyRadioGroup.displayName = "GummyRadioGroup";

export const GummyRadioItem = React.forwardRef<
  HTMLInputElement,
  GummyRadioItemProps
>(function GummyRadioItem(
  {
    value,
    label,
    description,
    disabled: itemDisabled = false,
    required: itemRequired,
    id: providedId,
    className,
    onChange,
    onClick,
    onKeyDown,
    "aria-describedby": ariaDescribedBy,
    ...inputProps
  },
  ref,
) {
  const context = React.useContext(GummyRadioGroupContext);
  if (!context) {
    throw new Error("GummyRadioItem must be used inside GummyRadioGroup.");
  }
  const generatedId = React.useId().replace(/:/g, "");
  const id = providedId ?? `gummy-radio-item-${generatedId}`;
  const titleId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const disabled = context.disabled || itemDisabled;

  function moveSelection(
    event: React.KeyboardEvent<HTMLInputElement>,
    position: "next" | "previous" | "first" | "last",
  ) {
    const fieldset = event.currentTarget.closest("fieldset");
    if (!fieldset) return;
    const inputs = Array.from(
      fieldset.querySelectorAll<HTMLInputElement>(
        'input[type="radio"]:not(:disabled)',
      ),
    );
    const currentIndex = inputs.indexOf(event.currentTarget);
    if (currentIndex < 0 || inputs.length === 0) return;
    const targetIndex =
      position === "first"
        ? 0
        : position === "last"
          ? inputs.length - 1
          : position === "next"
            ? (currentIndex + 1) % inputs.length
            : (currentIndex - 1 + inputs.length) % inputs.length;
    inputs[targetIndex]?.focus();
    inputs[targetIndex]?.click();
  }

  return (
    <div
      className="gummy-radio-item"
      data-disabled={disabled || undefined}
      data-read-only={context.readOnly || undefined}
    >
      <span className="gummy-radio-item__target">
        <input
          {...inputProps}
          ref={ref}
          id={id}
          type="radio"
          className={joinClassNames("gummy-radio-item__input", className)}
          name={context.name}
          value={value}
          checked={context.value === value}
          disabled={disabled}
          required={itemRequired ?? context.required}
          aria-describedby={joinIds(
            ariaDescribedBy,
            context.describedBy,
            descriptionId,
          )}
          onClick={(event) => {
            if (context.readOnly) event.preventDefault();
            onClick?.(event);
          }}
          onKeyDown={(event) => {
            if (
              context.readOnly &&
              [" ", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            ) {
              event.preventDefault();
            } else if (!context.readOnly) {
              const isRtl =
                getComputedStyle(event.currentTarget).direction === "rtl";
              const position =
                event.key === "ArrowDown"
                  ? "next"
                  : event.key === "ArrowUp"
                    ? "previous"
                    : event.key === "ArrowRight"
                      ? isRtl
                        ? "previous"
                        : "next"
                      : event.key === "ArrowLeft"
                        ? isRtl
                          ? "next"
                          : "previous"
                        : event.key === "Home"
                          ? "first"
                          : event.key === "End"
                            ? "last"
                            : null;
              if (position) {
                event.preventDefault();
                moveSelection(event, position);
              }
            }
            onKeyDown?.(event);
          }}
          onChange={(event) => {
            if (event.currentTarget.checked) context.selectValue(value);
            onChange?.(event);
          }}
        />
        <span className="gummy-radio-item__indicator" aria-hidden="true">
          <span className="gummy-radio-item__pool" />
          <span className="gummy-radio-item__dot" />
        </span>
      </span>
      <span className="gummy-radio-item__copy">
        <label className="gummy-radio-item__title" id={titleId} htmlFor={id}>
          {label}
        </label>
        {description ? (
          <span className="gummy-radio-item__description" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </span>
    </div>
  );
});

GummyRadioItem.displayName = "GummyRadioItem";
