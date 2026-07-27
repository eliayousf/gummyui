"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Switch } from "@base-ui/react/switch";
import { Tabs } from "@base-ui/react/tabs";

type GelButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  loading?: boolean;
};

function GelButton({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}: GelButtonProps) {
  return (
    <button
      className={`gel-button gel-button--${variant} ${className}`}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="gel-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function ThemeToggle() {
  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("gummy-theme");
    document.documentElement.dataset.theme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : "light";
  }, []);

  function toggleTheme() {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("gummy-theme", nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle light and dark theme"
    >
      <span className="theme-toggle__sun" aria-hidden="true">
        ☀
      </span>
      <span className="theme-toggle__moon" aria-hidden="true">
        ◐
      </span>
    </button>
  );
}

function MiniDashboard() {
  return (
    <div className="hero-product" aria-label="Mallow project dashboard preview">
      <div className="hero-product__topbar">
        <div className="mini-brand">
          <span className="mini-brand__mark">m</span>
          <span>Mallow</span>
        </div>
        <div className="avatar-stack" aria-label="3 teammates">
          <span>AO</span>
          <span>EL</span>
          <span>+1</span>
        </div>
      </div>
      <div className="hero-product__body">
        <div className="hero-product__title-row">
          <div>
            <p className="eyebrow">Launch workspace</p>
            <h2>Summer release</h2>
          </div>
          <span className="gel-badge gel-badge--lime">On track</span>
        </div>
        <div className="progress-label">
          <span>Weekly progress</span>
          <strong>76%</strong>
        </div>
        <div className="progress-track" aria-label="Weekly progress: 76 percent">
          <span />
        </div>
        <div className="mini-kanban">
          <div className="mini-kanban__column">
            <p>TO DO <span>2</span></p>
            <article>
              <span className="task-dot task-dot--aqua" />
              <strong>Billing emails</strong>
              <small>Today · EL</small>
            </article>
            <article>
              <span className="task-dot task-dot--orange" />
              <strong>Empty states</strong>
              <small>Thu · AO</small>
            </article>
          </div>
          <div className="mini-kanban__column">
            <p>IN REVIEW <span>2</span></p>
            <article className="mini-kanban__featured">
              <span className="task-dot task-dot--berry" />
              <strong>Release notes</strong>
              <small>2 comments · AO</small>
            </article>
            <article>
              <span className="task-dot task-dot--lime" />
              <strong>Plan limits</strong>
              <small>Tomorrow · NP</small>
            </article>
          </div>
        </div>
      </div>
      <div className="hero-orbit hero-orbit--one" />
      <div className="hero-orbit hero-orbit--two" />
    </div>
  );
}

function ComponentLab() {
  return (
    <section className="section component-lab" id="components" aria-labelledby="components-title">
      <div className="section-heading">
        <div>
          <p className="kicker">Reference set · 01</p>
          <h2 id="components-title">One material, eight useful parts.</h2>
        </div>
        <p>
          Gel treatment marks action and state. Reading surfaces stay quiet,
          sharp, and ready for real work.
        </p>
      </div>

      <div className="specimen-grid">
        <article className="specimen-card specimen-card--buttons">
          <div className="specimen-card__heading">
            <span>01</span>
            <h3>Button</h3>
          </div>
          <div className="specimen-actions">
            <GelButton>Build workspace <span aria-hidden="true">↗</span></GelButton>
            <GelButton variant="secondary">Invite team</GelButton>
            <GelButton loading>Saving</GelButton>
            <GelButton disabled>Unavailable</GelButton>
          </div>
          <p className="specimen-note">Rest · hover · press · loading · disabled</p>
        </article>

        <article className="specimen-card specimen-card--inputs">
          <div className="specimen-card__heading">
            <span>02</span>
            <h3>Input</h3>
          </div>
          <div className="field-stack">
            <label className="field">
              <span>Workspace name</span>
              <input defaultValue="Soft launch" />
              <small>Visible to everyone on your team.</small>
            </label>
            <label className="field field--error">
              <span>Invite email</span>
              <input
                defaultValue="hello@"
                aria-invalid="true"
                aria-describedby="invite-error"
              />
              <small id="invite-error">Enter a complete email address.</small>
            </label>
          </div>
        </article>

        <article className="specimen-card">
          <div className="specimen-card__heading">
            <span>03</span>
            <h3>Badge + Card</h3>
          </div>
          <div className="badge-row" aria-label="Badge variants">
            <span className="gel-badge gel-badge--berry">New</span>
            <span className="gel-badge gel-badge--grape">Design</span>
            <span className="gel-badge gel-badge--lime">Shipped</span>
            <span className="gel-badge gel-badge--aqua">Info</span>
          </div>
          <div className="reference-card">
            <div className="reference-card__icon" aria-hidden="true">✦</div>
            <div>
              <p className="eyebrow">Smart summary</p>
              <strong>12 decisions, zero loose ends.</strong>
              <p>Your Friday update is ready to share with the team.</p>
            </div>
            <button type="button" aria-label="Open summary">↗</button>
          </div>
        </article>

        <article className="specimen-card">
          <div className="specimen-card__heading">
            <span>04</span>
            <h3>Switch</h3>
          </div>
          <div className="switch-stack">
            <label className="switch-row">
              <span>
                <strong>Smart reminders</strong>
                <small>Only when work is drifting.</small>
              </span>
              <Switch.Root defaultChecked className="gel-switch">
                <Switch.Thumb className="gel-switch__thumb" />
              </Switch.Root>
            </label>
            <label className="switch-row switch-row--disabled">
              <span>
                <strong>Weekly digest</strong>
                <small>Available after your first week.</small>
              </span>
              <Switch.Root disabled className="gel-switch">
                <Switch.Thumb className="gel-switch__thumb" />
              </Switch.Root>
            </label>
          </div>
        </article>

        <article className="specimen-card specimen-card--wide">
          <div className="specimen-card__heading">
            <span>05</span>
            <h3>Tabs</h3>
          </div>
          <Tabs.Root className="gel-tabs" defaultValue="overview">
            <Tabs.List className="gel-tabs__list" aria-label="Project details">
              <Tabs.Tab className="gel-tabs__tab" value="overview">Overview</Tabs.Tab>
              <Tabs.Tab className="gel-tabs__tab" value="activity">Activity</Tabs.Tab>
              <Tabs.Tab className="gel-tabs__tab" value="notes">Notes</Tabs.Tab>
              <Tabs.Indicator className="gel-tabs__indicator" />
            </Tabs.List>
            <Tabs.Panel className="gel-tabs__panel gel-tabs__panel--stats" value="overview">
              <div className="tab-stat"><strong>24</strong><span>Open tasks</span></div>
              <div className="tab-stat"><strong>8</strong><span>Contributors</span></div>
              <div className="tab-stat"><strong>91%</strong><span>On-time rate</span></div>
            </Tabs.Panel>
            <Tabs.Panel className="gel-tabs__panel" value="activity">
              <div className="tab-message"><span>EL</span><p><strong>Elia</strong> moved “Plan limits” to review.</p><small>12m</small></div>
              <div className="tab-message"><span>NP</span><p><strong>Nina</strong> completed the onboarding audit.</p><small>42m</small></div>
            </Tabs.Panel>
            <Tabs.Panel className="gel-tabs__panel" value="notes">
              <p className="tab-copy">Keep the release focused: invite flow, plan limits, and a clean handoff for support.</p>
            </Tabs.Panel>
          </Tabs.Root>
        </article>

        <article className="specimen-card">
          <div className="specimen-card__heading">
            <span>06</span>
            <h3>Dialog</h3>
          </div>
          <p className="specimen-copy">A focused confirmation with a calm surface and obvious escape routes.</p>
          <Dialog.Root>
            <Dialog.Trigger className="gel-button gel-button--primary">Open dialog</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="gel-dialog__backdrop" />
              <Dialog.Viewport className="gel-dialog__viewport">
                <Dialog.Popup className="gel-dialog__popup">
                  <div className="gel-dialog__art" aria-hidden="true"><span>✓</span></div>
                  <p className="kicker">READY TO GO</p>
                  <Dialog.Title className="gel-dialog__title">Publish this update?</Dialog.Title>
                  <Dialog.Description className="gel-dialog__description">
                    Your 8 teammates will see the new timeline and receive a short notification.
                  </Dialog.Description>
                  <div className="gel-dialog__actions">
                    <Dialog.Close className="gel-button gel-button--quiet">Not yet</Dialog.Close>
                    <Dialog.Close className="gel-button gel-button--primary">Publish update</Dialog.Close>
                  </div>
                  <Dialog.Close className="gel-dialog__close" aria-label="Close dialog">×</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog.Root>
        </article>

        <article className="specimen-card">
          <div className="specimen-card__heading">
            <span>07</span>
            <h3>Dropdown menu</h3>
          </div>
          <p className="specimen-copy">Arrow-key navigation, typeahead, and restrained focus treatment come built in.</p>
          <Menu.Root>
            <Menu.Trigger className="gel-button gel-button--secondary menu-trigger">
              Workspace actions <span aria-hidden="true">⌄</span>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="gel-menu__positioner" sideOffset={10}>
                <Menu.Popup className="gel-menu__popup">
                  <p className="gel-menu__label">WORKSPACE</p>
                  <Menu.Item className="gel-menu__item"><span aria-hidden="true">＋</span> New project <kbd>N</kbd></Menu.Item>
                  <Menu.Item className="gel-menu__item"><span aria-hidden="true">◎</span> Invite people <kbd>I</kbd></Menu.Item>
                  <Menu.Item className="gel-menu__item"><span aria-hidden="true">⇩</span> Export data</Menu.Item>
                  <Menu.Separator className="gel-menu__separator" />
                  <Menu.Item className="gel-menu__item gel-menu__item--danger"><span aria-hidden="true">×</span> Leave workspace</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </article>
      </div>
    </section>
  );
}

function PricingSection() {
  const [annual, setAnnual] = React.useState(true);

  return (
    <section className="section pricing-section" id="pricing" aria-labelledby="pricing-title">
      <div className="pricing-intro">
        <p className="kicker">REFERENCE COMPOSITION · PRICING</p>
        <h2 id="pricing-title">Plans that flex with the work.</h2>
        <p>A credible conversion surface with just enough colour to make the choice feel easy.</p>
        <div className="billing-toggle">
          <span className={annual ? "" : "is-muted"}>Yearly</span>
          <Switch.Root
            checked={!annual}
            onCheckedChange={(checked) => setAnnual(!checked)}
            className="gel-switch"
            aria-label="Show monthly billing"
          >
            <Switch.Thumb className="gel-switch__thumb" />
          </Switch.Root>
          <span className={annual ? "is-muted" : ""}>Monthly</span>
          <span className="gel-badge gel-badge--lime">Save 20%</span>
        </div>
        <p className="demo-disclaimer">Illustrative SaaS pricing — not Gummy UI pricing.</p>
      </div>

      <div className="pricing-grid">
        <article className="price-card">
          <p className="price-card__name">Starter</p>
          <h3>For your first tidy launch.</h3>
          <div className="price"><span>$</span><strong>0</strong><small>/ forever</small></div>
          <p>Everything a small idea needs to get moving.</p>
          <a className="gel-button gel-button--quiet" href="#checkpoint">Start free</a>
          <ul>
            <li><span>✓</span> Up to 3 projects</li>
            <li><span>✓</span> 2 teammates</li>
            <li><span>✓</span> Weekly summaries</li>
          </ul>
        </article>
        <article className="price-card price-card--featured">
          <div className="price-card__flag">MOST LOVED</div>
          <p className="price-card__name">Studio</p>
          <h3>For teams finding their flow.</h3>
          <div className="price"><span>$</span><strong>{annual ? "18" : "22"}</strong><small>/ seat / mo</small></div>
          <p>More clarity, automation, and room to grow.</p>
          <a className="gel-button gel-button--primary" href="#checkpoint">Try Studio <span aria-hidden="true">↗</span></a>
          <ul>
            <li><span>✓</span> Unlimited projects</li>
            <li><span>✓</span> Smart reminders</li>
            <li><span>✓</span> Guest collaboration</li>
            <li><span>✓</span> Priority support</li>
          </ul>
        </article>
        <article className="price-card">
          <p className="price-card__name">Scale</p>
          <h3>For work with more moving parts.</h3>
          <div className="price price--word"><strong>Let’s talk</strong></div>
          <p>Tailored controls and support for growing organisations.</p>
          <a className="gel-button gel-button--secondary" href="#checkpoint">Talk to us</a>
          <ul>
            <li><span>✓</span> Advanced permissions</li>
            <li><span>✓</span> SSO and audit log</li>
            <li><span>✓</span> Success manager</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function DashboardComposition() {
  return (
    <section className="section dashboard-section" id="dashboard" aria-labelledby="dashboard-title">
      <div className="section-heading section-heading--dashboard">
        <div>
          <p className="kicker">REFERENCE COMPOSITION · DASHBOARD</p>
          <h2 id="dashboard-title">Still crisp when the work gets dense.</h2>
        </div>
        <p>Colour guides attention while data, labels, and controls keep a professional rhythm.</p>
      </div>

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
          <div className="dashboard-logo"><span>m</span><strong>Mallow</strong></div>
          <nav>
            <a href="#dashboard" className="is-active"><span>⌂</span> Overview</a>
            <a href="#dashboard"><span>◫</span> Projects <em>8</em></a>
            <a href="#dashboard"><span>◷</span> Activity</a>
            <a href="#dashboard"><span>♢</span> Insights</a>
          </nav>
          <div className="sidebar-projects">
            <p>FAVOURITES</p>
            <a href="#dashboard"><i className="project-dot project-dot--berry" /> Website refresh</a>
            <a href="#dashboard"><i className="project-dot project-dot--aqua" /> Mobile launch</a>
          </div>
          <button type="button" className="profile-chip">
            <span>EY</span>
            <span><strong>Elia Y.</strong><small>Founder</small></span>
            <b aria-hidden="true">•••</b>
          </button>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <p>Tuesday, 22 July</p>
              <h3>Good afternoon, Elia.</h3>
            </div>
            <div className="dashboard-topbar__actions">
              <button type="button" className="icon-button" aria-label="Search">⌕</button>
              <button type="button" className="icon-button notification-button" aria-label="Notifications">♢<i /></button>
              <button type="button" className="gel-button gel-button--primary"><span aria-hidden="true">＋</span> New task</button>
            </div>
          </header>

          <div className="metric-grid">
            <article className="metric-card metric-card--berry">
              <div><p>Completed</p><strong>34</strong></div>
              <span className="metric-change">↗ 18%</span>
              <div className="metric-spark" aria-label="Completion trend rising"><i /><i /><i /><i /><i /><i /></div>
            </article>
            <article className="metric-card">
              <div><p>In progress</p><strong>12</strong></div>
              <span className="metric-change metric-change--grape">↗ 4%</span>
              <div className="metric-ring" aria-label="68 percent complete"><span>68%</span></div>
            </article>
            <article className="metric-card">
              <div><p>Team pulse</p><strong>8.7</strong></div>
              <span className="gel-badge gel-badge--lime">Healthy</span>
              <div className="pulse-faces"><span>AO</span><span>EL</span><span>NP</span><span>+5</span></div>
            </article>
          </div>

          <div className="dashboard-lower-grid">
            <article className="work-card">
              <div className="work-card__header">
                <div><h4>Priority work</h4><p>What needs attention this week.</p></div>
                <button type="button" className="text-button">View all <span>→</span></button>
              </div>
              <div className="work-table" role="table" aria-label="Priority work">
                <div className="work-table__head" role="row">
                  <span role="columnheader">Task</span><span role="columnheader">Project</span><span role="columnheader">Owner</span><span role="columnheader">Due</span>
                </div>
                <div className="work-table__row" role="row">
                  <span role="cell"><i className="check-dot" /> Final QA pass</span><span role="cell"><i className="project-dot project-dot--berry" /> Website</span><span role="cell"><b>AO</b> Amara</span><span role="cell" className="due-soon">Today</span>
                </div>
                <div className="work-table__row" role="row">
                  <span role="cell"><i className="check-dot" /> Plan migration</span><span role="cell"><i className="project-dot project-dot--aqua" /> Mobile</span><span role="cell"><b>NP</b> Nina</span><span role="cell">Tomorrow</span>
                </div>
                <div className="work-table__row" role="row">
                  <span role="cell"><i className="check-dot" /> Release notes</span><span role="cell"><i className="project-dot project-dot--orange" /> Platform</span><span role="cell"><b>EY</b> Elia</span><span role="cell">Fri, 25</span>
                </div>
              </div>
            </article>

            <article className="activity-card">
              <div className="work-card__header"><div><h4>Activity</h4><p>Today</p></div><button type="button" className="icon-button" aria-label="Activity options">•••</button></div>
              <ul>
                <li><span className="activity-avatar activity-avatar--berry">AO</span><p><strong>Amara</strong> completed <b>Homepage copy</b><small>8 minutes ago</small></p></li>
                <li><span className="activity-avatar activity-avatar--aqua">NP</span><p><strong>Nina</strong> left 3 notes on <b>Plan limits</b><small>34 minutes ago</small></p></li>
                <li><span className="activity-avatar activity-avatar--lime">EY</span><p><strong>You</strong> created <b>Summer release</b><small>1 hour ago</small></p></li>
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export function GelPopProof() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Gummy UI visual proof home">
          <BrandMark />
          <span>Gummy UI</span>
          <span className="wordmark__stage">Stage 1</span>
        </a>
        <nav className="site-nav" aria-label="Visual proof sections">
          <a href="#components">Components</a>
          <a href="#pricing">Pricing</a>
          <a href="#dashboard">Dashboard</a>
        </nav>
        <div className="header-actions">
          <span className="checkpoint-pill"><i /> Visual checkpoint</span>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content">
        <section className="hero section" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-label"><span>GUMMY MATERIAL</span><span>Visual proof 02</span></div>
            <h1 id="hero-title">Seriously useful.<br /><em>Unmistakably gummy.</em></h1>
            <p>Bright, chewy components for thoughtful SaaS products—filled with colour and light, without getting in the way of the work.</p>
            <div className="hero-actions">
              <a className="gel-button gel-button--primary" href="#components">Explore the system <span aria-hidden="true">↘</span></a>
              <a className="gel-button gel-button--secondary" href="#dashboard">See it at work</a>
            </div>
            <div className="hero-proof">
              <div className="hero-proof__faces"><span>AO</span><span>NP</span><span>EY</span></div>
              <p><strong>Built for real product work</strong><span>Marketing, forms, and dense dashboards.</span></p>
            </div>
          </div>
          <div className="hero-visual">
            <MiniDashboard />
            <div className="float-note float-note--top"><span>✦</span><p><strong>Calmly on track</strong><small>4 tasks cleared today</small></p></div>
            <div className="float-note float-note--bottom"><span>76%</span><p><strong>Release ready</strong><small>Up 12% this week</small></p></div>
          </div>
        </section>

        <section className="token-strip" aria-label="Initial Gel Pop colour tokens">
          <div><span className="token-swatch token-swatch--ink" /><p><strong>Ink</strong><small>Aubergine</small></p></div>
          <div><span className="token-swatch token-swatch--berry" /><p><strong>Pop</strong><small>Raspberry</small></p></div>
          <div><span className="token-swatch token-swatch--grape" /><p><strong>Focus</strong><small>Grape</small></p></div>
          <div><span className="token-swatch token-swatch--lime" /><p><strong>Success</strong><small>Lime</small></p></div>
          <div><span className="token-swatch token-swatch--orange" /><p><strong>Warmth</strong><small>Tangerine</small></p></div>
          <div><span className="token-swatch token-swatch--aqua" /><p><strong>Info</strong><small>Aqua</small></p></div>
        </section>

        <ComponentLab />
        <PricingSection />
        <DashboardComposition />

        <section className="checkpoint-section section" id="checkpoint" aria-labelledby="checkpoint-title">
          <div className="checkpoint-art" aria-hidden="true"><BrandMark /></div>
          <p className="kicker">FOUNDER CHECKPOINT · REVISION 02</p>
          <h2 id="checkpoint-title">Is this unmistakably Gummy now?</h2>
          <p>This proof is ready for approval, rejection, or specific visual revisions. Catalogue production remains paused.</p>
          <a className="gel-button gel-button--primary" href="#top">Review from the top <span aria-hidden="true">↑</span></a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wordmark"><BrandMark /><span>Gummy UI</span></div>
        <p>Gummy material proof · Revision 02 · July 2026</p>
        <p>Original design for the public Gummy UI system.</p>
      </footer>
    </>
  );
}
