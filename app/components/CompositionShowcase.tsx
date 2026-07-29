"use client";

import * as React from "react";
import { GummyBadge } from "./ui/GummyBadge";
import { GummyButton } from "./ui/GummyButton";
import {
  GummyCard,
  GummyCardContent,
  GummyCardDescription,
  GummyCardFooter,
  GummyCardHeader,
  GummyCardIcon,
  GummyCardTitle,
} from "./ui/GummyCard";
import { GummyInput } from "./ui/GummyInput";
import { GummyTab, GummyTabPanel, GummyTabs, GummyTabsList } from "./ui/GummyTabs";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { StandaloneSwitchSpecimen } from "../../lib/presentation/StandaloneSwitchSpecimen";
import { componentCount } from "../data/catalogue";
import {
  proBlockCount,
  proDesignKitDefinitionCount,
  proTemplateCount,
} from "../data/pro-catalogue";

const metrics = [
  { label: "Shipped", value: "24", tone: "primary" as const },
  { label: "In review", value: "6", tone: "secondary" as const },
  { label: "At risk", value: "2", tone: "warning" as const },
];

function ProjectPulseCard({
  selected = false,
  headingLevel = 3,
}: {
  selected?: boolean;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}) {
  return (
    <GummyCard className="composition-project-card" selected={selected} elevation={selected ? "elevated" : "default"}>
      <GummyCardHeader>
        <GummyCardIcon aria-hidden="true"><span className="composition-pulse-icon">↗</span></GummyCardIcon>
        <div>
          <GummyCardTitle level={headingLevel}>Project pulse</GummyCardTitle>
          <GummyCardDescription>Weekly delivery is on track.</GummyCardDescription>
        </div>
      </GummyCardHeader>
      <GummyCardContent>
        <dl className="composition-metrics">
          {metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}
        </dl>
      </GummyCardContent>
      <GummyCardFooter><span>Updated 12 min ago</span><strong>Healthy cadence</strong></GummyCardFooter>
    </GummyCard>
  );
}

function HeroProduct() {
  return (
    <div
      className="hero-product"
      role="group"
      aria-label="Live Gummy UI product composition"
    >
      <div className="hero-product__bar">
        <div><span className="hero-product__brand-dot" aria-hidden="true" /><strong>Northstar</strong></div>
        <GummyBadge variant="success" dot motion="none">Live workspace</GummyBadge>
      </div>
      <GummyTabs defaultValue="overview" className="hero-product__tabs">
        <GummyTabsList aria-label="Workspace sections">
          <GummyTab value="overview">Overview</GummyTab>
          <GummyTab value="activity">Activity</GummyTab>
          <GummyTab value="team">Team</GummyTab>
        </GummyTabsList>
        <GummyTabPanel value="overview">
          <div className="hero-product__summary">
            <div><span>Momentum</span><strong>+18%</strong><small>this week</small></div>
            <div><span>On track</span><strong>92%</strong><small>of work</small></div>
          </div>
          <ProjectPulseCard selected headingLevel={2} />
        </GummyTabPanel>
        <GummyTabPanel value="activity"><p className="hero-product__message">Six deliverables moved forward today, with no blocked reviews.</p></GummyTabPanel>
        <GummyTabPanel value="team"><p className="hero-product__message">Nine collaborators are active across three launch workstreams.</p></GummyTabPanel>
      </GummyTabs>
    </div>
  );
}

function SortMenu() {
  const [sort, setSort] = React.useState("Newest");
  return (
    <label className="dashboard-sort">
      <span>Sort projects</span>
      <select value={sort} onChange={(event) => setSort(event.target.value)}>
        {["Newest", "Oldest", "Most active"].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function DashboardComposition() {
  return (
    <div className="dashboard-composition">
      <aside className="dashboard-sidebar" aria-label="Dashboard example navigation">
        <div className="dashboard-sidebar__brand"><span aria-hidden="true">n</span><strong>Northstar</strong></div>
        <nav>
          <a className="is-active" href="#dashboard">Overview</a>
          <a href="#dashboard">Projects</a>
          <a href="#dashboard">Reports</a>
          <a href="#dashboard">People</a>
        </nav>
        <GummyBadge variant="info" finish="translucent" motion="none">Beta workspace</GummyBadge>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-main__header">
          <div><p>Monday, 22 July</p><h2>Good morning, Ava.</h2></div>
          <SortMenu />
        </header>
        <div className="dashboard-toolbar">
          <GummyInput label="Search projects" name="dashboard-search" placeholder="Search by name" />
          <GummyButton size="small">New project</GummyButton>
        </div>
        <div className="dashboard-grid">
          <ProjectPulseCard selected />
          <GummyCard className="composition-side-card">
            <GummyCardHeader>
              <GummyCardIcon aria-hidden="true"><span className="composition-pulse-icon">◎</span></GummyCardIcon>
              <div><GummyCardTitle>Team rhythm</GummyCardTitle><GummyCardDescription>Small signals, kept visible.</GummyCardDescription></div>
            </GummyCardHeader>
            <GummyCardContent>
              <div className="rhythm-list">
                <div><span>Weekly digest</span><StandaloneSwitchSpecimen label="Weekly digest" defaultChecked /></div>
                <div><span>Launch review</span><GummyBadge variant="warning" motion="none">Tomorrow</GummyBadge></div>
                <div><span>Design system</span><GummyBadge variant="success" dot motion="none">Ready</GummyBadge></div>
              </div>
            </GummyCardContent>
          </GummyCard>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ pro = false }: { pro?: boolean }) {
  return (
    <GummyCard className="plan-card" elevation={pro ? "elevated" : "default"} selected={pro}>
      <GummyCardHeader>
        <GummyCardIcon aria-hidden="true"><span className="composition-pulse-icon">{pro ? "✦" : "○"}</span></GummyCardIcon>
        <div>
          <GummyCardTitle>{pro ? "Gummy UI Pro" : "Open source"}</GummyCardTitle>
          <GummyCardDescription>{pro ? "Private products implemented locally; manual review and release remain open." : "The complete component foundation, MIT licensed."}</GummyCardDescription>
        </div>
      </GummyCardHeader>
      <GummyCardContent>
        <div className="plan-card__price">{pro ? <><strong>From $49</strong><span>monthly · yearly · lifetime</span></> : <><strong>MIT</strong><span>licensed source</span></>}</div>
        <ul>
          {(pro ? [`${proBlockCount} implemented original blocks`, `${proTemplateCount} implemented complete products`, `${proDesignKitDefinitionCount} implemented design-kit definitions`] : [`${componentCount} component categories`, "React and TypeScript source", "Light, dark, RTL, Base UI, and Radix UI"]).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </GummyCardContent>
      <GummyCardFooter>
        <GummyButton variant={pro ? "primary" : "secondary"} size="small" onClick={() => { window.location.href = pro ? "/pricing" : "/docs"; }}>
          {pro ? "See Pro pricing" : "Read installation"}
        </GummyButton>
      </GummyCardFooter>
    </GummyCard>
  );
}

export function CompositionShowcase() {
  return (
    <>
      <a className="skip-link" href="#showcase-main">Skip to content</a>
      <SiteHeader />
      <main id="showcase-main">
        <section className="showcase-hero" id="showcase">
          <div className="showcase-hero__copy">
            <GummyBadge variant="primary" finish="translucent" motion="settle">Open source · React · Base UI · Radix UI</GummyBadge>
            <p className="showcase-kicker">A tactile component system for serious products</p>
            <h1>Make vibe-coded products feel <em>deliberately designed.</em></h1>
            <p className="showcase-hero__lede">Gummy UI pairs clean SaaS structure with connected fruit-gel material, accessible behavior, and source you can actually edit.</p>
            <div className="showcase-actions">
              <GummyButton size="large" onClick={() => { window.location.href = "/docs"; }}>Start building</GummyButton>
              <GummyButton size="large" variant="info" finish="translucent" onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}>See it composed</GummyButton>
            </div>
            <dl className="showcase-trust">
              <div><dt>{componentCount}</dt><dd>free categories</dd></div>
              <div><dt>MIT</dt><dd>commercial use</dd></div>
              <div><dt>AA</dt><dd>accessibility target</dd></div>
            </dl>
          </div>
          <HeroProduct />
        </section>

        <section className="showcase-section showcase-section--dashboard" id="dashboard">
          <div className="showcase-section__heading">
            <div><p className="showcase-kicker">Composition proof 01</p><h2>Distinctive at product density.</h2></div>
            <p>
              The material creates hierarchy around real content. Reading planes stay calm; connected reservoirs and responsive motion carry the character. When evaluating Gummy UI, start with the workflow your customers repeat: navigation, search, status, selection, and a primary action. Replace the sample copy with realistic labels, then verify keyboard order, focus, narrow screens, RTL, dark mode, and reduced motion. The source stays in your repository, so teams can tune tokens and layout without wrapping product logic in a visual runtime. Component detail pages document the anatomy and behavior contract behind each specimen. Install only the categories a screen needs, keep application state outside presentation components, and review upgrades as ordinary source changes in version control before releasing them to customers.
            </p>
          </div>
          <DashboardComposition />
        </section>

        <section className="showcase-section showcase-section--plans" id="preview">
          <div className="showcase-section__heading">
            <div><p className="showcase-kicker">Open foundation, assembled outcomes</p><h2>Own the source. Move faster.</h2></div>
            <p>Use the free system without a black-box dependency. Pro pricing and commercial terms are approved; manual review, protected release, entitlement delivery and production publication remain open.</p>
          </div>
          <div className="plan-grid"><PlanCard /><PlanCard pro /></div>
        </section>

        <section className="showcase-cta">
          <div><GummyBadge variant="success" dot motion="none">Registry foundation ready</GummyBadge><h2>Start with the button that set the bar.</h2><p>Install the Gummy base and canonical Button source, then edit everything in your own application.</p></div>
          <div className="showcase-actions"><GummyButton size="large" onClick={() => { window.location.href = "/docs"; }}>Open the docs</GummyButton><GummyButton size="large" variant="secondary" onClick={() => { window.location.href = "/components"; }}>Inspect components</GummyButton></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
