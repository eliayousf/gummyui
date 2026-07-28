"use client";

import * as Slider from "@radix-ui/react-slider";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const SliderValueContext = React.createContext<readonly number[]>([]);

type RadixSliderProps = React.ComponentPropsWithoutRef<typeof Slider.Root>;

export type GummySliderProps = Omit<
  RadixSliderProps,
  "value" | "defaultValue" | "onValueChange"
> & {
  value?: number | number[];
  defaultValue?: number | number[];
  onValueChange?: (value: number | number[]) => void;
};

export function GummySlider({
  className,
  value,
  defaultValue = 0,
  onValueChange,
  children,
  ...props
}: GummySliderProps) {
  const isRange = Array.isArray(value ?? defaultValue);
  const normalise = (input: number | number[] | undefined) =>
    Array.isArray(input) ? input : [input ?? 0];
  const controlledValue = value === undefined ? undefined : normalise(value);
  const [internalValue, setInternalValue] = React.useState(() =>
    normalise(value ?? defaultValue),
  );
  const currentValue = controlledValue ?? internalValue;
  function handleValueChange(nextValue: number[]) {
    if (controlledValue === undefined) setInternalValue(nextValue);
    onValueChange?.(isRange ? nextValue : (nextValue[0] ?? 0));
  }
  return (
    <SliderValueContext.Provider value={currentValue}>
      <Slider.Root
        {...props}
        value={controlledValue}
        defaultValue={controlledValue === undefined ? normalise(defaultValue) : undefined}
        onValueChange={handleValueChange}
        className={joinClassNames("gummy-slider", className)}
      >
        {children}
      </Slider.Root>
    </SliderValueContext.Provider>
  );
}

export const GummySliderLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummySliderLabel({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-slider__label", className)} />;
});

export const GummySliderValue = React.forwardRef<
  HTMLOutputElement,
  React.OutputHTMLAttributes<HTMLOutputElement>
>(function GummySliderValue({ className, children, ...props }, ref) {
  const values = React.useContext(SliderValueContext);
  return (
    <output
      {...props}
      ref={ref}
      className={joinClassNames("gummy-slider__value", className)}
    >
      {children ?? values.join("–")}
    </output>
  );
});

export const GummySliderControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummySliderControl({ className, children, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={joinClassNames("gummy-slider__control", className)}
    >
      <Slider.Track className="gummy-slider__track">
        <Slider.Range className="gummy-slider__indicator" />
      </Slider.Track>
      {children}
    </div>
  );
});

export const GummySliderThumb = React.forwardRef<
  React.ElementRef<typeof Slider.Thumb>,
  React.ComponentPropsWithoutRef<typeof Slider.Thumb>
>(function GummySliderThumb({ className, ...props }, ref) {
  return <Slider.Thumb {...props} ref={ref} className={joinClassNames("gummy-slider__thumb", className)} />;
});

GummySliderLabel.displayName = "GummySliderLabel";
GummySliderValue.displayName = "GummySliderValue";
GummySliderControl.displayName = "GummySliderControl";
GummySliderThumb.displayName = "GummySliderThumb";
