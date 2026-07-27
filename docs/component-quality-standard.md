# Gummy UI component quality standard

This standard makes the visual and engineering bar repeatable.

## 1. Material continuity

- The silhouette reads as one pressure-shaped mass.
- Highlights follow geometry and deformation.
- Thick reservoirs are connected to narrow flexible spans.
- No detached lobes, uniform decorative outlines, rainbow stripes, hard bottom
  shelves, or generic drop-shadow stacks.

## 2. Information hierarchy

- Gel intensity communicates emphasis rather than decorating every surface.
- Reading and editing planes remain calm and legible.
- Text never depends on transmitted backdrop contrast.
- Dense product layouts still scan without visual noise.

## 3. Interaction and accessibility

- Native semantics or Base UI foundations are mandatory.
- Pointer, keyboard, touch, disabled, loading, error, and success behavior are
  designed together.
- Focus is visible without relying on color alone.
- Reduced motion removes deformation without removing state information.
- Automated axe and contrast checks supplement manual keyboard review.

## 4. Responsive and theme behavior

- Minimum touch targets remain 44px.
- Fixed reservoirs do not stretch across wide containers.
- Content never enters decorative reservoir footprints.
- Light and dark themes preserve material identity and readable contrast.
- Narrow layouts reflow instead of clipping or stacking floating decoration.

## 5. Release verification

- Unit and accessibility tests pass.
- Type checking and lint pass.
- Registry installation fixture passes.
- Production and rendered builds pass.
- The five visual audits are recorded and all blocking findings are fixed.
