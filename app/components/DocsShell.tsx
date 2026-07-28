"use client";

import Link from "next/link";
import { GummyButton } from "./ui/GummyButton";
import { GummyCheckbox } from "./ui/GummyCheckbox";
import { GummyField } from "./ui/GummyField";
import { GummyNativeSelect } from "./ui/GummyNativeSelect";
import {
  GummyRadioGroup,
  GummyRadioItem,
} from "./ui/GummyRadioGroup";
import { GummyTextarea } from "./ui/GummyTextarea";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { componentCount } from "../data/catalogue";

const installCommand = "npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json";

const formFoundations = [
  {
    name: "Label",
    anatomy: "Native label · stable copy · state meta",
    api: "required, optional, disabled, readOnly, meta",
    guidance: "Use a visible label for every editable control. Keep instructions in a description.",
  },
  {
    name: "Field",
    anatomy: "Root · Label · connected shell · control · messages",
    api: "label, description, errorMessage, successMessage, orientation, density",
    guidance: "Use for one native or custom control when Field should compose all accessibility IDs.",
  },
  {
    name: "Textarea",
    anatomy: "Label · stable multiline plane · attached pool · support row",
    api: "label, resize, showCount, description, errorMessage, successMessage",
    guidance: "Use for genuinely multiline input. Set a maximum length only when the product has a real limit.",
  },
  {
    name: "Checkbox",
    anatomy: "Native input · 44px target · indicator · copy · feedback",
    api: "label, description, indeterminate, readOnly, onCheckedChange",
    guidance: "Use for independent choices. Use Switch for immediate settings and Radio Group for one-of-many choices.",
  },
  {
    name: "Radio Group",
    anatomy: "Fieldset · legend · group description · native radio items · feedback",
    api: "value, defaultValue, onValueChange, orientation, required, readOnly",
    guidance: "Use when every option should remain visible and exactly one choice is expected.",
  },
  {
    name: "Native Select",
    anatomy: "Label · native select · attached chevron reservoir · feedback",
    api: "label, description, errorMessage, successMessage, readOnly",
    guidance: "Use for compact platform-native picking. Use a custom Select only when richer option content is necessary.",
  },
] as const;

export function DocsShell() {
  function copyInstall() {
    void navigator.clipboard?.writeText(installCommand);
  }

  return (
    <>
      <a className="skip-link" href="#docs-main">Skip to documentation</a>
      <SiteHeader />
      <div className="docs-layout">
        <aside className="docs-sidebar" aria-label="Documentation navigation">
          <p>Get started</p>
          <nav>
            <a href="#installation">Installation</a>
            <Link href="/docs/nextjs">Next.js guide</Link>
            <Link href="/docs/vite">Vite guide</Link>
            <Link href="/docs/editor-setup">Editor setup</Link>
            <Link href="/docs/troubleshooting">Troubleshooting</Link>
            <a href="#tokens">Theme tokens</a>
            <a href="#catalogue">Complete catalogue</a>
            <a href="#form-foundations">Form foundations</a>
            <a href="#button">Button family</a>
            <a href="#quality">Quality standard</a>
            <a href="#contributing">Contributing</a>
          </nav>
          <Link className="docs-sidebar__lab" href="/components/lab">Open Component Lab <span aria-hidden="true">↗</span></Link>
        </aside>
        <main className="docs-main" id="docs-main">
          <header className="docs-hero">
            <p className="showcase-kicker">Gummy UI documentation</p>
            <h1>Install source you can understand.</h1>
            <p>The registry copies readable React, TypeScript, and CSS into your project. All {componentCount} public categories use native or Base UI behavior, with Radix UI counterparts for all 22 applicable families; Gummy UI owns material anatomy and motion.</p>
          </header>

          <section className="docs-section" id="installation">
            <div className="docs-section__eyebrow">01 · Installation</div>
            <h2>Add the base and one component.</h2>
            <p>Start with the semantic theme and canonical Button in a clean shadcn-compatible application. Every other component declares its shared styles and component dependencies automatically.</p>
            <div className="docs-code"><code>{installCommand}</code><GummyButton size="small" variant="secondary" onClick={copyInstall}>Copy</GummyButton></div>
            <div className="docs-callout"><strong>No runtime package lock-in.</strong><span>The generated files live in your application and can be changed normally.</span></div>
          </section>

          <section className="docs-section" id="tokens">
            <div className="docs-section__eyebrow">02 · Theme architecture</div>
            <h2>Semantic tokens, fruit families.</h2>
            <p>Components use stable semantic canvas, surface, ink, focus, and fruit variables. Dark mode changes the environment while keeping material identities intact.</p>
            <div className="token-grid">
              {[['Canvas','--canvas'],['Raspberry','--fruit-raspberry-core'],['Grape','--fruit-grape-core'],['Lime','--fruit-lime-core'],['Tangerine','--fruit-tangerine-core'],['Aqua','--fruit-aqua-core']].map(([name, token]) => <div key={token}><span style={{ background: `var(${token})` }} /><strong>{name}</strong><code>{token}</code></div>)}
            </div>
          </section>

          <section className="docs-section" id="catalogue">
            <div className="docs-section__eyebrow">03 · Public catalogue</div>
            <h2>{componentCount} categories, one manifest.</h2>
            <p>The searchable index, detail routes, install commands, registry URLs, machine-readable API, sitemap, and agent index all derive from the same catalogue source.</p>
            <div className="docs-callout"><strong>Explore by task.</strong><span><Link href="/components">Browse the component catalogue</Link>, tune <Link href="/themes">theme tokens</Link>, verify <Link href="/rtl">RTL behavior</Link>, or inspect the <Link href="/registry">registry index</Link>.</span></div>
          </section>

          <section className="docs-section" id="form-foundations">
            <div className="docs-section__eyebrow">04 · Stage 3 group 01</div>
            <h2>Calm forms, connected material.</h2>
            <p>These components use native browser semantics wherever possible. Labels, descriptions, validation messages, and editing content stay optically stable; the connected gel edge communicates hierarchy, focus, selection, success, and error.</p>
            <div className="docs-form-example" role="group" aria-label="Form foundation examples">
              <GummyField label="Workspace name" description="Shown in navigation and invitations." required>
                <input name="docs-workspace-name" defaultValue="GrapeLab" />
              </GummyField>
              <GummyNativeSelect label="Data region" name="docs-region" defaultValue="eu" description="New project data is stored here.">
                <option value="eu">Europe · London</option>
                <option value="us">United States · Virginia</option>
              </GummyNativeSelect>
              <GummyTextarea label="Project summary" name="docs-summary" defaultValue="A focused workspace for design-system reviews and release decisions." maxLength={140} showCount />
              <GummyRadioGroup label="Default visibility" name="docs-visibility" defaultValue="team" orientation="horizontal">
                <GummyRadioItem value="team" label="Team only" />
                <GummyRadioItem value="invite" label="Invite only" />
                <GummyRadioItem value="public" label="Public" />
              </GummyRadioGroup>
              <GummyCheckbox label="Weekly delivery digest" description="One calm summary every Friday." defaultChecked />
            </div>
            <div className="docs-component-guides">
              {formFoundations.map((component) => (
                <article key={component.name}>
                  <h3>{component.name}</h3>
                  <dl>
                    <div><dt>Anatomy</dt><dd>{component.anatomy}</dd></div>
                    <div><dt>Core API</dt><dd><code>{component.api}</code></dd></div>
                    <div><dt>Use it well</dt><dd>{component.guidance}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="docs-callout">
              <strong>Accessibility contract.</strong>
              <span>Visible labels and descriptions are associated by ID; validation uses aria-invalid and alert text; disabled states stay native; read-only Checkbox, Radio Group, and Native Select remain focusable but cannot change; focus is internal and non-colour-only.</span>
            </div>
            <div className="docs-callout">
              <strong>States and input methods.</strong>
              <span>Default, hover, focus, active or checked, mixed, validation, success, disabled, read-only, dense, RTL, dark theme, touch, and reduced-motion specimens are all available in the Component Lab.</span>
            </div>
          </section>

          <section className="docs-section" id="button">
            <div className="docs-section__eyebrow">05 · Material benchmark</div>
            <h2>Canonical Button.</h2>
            <p>The Button preserves stable text while the gel body expands, compresses, and rebounds. Every visual size keeps a minimum 44px touch target.</p>
            <div className="docs-button-stage">
              <GummyButton>Primary</GummyButton>
              <GummyButton variant="secondary">Secondary</GummyButton>
              <GummyButton variant="success">Success</GummyButton>
              <GummyButton variant="warning">Warning</GummyButton>
              <GummyButton variant="info" finish="translucent">High transmission</GummyButton>
            </div>
            <div className="docs-anatomy">
              <div><span>1</span><strong>Root</strong><p>Native button semantics and disabled state.</p></div>
              <div><span>2</span><strong>Gel body</strong><p>Material, highlight, thickness, and press physics.</p></div>
              <div><span>3</span><strong>Stable content</strong><p>Readable label and loading cue above the optical layer.</p></div>
            </div>
          </section>

          <section className="docs-section" id="quality">
            <div className="docs-section__eyebrow">06 · Repeatable quality bar</div>
            <h2>Every component ships as a system.</h2>
            <div className="quality-grid">
              {[
                ['Material continuity','Highlights follow geometry. Reservoirs grow from the same body; decorative blobs do not float nearby.'],
                ['Interaction','Keyboard, pointer, touch, disabled, loading, and reduced-motion paths are designed together.'],
                ['Accessibility','Native semantics, visible focus, readable contrast, and automated axe checks are release requirements.'],
                ['Responsive behavior','Content stays stable while flexible spans—not reservoirs—absorb width changes.'],
                ['Verification','Unit tests, rendered checks, type checking, lint, production build, and visual audits all pass.'],
              ].map(([title, copy]) => <article key={title}><strong>{title}</strong><p>{copy}</p></article>)}
            </div>
          </section>

          <section className="docs-section" id="contributing">
            <div className="docs-section__eyebrow">07 · Contribution contract</div>
            <h2>Keep the behavior boring. Make the material excellent.</h2>
            <p>Start from the native element or Base UI primitive, document public anatomy, use shared tokens, keep decoration hidden from assistive technology, and prove every state in the Component Lab before adding a registry entry.</p>
            <GummyButton onClick={() => { window.location.href = "/components"; }}>Review the component family</GummyButton>
          </section>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
