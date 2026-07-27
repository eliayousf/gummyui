# Component anatomy and contribution conventions

## Public anatomy

Every component exposes the smallest stable set of meaningful parts. Native
elements or Base UI primitives own semantics and interaction. Gummy wrappers
own material anatomy, tokens, state styling, and local motion.

Decorative material layers must:

- stay inside the component root;
- be hidden from assistive technology;
- never replace visible labels, feedback, or state text;
- grow from one connected material body instead of appearing as unrelated
  circles, corner blobs, or geometric ornaments; and
- preserve fixed reservoir proportions while flexible spans absorb width.

## Source conventions

1. Use React `forwardRef` for public roots and meaningful parts.
2. Preserve native props unless the component deliberately forbids an invalid
   semantic combination.
3. Use `data-*` attributes for visual state; do not duplicate behavioral state
   in page-local wrappers.
4. Use shared OKLCH tokens from `gummy-theme.css`.
5. Keep text on an optically stable layer above translucent material.
6. Add a Component Lab specimen for every state before adding a registry item.
7. Document keyboard behavior, mobile behavior, dark mode, RTL implications,
   and reduced motion.

## Review gate

A registry item is not ready because its resting screenshot looks attractive.
It is ready only when its semantics, states, responsive behavior, source,
documentation, tests, install fixture, and five-part visual audit all pass.
