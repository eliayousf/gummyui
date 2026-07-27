# Production browser pass — 26 July 2026

## Scope

This pass exercised the locally built production server in the Codex in-app
Chromium browser. It was not a deployment or a production-domain test.

The pass covered:

- the home page at 320 × 800, 768 × 900, and 1280 × 900;
- direct navigation to `/docs`, `/components`, `/themes`, `/pro`, and `/blog`;
- canonical metadata and horizontal-overflow checks on those routes;
- light/dark theme switching;
- pointer selection in the example workspace tabs; and
- keyboard ArrowRight navigation from Activity to Team.

## Defect found and resolved

At 768 pixels the original header rendered all eight primary links. The
navigation rectangle overlapped both the brand and the language/theme actions:

- brand: x 24–172;
- navigation: x 83–674; and
- actions: x 584–744.

The responsive header now shows the first four links below 1040 pixels and the
first two below 820 pixels. The rechecked 768-pixel geometry is:

- brand: x 24–172;
- navigation: x 307–450; and
- actions: x 584–744.

No rectangles overlap and document width remains 768 pixels.

## Evidence

| Check | Result |
| --- | --- |
| Home at 320 px | 320 px client and scroll width; styled production output rendered |
| Home at 768 px | 768 px client and scroll width; header collision resolved |
| Home at 1280 px | 1280 px client and scroll width |
| Direct routes | Expected title, H1, and `https://gummyui.dev/...` canonical on all five |
| Theme control | Unique accessible control changed `data-theme` from dark to light |
| Pointer tabs | Activity became selected and exposed its Activity tabpanel |
| Keyboard tabs | ArrowRight moved focus and selection from Activity to Team |
| Production console | No new warning or error entries during the production pass |

The 320-pixel DOM contains a few negative-positioned descendants inside the
closed language popover, but they do not increase document scroll width and
are not exposed as an open control. The page itself has no horizontal scroll.

## Remaining manual gates

- current Firefox and WebKit rendering;
- screen-reader walkthroughs;
- formal painted contrast measurement in both themes;
- representative device and touch testing;
- bidirectional-language visual review with long Arabic, Hebrew, and Persian
  content; and
- the same direct-route and console pass on the final production origin.
