"use client";

import { Slider } from "@base-ui/react/slider";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummySliderProps = Slider.Root.Props;

export function GummySlider({ className, ...props }: GummySliderProps) {
  return (
    <Slider.Root
      {...props}
      className={joinClassNames("gummy-slider", className as string)}
    />
  );
}

export const GummySliderLabel = React.forwardRef<
  HTMLDivElement,
  Slider.Label.Props
>(function GummySliderLabel({ className, ...props }, ref) {
  return (
    <Slider.Label
      {...props}
      ref={ref}
      className={joinClassNames("gummy-slider__label", className as string)}
    />
  );
});

export const GummySliderValue = React.forwardRef<
  HTMLOutputElement,
  Slider.Value.Props
>(function GummySliderValue({ className, ...props }, ref) {
  return (
    <Slider.Value
      {...props}
      ref={ref}
      className={joinClassNames("gummy-slider__value", className as string)}
    />
  );
});

export const GummySliderControl = React.forwardRef<
  HTMLDivElement,
  Slider.Control.Props
>(function GummySliderControl({ className, children, ...props }, ref) {
  return (
    <Slider.Control
      {...props}
      ref={ref}
      className={joinClassNames("gummy-slider__control", className as string)}
    >
      <Slider.Track className="gummy-slider__track">
        <Slider.Indicator className="gummy-slider__indicator" />
      </Slider.Track>
      {children}
    </Slider.Control>
  );
});

export const GummySliderThumb = React.forwardRef<
  HTMLDivElement,
  Slider.Thumb.Props
>(function GummySliderThumb({ className, ...props }, ref) {
  return (
    <Slider.Thumb
      {...props}
      ref={ref}
      className={joinClassNames("gummy-slider__thumb", className as string)}
    />
  );
});

GummySliderLabel.displayName = "GummySliderLabel";
GummySliderValue.displayName = "GummySliderValue";
GummySliderControl.displayName = "GummySliderControl";
GummySliderThumb.displayName = "GummySliderThumb";
