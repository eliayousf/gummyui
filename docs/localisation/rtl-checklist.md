# Arabic, Persian, and Hebrew RTL checklist

This checklist is additional to the complete linguistic, keyboard,
accessibility, responsive, and metadata review. It applies to `ar`, `fa`, and
`he`.

## Root direction and layout

- Apply `dir="rtl"` at the reviewed locale document root.
- Confirm components inherit genuine direction rather than using cosmetic row
  reversal.
- Check logical margin, padding, inset, border, radius, alignment, scroll,
  resize, drawer, sheet, and popover placement.
- Mirror directional navigation icons and horizontal keyboard deltas only when
  their meaning is directional.
- Do not mirror brand marks, neutral symbols, media play controls, or
  non-directional status imagery.

## Bidirectional content

- Isolate code, commands, URLs, email addresses, version numbers, registry
  identifiers, hashes, dates, one-time codes, and other inherently LTR values.
- Review Arabic/Persian/Hebrew mixed with Latin product names, component API
  names, numbers, punctuation, parentheses, quotes, and list markers.
- Check breadcrumbs, pagination, sliders, carousels, menus, tables, date
  pickers, form fields, validation, and copy buttons with mixed content.
- Verify copied text retains the intended logical order.

## Language-specific review

- Review Arabic joining and shaping, diacritics where used, numeral choices,
  and line-breaking behavior.
- Review Persian character choices, spacing, joining, numerals, and Arabic
  look-alike substitutions.
- Review Hebrew punctuation, quotation marks, mixed numerals, and line
  breaking.
- Verify selected fonts cover required scripts without an unreadable or
  layout-breaking fallback.

## Interaction and accessibility

- Re-run keyboard order, visible focus, arrows, Home/End, Page keys, Escape,
  typeahead, drag/slider deltas, and focus restoration in RTL.
- Re-run screen-reader, zoom, 400% reflow, narrow mobile, touch, light/dark,
  forced-color, contrast, and reduced-motion checks with genuine content.
- Confirm visual direction and DOM/assistive-technology reading order agree.
- Treat every unresolved mixed-direction or shaping defect as a publication
  blocker.
