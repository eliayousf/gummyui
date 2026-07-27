# Gummy UI Visual Direction

## July 2026 Pinterest trend scan

The strongest current signal is no longer merely a collection of adjacent
Pinterest boards. Pinterest named **Gimme Gummy** as one of its 21 official
Pinterest Predicts trends for 2026.

Pinterest's global English-language search data compared September 2024–August
2025 with the preceding year and reported:

- `gummy bears aesthetic`: +50%
- `agar agar`: +35%
- `yokan`: +60%
- `jelly blush`: +130%
- `jelly candy aesthetic`: +100%

Pinterest describes the demand as Gen Z- and Millennial-led interest in bendy,
elastic, rubberised, glossy, three-dimensional, and spring-back objects. It
also brought the prediction into a physical commercial collaboration with NYX
Professional Makeup, showing that the direction can become a complete branded
experience rather than remaining a moodboard.

Primary sources:

- [Pinterest Predicts 2026 trend report](https://business.pinterest.com/pdf/pinterest-predicts/2026-trend-report/)
- [Gimme Gummy trend page](https://business.pinterest.com/en-gb/pinterest-predicts/2026/gimme-gummy/)
- [Pinterest's 2026 trends announcement and NYX activation](https://newsroom.pinterest.com/news/pinterest-predicts-nonconformity-self-preservation-and-escapism-drive-21-trends-for-2026/)

The broader competitive assessment is recorded in
[Pinterest trends without established UI libraries](research/pinterest-unclaimed-ui-opportunities-2026-07-26.md).

### Adjacent signals worth borrowing

The same report identifies three useful supporting directions:

- **Extra Celestial:** `opalescent` grew 115%. This supports restrained
  pearlescent highlights and an icy information colour, but not a fully
  holographic interface.
- **Neo Deco:** crisp geometry, arches, and selective metallic edging offer a
  grown-up structural counterweight to gummy softness.
- **FunHaus:** sculptural silhouettes and bold pattern can add energy to
  marketing compositions. Pinterest explicitly recommends balancing these
  elements with pared-back palettes, matching Gummy UI's selective-use rule.

### Strategic scorecard

These scores are product judgement, not Pinterest measurements. They compare
how well each direction can become a distinctive, usable, maintainable SaaS
component library.

| Direction | Trend evidence | SaaS usability | System scalability | Ownable position | Decision |
|---|---:|---:|---:|---:|---|
| Restrained gummy / Gel Pop | 10 | 9 | 9 | 10 | Primary direction |
| Extra Celestial / opalescent | 9 | 7 | 6 | 7 | Optical accent only |
| Neo Deco | 7 | 9 | 7 | 7 | Structural influence |
| FunHaus | 8 | 4 | 5 | 8 | Marketing-only influence |
| Liquid glass | 6 | 7 | 8 | 4 | Avoid as the core |
| Claymorphism | 5 | 6 | 7 | 5 | Avoid as the core |
| Glitchy Glam | 8 | 3 | 4 | 8 | Campaign use only |

### Recommended formula

**Gel Pop 2.0** is the commercial direction:

- 70% restrained gummy materiality;
- 15% clean editorial SaaS foundation;
- 10% opalescent and icy optical accents; and
- 5% geometric or deliberately eccentric campaign detail.

The percentages describe creative emphasis, not literal screen coverage. Most
of a working product remains clean and flat enough to read. Gummy identity
lives in controls, selected states, status objects, hero moments, and motion.

## Research conclusion

Current “gummy” references cluster around four neighbouring styles:

1. **Glossy game UI** — colourful, thick, highly rendered controls.
2. **Claymorphism** — chunky radii, pastel depth, and soft dual shadows.
3. **Liquid glass** — translucent layers, blur, and refracted colour.
4. **Inflated graphic design** — balloon typography and soft plastic volume.

Pinterest results for [glossy UI](https://www.pinterest.com/ideas/glossy-ui/943948763800/)
and the recurring [Gummy UI Elements](https://www.pinterest.com/pin/gummy-ui-elements--304415256074996634/)
show that the literal gummy treatment is currently associated mostly with game
interfaces. Claymorphism references add useful softness, but often become too
toy-like for business software. Liquid-glass references are cleaner, but are
already becoming another common AI-generated aesthetic.

Gummy UI will therefore use an original hybrid called **Gel Pop**:

> Clean editorial SaaS layouts with selective gel materiality: bright tinted
> surfaces, soft inflated geometry, a crisp internal highlight, coloured depth,
> and quick elastic feedback.

The material is an accent and hierarchy system, not a filter applied to every
element.

The deeper 2026 scan confirms this conclusion. Gummy UI should not pivot to
another aesthetic. It should make Gel Pop more specific: rubberised rather than
blurred, spring-back rather than floaty, selectively translucent rather than
glass-coated, and colourful against a disciplined editorial base.

## Component-first workflow

The material system is established in canonical reusable components before it
is composed into pages. A component must be implemented, tested, and approved
before marketing pages, dashboards, pricing sections, registry work, or
catalogue-scale production can depend on it. The public website will eventually
import the real Gummy UI components; page-local recreations of their appearance
are not acceptable substitutes.

ImageGen is an art-direction tool for isolating material, lighting, geometry,
and state ideas. The accessible React component, its shared tokens, and its
interaction behaviour remain the product and source of truth. Generated images
must never be treated as functioning controls.

The public `gummyui` repository contains only open-source product source. Paid
Pro block, template, and design source remains exclusively in the private
`gummyui-pro` repository and must never enter the public repository, even
temporarily.

## Stage 1 founder review — July 2026

The first implementation checkpoint was rejected as too dark, too opaque, and
too close to the visual mean of playful SaaS products. It used rounded geometry,
gradients, and soft shadows, but did not communicate a convincing gummy material.

Fresh review of the Pinterest references, translucent gummy photography,
inflated typography, and physical gel experiments clarified the missing idea:
**Gummy is defined by transmitted light, not merely reflected gloss.** The visual
system must lead with a luminous centre, a saturated colour rim, slight internal
clouding, a small hard highlight, and a soft colour-cast shadow. It should feel
soft and chewy rather than like glass, clay, plastic, or a standard gradient.

“Gel Pop” remains the internal name for the design language, but customer-facing
visual proofs should lead with **Gummy**. The name must never become a reason to
make the product feel less gummy.

## Brand attributes

- Fresh, not nostalgic
- Tactile, not ornamental
- Colourful, not childish
- Clean, not sterile
- Expressive, not chaotic
- Recognisable, not restrictive

## Visual rules

### Surfaces

- Page canvases stay high-key, clean, and lightly warm so transmitted colour is
  visible. Light mode is the primary art direction.
- Primary actions and selected states receive the strongest gummy treatment:
  luminous centres, saturated rims, and a small specular highlight.
- Large content surfaces use a restrained milky finish with a faint colour cast
  rather than dark opacity or heavy blur.
- Dense tables and form layouts prioritise readability over material effects.
- Dark mode uses a chromatic plum canvas and brighter local gummy surfaces. It
  must not turn the whole identity into a dark interface.

### Geometry

- Controls use inflated capsule or soft-square silhouettes with subtly uneven
  corner pressure; perfect generic pills are not the default.
- Cards use 24–32px radii depending on size.
- Small controls use 12–18px radii.
- Organic asymmetry is reserved for decorative accents and hero compositions.

### Light and depth

- Every strong gummy surface has five readable layers: a translucent luminous
  centre, saturated rim, slight internal clouding, a narrow hard highlight, and
  a coloured diffused shadow.
- Highlights are small and asymmetrical. A uniform white border reads as glass,
  not gummy.
- A colour-matched internal lower meniscus gives the impression of chewy
  thickness. It must not become a hard shelf pasted beneath a compact element.
- Shadows are chromatic and diffused; black or aubergine shadows cannot dominate.
- Overlap may create richer transmitted colour, but translucency must never
  reduce text or icon contrast. Text sits on an optically stable inner layer.
- Pearlescent shifts are reserved for hero art, promotional badges, and rare
  premium states rather than ordinary form controls.

### Colour

The foundation palette will start with:

- Ink: deep aubergine rather than pure black
- Canvas: warm off-white
- Raspberry: primary action
- Grape: secondary action and focus
- Lime: success and energetic accent
- Tangerine: warning and promotional accent
- Aqua: informational accent
- Ice blue: a cooler informational and dark-mode optical accent

Colour families will be expressed as OKLCH tokens so lightness and contrast can
be controlled consistently.

The reference palette is deliberately brighter than the first checkpoint.
Raspberry, grape, lime, tangerine, and aqua should read as backlit fruit colour,
not muted corporate accents. Deep aubergine remains an ink colour, not a page
colour in the primary light experience.

### Typography

- Display type: expressive grotesk with soft, unusual shapes
- Interface type: highly legible sans serif
- Code: neutral monospace
- Headlines can feel inflated through weight and tight spacing; body text stays flat.

### Motion

- Hover: a small lift plus a highlight and transmitted-light shift
- Press: 2px downward movement, visible horizontal squash, and reduced thickness
- Release: a quick chewy rebound with no prolonged or decorative bounce
- Loading: soft pulse or travelling highlight
- Reduced-motion mode removes squash and spring effects

### Recognition test

A reference component is not ready to scale unless it passes all three checks:

1. In isolation and without the Gummy UI wordmark, it still reads as a gummy
   material rather than a generic rounded component.
2. Its silhouette, lighting, or interaction contains at least one repeatable
   Gummy signature that can be recognised across component categories.
3. Removing the glossy highlight does not reveal an otherwise standard
   shadcn-style component with decorative colour applied on top.

### Accessibility

- Text contrast is measured independently of translucent decoration.
- Keyboard focus remains obvious on every colour through an integrated material
  change and attached shape cue; detached outlines are avoided on the new Group
  1 components.
- Colour is never the sole indicator of state.
- Decorative highlights ignore pointer events.
- Motion is restrained and disabled for reduced-motion users.

## What Gummy UI is not

- Generic glassmorphism
- Neumorphism with low-contrast controls
- A Candy Crush-style game kit
- A collection of 3D renders pretending to be application controls
- Pastel decoration applied to standard shadcn components

## Stage 1A Button pilot

The Button is the first and only active material proof. Its art-direction inputs
are:

- the approved [Gummy material direction](research/concepts/gummy-material-direction-imagegen-01.png);
  and
- the focused [Button state reference sheet](research/concepts/gummy-button-states-imagegen-01.png).

The built-in ImageGen prompt is recorded beside the references in
[`gummy-button-states-imagegen-01.prompt.md`](research/concepts/gummy-button-states-imagegen-01.prompt.md).

The reference sheet shows one Button at rest, hover, keyboard focus,
pressed/squashed, loading, and disabled. Implementation must reproduce the
underlying physics in React and CSS: the pressed state becomes clearly wider
and shorter, its colour-matched lower thickness compresses, and release has a
quick chewy rebound. The highlight must follow the changing component geometry
and may not be a pasted-on white capsule.

### Founder feedback on the first Button Lab

The overall Button material and the live press/rebound interaction are approved
in direction. The static, permanently flattened `Pressed / squashed` specimen
is not: freezing the most compressed frame makes the component look thin and
less gummy than the interaction feels.

The Lab replaces that frozen specimen with a **High-transmission** finish. It
may borrow glassmorphism-level optical transmission so underlying colour is
genuinely visible, but it must retain Gummy signatures: fruit tint, a saturated
rim, colour-matched thickness, geometry-following highlight, stable dark label,
and the same chewy press/release physics. This is a controlled material finish,
not permission to turn the wider system into generic glassmorphism.

The founder approved the Button on 22 July 2026. Classic Gummy is the default
finish, High-transmission is an optional finish, and the live press/rebound
physics are the locked interaction reference.

Stage 1B Group 1 is Input, Badge, and Card. The founder accepted it provisionally
for sequencing on 22 July 2026 while keeping it open to later refinement.
Switch, Tabs, Dropdown Menu, and Dialog now form Group 2. The SaaS hero, pricing,
dashboard, public marketing page, registry, and all catalogue work remain paused
until Group 2 is reviewed.

## Stage 1B Group 1 material translation

The selected [Input, Badge, and Card reference sheet](research/concepts/gummy-input-badge-card-imagegen-01.png)
extends the approved Button family without treating every surface as an action.
Its exact built-in ImageGen prompt is recorded in
[`gummy-input-badge-card-imagegen-01.prompt.md`](research/concepts/gummy-input-badge-card-imagegen-01.prompt.md).
The focused [Badge material and motion study](research/concepts/gummy-badge-material-motion-imagegen-01.png)
and its [exact prompt](research/concepts/gummy-badge-material-motion-imagegen-01.prompt.md)
refine the compact component around physical gel mass rather than generic
rounded-box styling.

The second focused studies are now authoritative where Badge and Card art
direction has moved on: [Badge gel pebble iteration 02](research/concepts/gummy-badge-pebble-imagegen-02.png)
with its [exact prompt](research/concepts/gummy-badge-pebble-imagegen-02.prompt.md),
and [Card gel-pocket frame iteration 02](research/concepts/gummy-card-pocket-frame-imagegen-02.png)
with its [exact prompt](research/concepts/gummy-card-pocket-frame-imagegen-02.prompt.md).

The Card sheet is implemented as a visual contract. Its continuous concave
frame, fused icon well, inset reading plane, lower-end reservoir, metrics row,
and restrained footer action are required anatomy rather than illustrative
flourishes. The live implementation uses a decorative responsive SVG behind
native HTML content so it can reproduce that geometry without turning the Card
into a bitmap or weakening its semantics.

The cross-component optical pass follows the interactive-focus Card: lower-
alpha coloured shells, bright internal meniscus lines, small attached material
pools, and a calm legible plane. The Card icon is only a mark placed on its own
upper-start reservoir—never a second Badge. High-transmission Button uses the
clearer aqua optical shell and internal pool from the earlier approved pass
without altering the locked Classic Gummy finish; selected translucent Badges
use the compact version; Input keeps the glass in its shell and a frosted milky
centre beneath editable text.

Dark-theme translucent Badges switch their label to warm near-white rather than
placing aubergine text over the transmitted dark canvas. Input shells use the
same optical recipe as the approved glass-fruit Badges—small local glint,
asymmetric bright meniscus, cloudy lower-end colour pool, and no detached
shadow—while their inner editing plane remains calmer and more opaque than a
Badge.

The Card frame is measured geometry, not a uniformly stretched illustration.
Its upper-start icon chamber and lower-end reservoir retain stable physical
dimensions as the Card widens; only the thin connecting perimeter and reading
plane grow. Header spacing reserves the icon chamber's full footprint. The
high-transmission Button keeps its internal material pool within a single
asymmetric silhouette; it does not use the later pocket-frame experiment or a
separately outlined circle.

- **Input:** calm warm-milky centre, shallow coloured lower depth, and a small
  upper highlight that follows the field silhouette. Focus slightly plumps the
  field and reveals an attached label glint, keeping the indicator unmistakable
  without any detached outline; error and success add icon-plus-text feedback.
- **Badge:** one compact asymmetric gel pebble with stable aubergine text. Solid
  is the default and a restrained high-transmission finish is allowed. Neutral
  remains milky; semantic fruit variants retain a pressure-uneven perimeter
  whose ends do not mirror each other. It must not resolve into a perfect pill,
  rounded rectangle, pasted-on lobe, or outlined chip. Depth comes from internal
  colour pooling and a lower meniscus, never a hard exterior shelf, rainbow
  stripe, or drop shadow. A quick settle moves through rest, lean, squash,
  wobble, and recovery while the local glint and internal clouding follow the
  mass. Default `alive` mode repeats that deformation quietly so the material
  does not feel frozen; one-shot, static, and reduced-motion modes remain
  available. Non-interactive Badges never react to hover.
- **Card:** a quiet frosted reading plane held inside a recognisable gel-pocket
  frame. The perimeter is thin across most edges but pools visibly into attached
  upper-start and lower-end reservoirs, giving the Card a signature distinct
  from a generic white panel or giant Button. Elevation plumps and lifts this
  connected frame without adding a hard shadow shelf. Selection transmits
  raspberry through the pocket; keyboard focus on a real link or button moves
  aqua into the corner reservoirs, deforms the connected frame, and adds a tiny
  attached title glint. Neither state draws a surrounding outline.

Input and Card do not expose a high-transmission finish in this group: see-through
editing and reading planes would work against stable legibility. Their geometry
still carries the five Gummy signatures at lower intensity. Badge may transmit
more light because the label is short and sits on an independently stable layer.

## Stage 1B Group 2 material translation

The [Switch, Tabs, Dropdown Menu, and Dialog reference sheet](research/concepts/gummy-switch-tabs-menu-dialog-imagegen-01.png)
is the focused art-direction contract for the remaining canonical interactions.
Its [exact prompt](research/concepts/gummy-switch-tabs-menu-dialog-imagegen-01.prompt.md)
is stored beside it.

- **Switch:** a pressure-shaped transmitting track and an attached fruit-glass
  thumb. Checked lime and keyboard-focus aqua are material redistributions, not
  exterior borders. The silhouette deliberately avoids the generic iOS pill.
- **Tabs:** one continuous warm-milky gel rail. The selected pool moves beneath
  the active label while the text remains stable; inactive tabs are clear areas
  in the shared rail rather than separate chips.
- **Dropdown Menu:** the focused [Dropdown Menu material study](research/concepts/gummy-dropdown-menu-imagegen-02.png)
  supersedes the generic edge treatment. Its [exact prompt](research/concepts/gummy-dropdown-menu-imagegen-02.prompt.md)
  is stored beside it. The trigger is one irregular milk-glass mass with an
  attached grape reservoir; the popup is a transmitting, softly wavy membrane
  with connected bridge and reservoir volumes. Selection and keyboard focus
  move as raspberry and aqua tides inside that material—never as exterior
  outlines or detached decoration.
- **Dialog:** a compact frosted plane held by a raspberry gel-pocket perimeter.

The focused [Input, Tabs, and Dialog material study 02](research/concepts/gummy-input-tabs-dialog-imagegen-02.png)
and its [exact prompt](research/concepts/gummy-input-tabs-dialog-imagegen-02.prompt.md)
set the final cross-family quality bar: the approved Switch's connected body,
optical depth, and internal state tides must carry through all three components.
  The title, description, and actions remain calm and legible. Focus adds an aqua
  internal meniscus rather than a detached outline.

All four components use Base UI interaction primitives beneath Gummy-owned
wrappers. Their public source therefore includes keyboard behaviour, focus
management, dismissal, labelling, and reduced-motion treatment rather than
leaving those concerns to each consumer.
