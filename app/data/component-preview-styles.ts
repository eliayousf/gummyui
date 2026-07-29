export type ComponentPreviewStylesheet =
  | "/styles/gummy-core-components.css"
  | "/styles/gummy-form-controls.css"
  | "/styles/gummy-primitives.css";

const coreStyleSlugs = new Set([
  "badge",
  "card",
  "dialog",
  "dropdown-menu",
  "input",
  "switch",
  "tabs",
]);

const formStyleSlugs = new Set([
  "checkbox",
  "field",
  "label",
  "native-select",
  "radio-group",
  "textarea",
]);

export function getComponentPreviewStylesheet(
  slug: string,
): ComponentPreviewStylesheet | null {
  if (slug === "button") return null;
  if (coreStyleSlugs.has(slug)) {
    return "/styles/gummy-core-components.css";
  }
  if (formStyleSlugs.has(slug)) {
    return "/styles/gummy-form-controls.css";
  }
  return "/styles/gummy-primitives.css";
}
