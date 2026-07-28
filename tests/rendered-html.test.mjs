import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Stage 1C product composition", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="en"/i);
  assert.match(html, /<title>Gummy UI · Deliberately designed React components<\/title>/i);
  assert.match(html, /Make vibe-coded products feel deliberately designed/);
  assert.match(html, /Northstar/);
  assert.match(html, /Distinctive at product density/);
  assert.match(html, /Open source/);
  assert.match(html, /Gummy UI Pro/);
  assert.match(html, /From \$49/i);
  assert.match(html, /Start building/);
  assert.match(html, /57/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("keeps the searchable catalogue and complete canonical Component Lab on their dedicated routes", async () => {
  const [catalogueResponse, labResponse] = await Promise.all([
    render("/components"),
    render("/components/lab"),
  ]);
  assert.equal(catalogueResponse.status, 200);
  assert.equal(labResponse.status, 200);
  const catalogueHtml = await catalogueResponse.text();
  const html = await labResponse.text();
  assert.match(catalogueHtml, /deliberate foundations/);
  assert.match(catalogueHtml, /57 open-source React component categories/);
  assert.match(catalogueHtml, /Browse components/);
  assert.match(catalogueHtml, /\/components\/calendar/);
  for (const label of [
    "Gummy Label",
    "Gummy Field",
    "Gummy Textarea",
    "Gummy Checkbox",
    "Gummy Radio Group",
    "Gummy Native Select",
    "Gummy Input",
    "Gummy Badge",
    "Gummy Card",
    "Gummy Switch",
    "Gummy Tabs",
    "Gummy Dropdown Menu",
    "Gummy Dialog",
    "Canonical Button",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /A calm, realistic form/);
  assert.match(html, /gummy-stage3-form-controls-imagegen-01\.webp/);
});

test("keeps all canonical components independent from the composition and Lab pages", async () => {
  const [
    page,
    cataloguePage,
    labPage,
    lab,
    button,
    input,
    badge,
    card,
    switchSource,
    tabs,
    menu,
    dialog,
    label,
    field,
    textarea,
    checkbox,
    radioGroup,
    nativeSelect,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/lab/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ComponentLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyButton.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyInput.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyBadge.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummySwitch.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyTabs.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyDropdownMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyDialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyLabel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyField.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyTextarea.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyCheckbox.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyRadioGroup.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyNativeSelect.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /import \{ CompositionShowcase \}/);
  assert.match(cataloguePage, /import \{ CatalogueSearch \}/);
  assert.doesNotMatch(cataloguePage, /ComponentLab/);
  assert.match(labPage, /import \{ ComponentLab \}/);
  assert.doesNotMatch(page, /function Gummy|<button|<input/);
  for (const name of [
    "GummyButton",
    "GummyInput",
    "GummyBadge",
    "GummyCard",
    "GummySwitch",
    "GummyTabs",
    "GummyDropdownMenu",
    "GummyDialog",
    "GummyLabel",
    "GummyField",
    "GummyTextarea",
    "GummyCheckbox",
    "GummyRadioGroup",
    "GummyNativeSelect",
  ]) {
    assert.match(lab, new RegExp(`from "\\./ui/${name}"`));
  }
  for (const source of [
    button,
    input,
    badge,
    card,
    switchSource,
    tabs,
    menu,
    dialog,
    label,
    field,
    textarea,
    checkbox,
    radioGroup,
    nativeSelect,
  ]) assert.match(source, /React\.forwardRef/);
  assert.match(input, /<input/);
  assert.match(label, /<label/);
  assert.match(field, /React\.cloneElement/);
  assert.match(textarea, /<textarea/);
  assert.match(checkbox, /type="checkbox"/);
  assert.match(radioGroup, /<fieldset/);
  assert.match(radioGroup, /type="radio"/);
  assert.match(nativeSelect, /<select/);
  assert.match(badge, /<span/);
  assert.match(card, /<article/);
  assert.match(card, /<a/);
  assert.match(card, /<button/);
  assert.doesNotMatch(card, /onClick.*<div|<div.*onClick/);
});

test("encodes required state, theme, touch, focus, motion, RTL, and responsive rules", async () => {
  const [lab, globals, buttonCss, themeCss, formCss, compositionCss, card, switchSource, tabs, menu, dialog] = await Promise.all([
    readFile(new URL("../app/components/ComponentLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/gummy-button.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/gummy-theme.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/gummy-form-controls.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/compositions.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummySwitch.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyTabs.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyDropdownMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ui/GummyDialog.tsx", import.meta.url), "utf8"),
  ]);
  const css = [themeCss, globals, buttonCss, formCss, compositionCss].join("\n");

  for (const state of ["Empty", "Placeholder", "Filled", "Hover", "Keyboard focus", "Error", "Success", "Disabled", "Read only"]) {
    assert.match(lab, new RegExp(state));
  }
  for (const variant of ["neutral", "primary", "secondary", "success", "warning", "info"]) {
    assert.match(lab, new RegExp(`"${variant}"`));
  }
  for (const cardState of ["Default passive · article", "Elevated passive · article", "Selected · article", "Interactive focus · link", "Dense content · responsive"]) {
    assert.match(lab, new RegExp(cardState));
  }
  for (const formState of [
    "Hover",
    "Keyboard focus",
    "Validation",
    "Disabled",
    "Read only",
    "Dense content",
    "RTL",
    "Checked / active",
    "Indeterminate",
  ]) {
    assert.match(lab, new RegExp(formState));
  }

  assert.match(lab, /window\.localStorage\.setItem\("gummy-theme"/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /\.gummy-input__control:has\(\.gummy-input__field:focus-visible\)/);
  assert.match(css, /\.gummy-card--interactive:focus-visible/);
  assert.match(lab, /gummy-card--preview-focus/);
  assert.match(css, /\.gummy-card__frame-shell/);
  assert.match(css, /\.gummy-card__frame-plane/);
  assert.match(css, /\.gummy-card__frame-reservoir/);
  assert.match(css, /\.gummy-card__icon-well/);
  assert.match(css, /\.gummy-card__icon/);
  assert.match(css, /\.source-viewer pre code\s*\{[^}]*background:\s*transparent[^}]*color:\s*oklch\(0\.94 0\.012 305\)/s);
  assert.match(card, /GummyCardIcon/);
  assert.match(card, /ResizeObserver/);
  assert.match(css, /@keyframes gummy-card-svg-focus/);
  assert.match(css, /@keyframes gummy-card-svg-reservoir/);
  assert.match(css, /--input-shell-light/);
  assert.match(css, /\.gummy-input__control::after/);
  assert.match(css, /\.gummy-input__message-mark/);
  assert.match(css, /\.gummy-button\[data-finish="translucent"\]:focus-visible/);
  assert.match(css, /:root\[data-theme="dark"\] \.gummy-button\[data-finish="translucent"\]/);
  assert.match(css, /\.gummy-button\[data-finish="translucent"\]:not\(:disabled\):active \.gummy-button__body::after/);
  assert.match(css, /:root\[data-theme="dark"\] \.gummy-badge\[data-finish="translucent"\]/);
  assert.match(css, /:root\[data-theme="dark"\] \.gummy-card\[data-selected="true"\]/);
  assert.match(css, /@keyframes gummy-badge-settle/);
  assert.match(css, /@keyframes gummy-badge-alive/);
  assert.match(css, /@keyframes gummy-badge-content-settle/);
  assert.match(css, /@keyframes gummy-badge-content-alive/);
  assert.match(css, /\.gummy-badge\[data-motion="alive"\]/);
  assert.match(css, /\.gummy-badge\[data-motion="settle"\]/);
  assert.doesNotMatch(lab, /transmission-stage/);
  assert.doesNotMatch(css, /\.transmission-stage/);
  assert.match(lab, /gummy-badge-pebble-imagegen-02\.webp/);
  assert.match(lab, /gummy-card-pocket-frame-imagegen-02\.webp/);
  assert.match(lab, /gummy-switch-tabs-menu-dialog-imagegen-01\.webp/);
  assert.match(lab, /gummy-dropdown-menu-imagegen-02\.webp/);
  assert.match(lab, /gummy-input-tabs-dialog-imagegen-02\.webp/);
  assert.match(css, /\.gummy-switch\[data-checked\]/);
  assert.match(css, /\.gummy-tabs__indicator/);
  assert.match(css, /\.gummy-menu__trigger-pool/);
  assert.match(css, /\.gummy-menu__bridge/);
  assert.match(css, /\.gummy-menu__reservoir/);
  assert.match(css, /\.gummy-menu__item-tide/);
  assert.match(css, /\.gummy-dialog__reservoir--end/);
  assert.match(switchSource, /Switch\.Root/);
  assert.match(tabs, /activateOnFocus/);
  assert.match(menu, /Menu\.Positioner/);
  assert.match(dialog, /Dialog\.Viewport/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /\.site-nav a:nth-child\(n\s*\+\s*5\)/);
  assert.match(css, /\.site-nav a:nth-child\(n\s*\+\s*3\)/);
  assert.match(css, /min-width:\s*320px/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /\.gummy-field__control-shell/);
  assert.match(css, /\.gummy-textarea__pool/);
  assert.match(css, /\.gummy-checkbox__input:checked \+ \.gummy-checkbox__indicator/);
  assert.match(css, /\.gummy-radio-item__input:focus-visible/);
  assert.match(css, /\.gummy-native-select__chevron/);
  assert.match(css, /\[dir="rtl"\] \.gummy-native-select__pool/);
  assert.match(css, /\.gummy-field\[data-read-only\]/);
  assert.match(css, /\.gummy-checkbox\[data-invalid\]/);
  assert.match(css, /\.gummy-radio-group\[data-disabled\]/);
});

test("server-renders complete Stage 3 documentation and install guidance", async () => {
  const response = await render("/docs");
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const label of [
    "Form foundations",
    "Label",
    "Field",
    "Textarea",
    "Checkbox",
    "Radio Group",
    "Native Select",
    "Accessibility contract",
    "States and input methods",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /gummy-base\.json/);
  assert.match(html, /gummy-button\.json/);
  assert.match(html, /categories, one manifest/);
  assert.match(html, /Browse the component catalogue/);
});

test("loads large component styles only on routes that render them", async () => {
  const [
    homeResponse,
    componentsResponse,
    docsResponse,
    rtlResponse,
    studioResponse,
    themesResponse,
  ] = await Promise.all([
    render("/"),
    render("/components"),
    render("/docs"),
    render("/rtl"),
    render("/studio"),
    render("/themes"),
  ]);
  const [home, components, docs, rtl, studio, themes] = await Promise.all([
    homeResponse.text(),
    componentsResponse.text(),
    docsResponse.text(),
    rtlResponse.text(),
    studioResponse.text(),
    themesResponse.text(),
  ]);

  assert.doesNotMatch(home, /\/styles\/gummy-(?:form-controls|primitives)\.css/);
  assert.match(components, /\/styles\/gummy-form-controls\.css/);
  assert.match(components, /\/styles\/gummy-primitives\.css/);
  assert.match(components, /\/styles\/component-inspector\.css/);
  assert.match(docs, /\/styles\/gummy-form-controls\.css/);
  assert.doesNotMatch(docs, /\/styles\/gummy-primitives\.css/);
  assert.match(rtl, /\/styles\/gummy-primitives\.css/);
  assert.match(themes, /\/styles\/gummy-primitives\.css/);
  assert.match(studio, /\/styles\/frame-studio\.css/);
});

test("builds a shadcn-compatible registry payload for every Stage 3 component", async () => {
  const names = [
    "gummy-label",
    "gummy-field",
    "gummy-textarea",
    "gummy-checkbox",
    "gummy-radio-group",
    "gummy-native-select",
  ];
  for (const name of names) {
    const payload = JSON.parse(
      await readFile(new URL(`../public/r/${name}.json`, import.meta.url), "utf8"),
    );
    assert.equal(payload.name, name);
    assert.equal(payload.type, "registry:ui");
    assert.ok(Array.isArray(payload.files) && payload.files.length > 0);
    assert.ok(
      Array.isArray(payload.registryDependencies) &&
        payload.registryDependencies.length > 0,
    );
  }
});

test("routes static assets through the security-header worker", async () => {
  const workerConfig = JSON.parse(
    await readFile(new URL("../dist/server/wrangler.json", import.meta.url), "utf8"),
  );
  assert.equal(workerConfig.assets?.binding, "ASSETS");
  assert.equal(workerConfig.assets?.run_worker_first, true);
});

test("serves static assets through the worker with security headers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  let assetRequests = 0;

  const response = await worker.fetch(
    new Request("https://gummyui.dev/styles/gummy-primitives.css"),
    {
      ASSETS: {
        fetch: async () => {
          assetRequests += 1;
          return new Response("body { color: rebeccapurple; }", {
            headers: { "content-type": "text/css" },
          });
        },
      },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(assetRequests, 1);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "body { color: rebeccapurple; }");
  assert.match(
    response.headers.get("content-security-policy") ?? "",
    /default-src 'self'/,
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
