# Accessibility and visual regression strategy

## Automated checks

- Vitest and Testing Library cover public behavior and keyboard interaction.
- axe-core checks every one of the 57 canonical catalogue preview renderers
  independently; `tests/ComponentCatalogue.a11y.test.tsx` currently passes
  57/57 with no critical or serious violations. Group suites additionally
  cover representative ready, selected, open, validation, disabled, loading,
  and composite-interaction states.
- Token-level contrast tests cover stable text/background pairs.
- Rendered HTML tests prove that production output contains canonical source,
  theme rules, and reference assets.
- Registry verification installs and type-checks public source in isolation.

## Five-pass visual audit

1. **Material continuity:** connected silhouettes, highlights, reservoirs, and
   absence of detached geometry.
2. **Hierarchy and density:** reading order, restraint, realistic content, and
   appropriate gel intensity.
3. **Responsive behavior:** 1280px, 768px, and 390px views; overflow, touch
   targets, stacking, and content/reservoir collisions.
4. **Dark theme and contrast:** transmitted background, text stability, focus,
   semantic colors, and overlay readability.
5. **Interaction and motion:** pointer, keyboard, touch-equivalent activation,
   focus restoration, chewy feedback, and reduced motion.

Every pass produces findings, fixes, and a second browser inspection. A pass is
not complete when it merely lists defects.

## Stage 3 Group 2 additions

- Decorative and semantic Separator modes are tested separately.
- Heading semantics are independent from visual type scale.
- Kbd shortcut joiners are hidden from assistive technology and groups may
  carry a spoken shortcut name.
- Spinner always exposes a named status.
- Skeleton compositions use one busy status while their shapes remain
  decorative.
- Aspect Ratio adds no synthetic semantics and leaves media alternative text
  to the consuming image or video.
- Reduced motion converts rotation and travelling loading tides to static,
  still-visible state treatments.

The corresponding five-pass record is
[`docs/audits/stage3-layout-feedback-five-pass-audit.md`](audits/stage3-layout-feedback-five-pass-audit.md).
