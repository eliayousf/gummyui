import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTextPage } from "../../components/PublicTextPage";
import {
  getProTemplate,
  proTemplates,
} from "../../data/pro-catalogue";

const templateEvaluation = {
  "relay-forge": {
    fit:
      "Relay Forge is intended for a developer tool that must move from a concise product promise into integrations, task-focused documentation, and an inspectable change history. It suits a workflow runner or similarly technical product whose credibility depends on precise setup guidance rather than invented adoption numbers.",
    inspect:
      "Review whether the integration catalogue, documentation hierarchy, and changelog can be driven from maintained product records. Commands, compatibility claims, operating-system details, and examples must match a tested release. Loading and offline states should preserve access to already available guidance without pretending a remote action succeeded.",
    adapt:
      "Plan keyboard-copy behavior, long code samples, narrow documentation navigation, search with no results, outdated links, and version-specific notes. Replace every demonstration command and identifier. A consuming team remains responsible for package security, telemetry disclosure, release signing, and the support path attached to its tool.",
  },
  "current-desk": {
    fit:
      "Current Desk fits a SaaS product that helps teams review work and make calm release decisions. Its marketing route set supports capability explanation, audience-specific solutions, educational resources, and a qualified contact path rather than pushing every visitor directly into an account or checkout.",
    inspect:
      "Map each solution and feature claim to something the shipped application can demonstrate. Resource cards need real authorship and dates; contact handling needs an approved monitored destination. Exercise the quiet states as carefully as the polished landing page, including no projects, delayed data, unavailable permissions, and interrupted decisions.",
    adapt:
      "Define how product screenshots, workspace examples, roles, and release language are approved before they enter public copy. The template does not supply a customer database, identity model, analytics consent, or sales operation. Those integrations must preserve authorization and privacy boundaries while keeping the multipage navigation coherent.",
  },
  "soft-signal-studio": {
    fit:
      "Soft Signal Studio is for a creative practice whose strongest evidence is selected work, a clear process, the people doing it, and an honest description of project fit. It is designed to let case studies carry the argument instead of relying on decorative awards, fabricated client marks, or vague scale claims.",
    inspect:
      "Confirm every project has publication permission, licensed imagery, accurate roles, and enough context to distinguish contribution from outcome. The dynamic work route needs stable slugs and a withdrawn-project state. The contact route should qualify inquiries without collecting unnecessary budgets, confidential briefs, or personal information.",
    adapt:
      "Test image failure, portrait and landscape media, long captions, missing credits, slow galleries, reduced motion, keyboard browsing, and readable case studies at high zoom. Replace all demonstration organisations and testimonials. The consuming studio owns consent records, asset retention, lead routing, and correction or removal requests.",
  },
  "field-notes-portfolio": {
    fit:
      "Field Notes Portfolio suits an individual designer-developer who needs case studies, short writing, experiments, and current availability to form one credible body of work. It separates finished project evidence from exploratory notes so readers can understand what was delivered, learned, or merely tested.",
    inspect:
      "Review case-study authorship, client permission, contribution boundaries, dates, and links before publication. Notes need a durable archive and clear status when an experiment is obsolete. Availability language should be maintained rather than becoming a permanent promise, and the about route should avoid exposing private contact or employment details.",
    adapt:
      "Plan for projects without imagery, long technical explanations, code snippets, external work that disappears, and a portfolio with only one case study. Ensure focus order and reading structure survive visual rearrangement. The owner remains responsible for image rights, analytics consent, inquiry handling, and factual outcome claims.",
  },
  "boundary-ai": {
    fit:
      "Boundary AI is intended for an AI product that must explain capability alongside evidence, limitations, safety controls, use cases, and integrations. The route structure helps buyers investigate the product without treating fluent demonstration output as proof of accuracy, autonomy, fitness, or risk reduction.",
    inspect:
      "Connect every model, benchmark, safety, data-handling, and integration claim to current reviewed evidence. Use-case pages must state prerequisites and human responsibilities. Failure, permission-denied, and offline states should make uncertainty visible; they must not silently replace unavailable model output with plausible demonstration content.",
    adapt:
      "Schedule review with product, security, privacy, legal, and domain owners, then exercise prompt injection, unsupported inputs, rate limits, refusal, latency, and recovery messaging. Replace all sample outputs and customer stories. The template does not provide governance, evaluation datasets, incident response, or regulatory compliance by itself.",
  },
  "orchard-console": {
    fit:
      "Orchard Console fits an authenticated administration product for workspaces, usage, releases, access, and settings. It is intentionally denser than the marketing templates and should be chosen only when customers need to inspect operational records and make permission-sensitive changes across several related areas.",
    inspect:
      "Define the server-side authorization rule for every route, record, filter, export, and mutation before adapting the interface. Usage and release values need freshness and provenance; access screens need invitation, revocation, and last-owner safeguards. Empty, loading, error, denied, and offline states must remain distinguishable.",
    adapt:
      "Test large and zero data sets, long workspace names, concurrent changes, stale sessions, failed exports, revoked membership, destructive confirmation, narrow screens, and keyboard navigation. Demonstration records must never resemble real customers. The consuming product owns audit logs, retention, backup, restore, monitoring, and support escalation.",
  },
} satisfies Record<
  string,
  { fit: string; inspect: string; adapt: string }
>;

const templateOperations = {
  "relay-forge":
    "Before launch, define who owns compatibility data, documentation corrections, security notices, and release support. The deployed product should monitor failed integrations and broken documentation destinations without logging sensitive command input. Backups and rollback need to cover the site and its maintained content sources; a polished local workflow example does not prove the hosted documentation can be recovered.",
  "current-desk":
    "Operational handoff should name the owner of resource publication, lead routing, product claims, and each external service. Test a contact request from validation through delivery and support response, then prove the marketing deployment can roll back without losing current policy or commercial copy. Customer workspace data belongs to the product application, not to examples embedded in this template.",
  "soft-signal-studio":
    "The production plan should assign owners for portfolio corrections, asset rights, inquiry delivery, and removal requests. Monitor broken case-study media and contact failures without collecting full confidential briefs in ordinary logs. Backup and restore must preserve approved project records and credits as well as page code, while rollback must not republish work whose permission has been withdrawn.",
  "field-notes-portfolio":
    "Name the person responsible for availability, case-study corrections, note archives, inquiry delivery, and third-party links. Keep source copies of approved text and media in recoverable storage, and verify that rollback does not resurrect a withdrawn client project or obsolete contact claim. Monitoring should report publication failures without sending private draft content to external logs.",
  "boundary-ai":
    "Release operations need owners for model changes, evaluation evidence, safety incidents, data-handling copy, integration status, and customer support. Structured logs should distinguish provider failure from product refusal without capturing prompts or outputs by default. Backup, restore, and rollback must preserve the approved claim set so an application rollback cannot silently republish limitations that no longer match the active system.",
  "orchard-console":
    "Production readiness requires structured authorization and mutation logs, alerts for failed access changes and exports, durable backup of operational records, isolated restore evidence, and a rollback plan that keeps schema and client versions compatible. Support staff need a safe way to correlate a customer report without opening unrelated workspace data. None of those controls are supplied by the interface template alone.",
} satisfies Record<string, string>;

function getTemplateEvaluation(slug: string) {
  return Object.hasOwn(templateEvaluation, slug)
    ? templateEvaluation[slug as keyof typeof templateEvaluation]
    : undefined;
}

function getTemplateOperations(slug: string) {
  return Object.hasOwn(templateOperations, slug)
    ? templateOperations[slug as keyof typeof templateOperations]
    : undefined;
}

export function generateStaticParams() {
  return proTemplates.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = getProTemplate(slug);
  if (!template) return {};
  return {
    title: `${template.name} Pro template status · Gummy UI`,
    description: `${template.brief} Boundary-safe implementation and release status.`,
    alternates: { canonical: `/templates/${template.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ProTemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getProTemplate(slug);
  if (!template) notFound();
  const evaluation = getTemplateEvaluation(template.slug);
  const operations = getTemplateOperations(template.slug);

  return (
    <PublicTextPage
      eyebrow={`Private Pro template · ${template.status}`}
      title={template.name}
      lede={`${template.brief} The public page exposes only reviewed source-free metadata; private React, TypeScript, tests, and release files never enter this application.`}
    >
      <section>
        <h2>Product route contract</h2>
        <ul>
          {template.routes.map((route) => <li key={route}><code>{route}</code></li>)}
        </ul>
      </section>
      <section>
        <h2>State and quality contract</h2>
        <p>States: {template.states.join(", ")}.</p>
        <p>Requirements: {template.requirements.join(", ")}.</p>
      </section>
      {evaluation ? (
        <section>
          <h2>Evaluate the product fit</h2>
          <p>{evaluation.fit}</p>
          <p>{evaluation.inspect}</p>
          <p>{evaluation.adapt}</p>
          {operations ? <p>{operations}</p> : null}
        </section>
      ) : null}
      <section>
        <h2>Source-free preview</h2>
        <p>
          {template.preview
            ? "A reviewed release-ready image is available on the isolated preview page."
            : "No public preview is published. Preview metadata remains private until release readiness and boundary review are complete."}
        </p>
        <p><Link href={`/templates/${template.slug}/preview`}>Open isolated preview status</Link></p>
      </section>
      <section>
        <h2>Availability boundary</h2>
        <p>
          Implemented does not mean verified, release-ready, entitled, sold,
          or deployed. Manual browser and assistive-technology review, approved
          commercial terms, a protected archive, and server-side entitlement
          delivery remain required.
        </p>
        <p><Link href="/templates">Return to all Pro templates</Link></p>
      </section>
    </PublicTextPage>
  );
}
