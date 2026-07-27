"use client";

import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type CarouselContextValue = {
  index: number;
  itemCount: number;
  loop: boolean;
  orientation: "horizontal" | "vertical";
  direction: "ltr" | "rtl";
  moveTo: (index: number) => void;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error("Gummy Carousel parts must be used inside GummyCarousel.");
  return context;
}

export type GummyCarouselProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "dir"
> & {
  itemCount: number;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  direction?: "ltr" | "rtl";
  label?: string;
};

export const GummyCarousel = React.forwardRef<HTMLDivElement, GummyCarouselProps>(
  function GummyCarousel(
    {
      itemCount,
      index: controlledIndex,
      defaultIndex = 0,
      onIndexChange,
      loop = false,
      orientation = "horizontal",
      direction = "ltr",
      label = "Carousel",
      className,
      children,
      ...props
    },
    ref,
  ) {
    const count = Math.max(1, Math.floor(itemCount));
    const clamp = React.useCallback(
      (next: number) => Math.max(0, Math.min(count - 1, next)),
      [count],
    );
    const [internalIndex, setInternalIndex] = React.useState(() => clamp(defaultIndex));
    const currentIndex = clamp(controlledIndex ?? internalIndex);
    const moveTo = React.useCallback(
      (next: number) => {
        const resolved = loop ? ((next % count) + count) % count : clamp(next);
        if (controlledIndex === undefined) setInternalIndex(resolved);
        if (resolved !== currentIndex) onIndexChange?.(resolved);
      },
      [clamp, controlledIndex, count, currentIndex, loop, onIndexChange],
    );
    const context = React.useMemo(
      () => ({
        index: currentIndex,
        itemCount: count,
        loop,
        orientation,
        direction,
        moveTo,
      }),
      [count, currentIndex, direction, loop, moveTo, orientation],
    );
    return (
      <CarouselContext.Provider value={context}>
        <div
          {...props}
          ref={ref}
          dir={direction}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          className={joinClassNames("gummy-carousel", className)}
          data-orientation={orientation}
        >
          {children}
          <p className="gummy-visually-hidden" aria-live="polite" aria-atomic="true">
            Slide {currentIndex + 1} of {count}
          </p>
        </div>
      </CarouselContext.Provider>
    );
  },
);

export const GummyCarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyCarouselContent({ className, style, onKeyDown, ...props }, ref) {
  const carousel = useCarousel();
  return (
    <div
      {...props}
      ref={ref}
      tabIndex={0}
      className={joinClassNames("gummy-carousel__viewport", className)}
      data-orientation={carousel.orientation}
      style={{ ...style, "--gummy-carousel-index": carousel.index } as React.CSSProperties}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        let delta = 0;
        if (carousel.orientation === "horizontal") {
          if (event.key === "ArrowLeft") delta = carousel.direction === "rtl" ? 1 : -1;
          if (event.key === "ArrowRight") delta = carousel.direction === "rtl" ? -1 : 1;
        } else {
          if (event.key === "ArrowUp") delta = -1;
          if (event.key === "ArrowDown") delta = 1;
        }
        if (event.key === "Home") {
          event.preventDefault();
          carousel.moveTo(0);
        } else if (event.key === "End") {
          event.preventDefault();
          carousel.moveTo(carousel.itemCount - 1);
        } else if (delta) {
          event.preventDefault();
          carousel.moveTo(carousel.index + delta);
        }
      }}
    />
  );
});

export type GummyCarouselItemProps = React.HTMLAttributes<HTMLDivElement> & {
  index: number;
  label?: string;
};

export const GummyCarouselItem = React.forwardRef<HTMLDivElement, GummyCarouselItemProps>(
  function GummyCarouselItem({ index, label, className, ...props }, ref) {
    const carousel = useCarousel();
    const active = index === carousel.index;
    return (
      <div
        {...props}
        ref={ref}
        role="group"
        aria-roledescription="slide"
        aria-label={label ?? `${index + 1} of ${carousel.itemCount}`}
        aria-hidden={!active}
        inert={!active}
        className={joinClassNames("gummy-carousel__item", className)}
        data-active={active || undefined}
      />
    );
  },
);

type CarouselButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const GummyCarouselPrevious = React.forwardRef<HTMLButtonElement, CarouselButtonProps>(
  function GummyCarouselPrevious({ className, children, onClick, disabled, ...props }, ref) {
    const carousel = useCarousel();
    const unavailable = !carousel.loop && carousel.index === 0;
    return (
      <button
        {...props}
        ref={ref}
        type="button"
        className={joinClassNames("gummy-carousel__control", className)}
        aria-label={props["aria-label"] ?? "Previous slide"}
        disabled={disabled || unavailable}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) carousel.moveTo(carousel.index - 1);
        }}
      >
        {children ?? <span aria-hidden="true">{carousel.direction === "rtl" ? "→" : "←"}</span>}
      </button>
    );
  },
);

export const GummyCarouselNext = React.forwardRef<HTMLButtonElement, CarouselButtonProps>(
  function GummyCarouselNext({ className, children, onClick, disabled, ...props }, ref) {
    const carousel = useCarousel();
    const unavailable = !carousel.loop && carousel.index === carousel.itemCount - 1;
    return (
      <button
        {...props}
        ref={ref}
        type="button"
        className={joinClassNames("gummy-carousel__control", className)}
        aria-label={props["aria-label"] ?? "Next slide"}
        disabled={disabled || unavailable}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) carousel.moveTo(carousel.index + 1);
        }}
      >
        {children ?? <span aria-hidden="true">{carousel.direction === "rtl" ? "←" : "→"}</span>}
      </button>
    );
  },
);

export const GummyCarouselIndicators = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyCarouselIndicators({ className, ...props }, ref) {
  const carousel = useCarousel();
  return (
    <div
      {...props}
      ref={ref}
      role="group"
      aria-label={props["aria-label"] ?? "Choose slide"}
      className={joinClassNames("gummy-carousel__indicators", className)}
    >
      {Array.from({ length: carousel.itemCount }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === carousel.index ? "true" : undefined}
          onClick={() => carousel.moveTo(index)}
        />
      ))}
    </div>
  );
});

GummyCarousel.displayName = "GummyCarousel";
GummyCarouselContent.displayName = "GummyCarouselContent";
GummyCarouselItem.displayName = "GummyCarouselItem";
GummyCarouselPrevious.displayName = "GummyCarouselPrevious";
GummyCarouselNext.displayName = "GummyCarouselNext";
GummyCarouselIndicators.displayName = "GummyCarouselIndicators";
