import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicTextPage } from "../../components/PublicTextPage";
import {
  getProBlockCategory,
  getProBlocksByCategory,
  isProBlockDiscoverable,
  proBlockCategories,
} from "../../data/pro-catalogue";

const categoryGuidance = {
  about: {
    selection:
      "Choose an About composition by the story it must clarify: a company origin, a product philosophy, a working process, or a mission. Start with the audience’s unanswered question, then replace every sample fact with concise, supportable language from the real organisation.",
    integration:
      "Fit the section into the surrounding information hierarchy before changing its surface. Long-form narratives need comfortable reading widths and ordered headings; timeline or value-led variants need a sensible sequence that still reads clearly when columns collapse on a narrow screen.",
    review:
      "Review names, dates, milestones, team details, and claims with the people responsible for them. Check that imagery has permission and useful alternatives, that the page does not manufacture authority, and that a visitor can reach supporting work, contact, or policy information.",
  },
  "artificial-intelligence": {
    selection:
      "Use this composition when an AI product needs to explain what the system does, what evidence supports it, and where human judgment remains necessary. It is a framing structure, not permission to promise accuracy, autonomy, safety, or outcomes the product has not demonstrated.",
    integration:
      "Connect capability statements to real workflows, inputs, outputs, and controls. Replace generic example copy with product-specific limitations, data-handling context, and a route to fuller documentation. Preserve the reading order when feature cards move from a wide grid to a single column.",
    review:
      "Ask product, legal, privacy, and safety owners to review every claim before publication. Exercise long model names, translated copy, error states, keyboard navigation, reduced motion, and high zoom. The public preview remains unavailable until its separate review and release gates pass.",
  },
  authentication: {
    selection:
      "Select an authentication composition for one precise step—sign in, create an account, recover access, verify an address, or accept an invitation—rather than combining unrelated decisions. The right layout makes the primary action obvious and keeps recovery or account-switching routes findable.",
    integration:
      "Wire the visual shell to the application’s real identity provider and server-side session checks. Preserve password-manager support, autocomplete tokens, visible labels, validation summaries, pending states, and a safe return path. Never treat a client-rendered success screen as proof that identity was verified.",
    review:
      "Test new and returning identities, expired and replayed links, throttling, cancelled flows, inaccessible email, and cross-device recovery. Confirm keyboard and assistive-technology output without disclosing whether an untrusted address exists. Paid source and production credentials remain outside this public status page.",
  },
  "bento-grids": {
    selection:
      "A bento grid works when several related capabilities deserve different visual weight but still form one coherent explanation. Rank the messages before choosing spans; size should reflect customer importance, not simply the amount of decoration available for a card.",
    integration:
      "Replace demonstration content with a short evidence-led narrative, then verify how every span collapses at tablet and phone widths. Keep DOM order meaningful, avoid hiding essential information in hover effects, and ensure illustrations support rather than repeat the adjacent text.",
    review:
      "Inspect the grid at zoom, in dark mode, with reduced motion, and with long translated strings. Confirm each card has a distinct purpose, headings follow a logical sequence, and any metric or product claim links to a source that a customer can assess.",
  },
  blogs: {
    selection:
      "Choose a blog composition according to the discovery task: highlight one timely story, browse a topic, scan a chronological archive, or continue from a featured article. A useful index exposes authorship, publication context, and enough summary to make each destination predictable.",
    integration:
      "Connect cards and filters to canonical article records rather than duplicating editorial data in the view. Preserve real dates, descriptive link text, pagination or archive navigation, image alternatives, and a stable layout when a story lacks artwork. Do not invent readership or popularity signals.",
    review:
      "Test the empty archive, a single result, long titles, multiple authors, corrected articles, and removed imagery. Check that structured metadata matches the visible byline and date, topic links remain crawlable, and keyboard users can traverse the index without repetitive or ambiguous destinations.",
  },
  "calls-to-action": {
    selection:
      "Pick a call-to-action composition only after defining the single next decision it should support. The headline, supporting evidence, primary action, and optional secondary route should agree; competing actions or fabricated scarcity make the section harder to trust.",
    integration:
      "Use accurate button labels and route customers to the exact next state, whether that is documentation, pricing, account creation, or contact. Preserve focus treatment and sufficient target size, and make any background media decorative unless it communicates information not present in the copy.",
    review:
      "Verify the destination works without losing campaign or accessibility context, and exercise loading, authentication, unavailable, and failure outcomes. Review promotional qualifiers, price language, deadlines, and consent wording against the real commercial model before a public preview is approved.",
  },
  cards: {
    selection:
      "Card compositions are useful for comparing sibling objects such as products, projects, articles, actions, or metrics. Choose a variant whose hierarchy matches the data; do not force unrelated fields into a card merely to make a page look busier.",
    integration:
      "Map every visible value from a typed source of truth and decide whether the whole card or one explicit control is interactive. Avoid nested interactive elements, preserve heading order, constrain unpredictable media, and let descriptions wrap rather than truncating the only context a customer receives.",
    review:
      "Exercise missing images, long names, zero and very large values, unavailable actions, keyboard focus, and stacked mobile layout. Ensure repeated links remain distinguishable, status is not conveyed by colour alone, and fictional sample data cannot be mistaken for a testimonial or business result.",
  },
  careers: {
    selection:
      "Use a careers composition to explain team culture, help candidates discover genuine openings, or make the hiring process understandable. Separate durable information from role-specific details so applicants can tell what applies to the company and what applies to one vacancy.",
    integration:
      "Connect openings to the actual recruiting source and preserve location, working arrangement, employment type, salary disclosure where required, closing status, and an accessible application destination. Avoid collecting candidate information through a demonstration form or an unmonitored public endpoint.",
    review:
      "Have hiring and legal owners confirm every benefit, policy, timeline, and equal-opportunity statement. Test the no-openings state, expired roles, filtered results, long job titles, and external application handoff. Never publish invented employee quotes or an unsupported culture claim.",
  },
  contact: {
    selection:
      "Choose a contact composition around how inquiries are genuinely routed: direct support, sales qualification, office information, or a structured request. Ask for only the information needed to respond, and explain which channel is appropriate before a visitor submits personal data.",
    integration:
      "Connect forms to an approved, monitored destination with server-side validation, abuse protection, retention rules, and an honest success state. Use correct autocomplete values and visible labels. Addresses, hours, phone numbers, and response targets must match the organisation’s maintained records.",
    review:
      "Test validation, duplicate submission, offline recovery, provider failure, keyboard completion, and narrow screens. Confirm privacy language covers the collected fields and that sensitive security reports are redirected to the safer disclosure process rather than an ordinary contact form.",
  },
  faq: {
    selection:
      "An FAQ composition should resolve recurring, consequential questions rather than restate marketing copy. Group questions by customer task, write standalone headings in the visitor’s language, and place contractual topics near the canonical policy that governs them.",
    integration:
      "Keep answers in a maintained content source and link to pricing, licence, refund, privacy, or technical documentation when detail belongs there. Disclosure controls must expose expanded state correctly, work by keyboard, and leave the answer readable when scripting is unavailable.",
    review:
      "Check answers with their subject owners and remove stale promises instead of quietly qualifying them. Test long answers, deep links, searching, multiple expanded items, translated labels, and print output. FAQ structured data, if added later, must exactly match visible public content.",
  },
  features: {
    selection:
      "Select a feature composition according to the evidence available: a workflow is best for sequence, a comparison for material differences, and an annotated example for concrete behavior. Avoid turning internal implementation details into benefits unless customers can actually experience them.",
    integration:
      "Replace placeholders with specific capabilities, prerequisites, and links to deeper documentation. Maintain a logical reading order across columns, keep screenshots current with the shipped product, and treat decorative marks separately from images that communicate state or instructions.",
    review:
      "Ask product owners to prove each capability and qualifier in the current release. Exercise unavailable or plan-gated features, long translations, small screens, forced colours, and reduced motion. A polished section must never imply that an implemented private block is already purchasable.",
  },
  footers: {
    selection:
      "Choose a footer by the navigation customers still need at the end of a page: product discovery, documentation, account help, company context, or legal terms. Keep the link set deliberate; a larger sitemap is not automatically a more useful footer.",
    integration:
      "Generate destinations from maintained route data where practical, use descriptive group headings, and include only monitored contact and social channels. Preserve comfortable targets and visible focus as columns collapse. Legal, privacy, licence, refund, and support links should reach canonical current pages.",
    review:
      "Check every destination, locale label, copyright value, external-link treatment, and mobile order before release. Ensure duplicate links have the same purpose, newsletter fields are connected to real consent and delivery systems, and unsupported network logos or community counts are absent.",
  },
  forms: {
    selection:
      "Use a longer form composition when the task genuinely requires several related fields or stages. Group questions around the customer’s mental model, mark optional input plainly, and defer information that is not required for the immediate decision or service.",
    integration:
      "Bind controls to real validation and server outcomes while preserving native semantics, autocomplete, input purpose, error summaries, field-level guidance, and entered values after a recoverable failure. File and sensitive-data handling need explicit limits rather than presentation-only controls.",
    review:
      "Test keyboard-only completion, screen-reader announcements, high zoom, slow and offline submission, duplicate requests, expired sessions, invalid files, and provider failure. Confirm retention and consent language with the data owner before any form is connected to production collection.",
  },
  heroes: {
    selection:
      "A hero composition should answer what the product is, who it helps, and what a visitor can do next without requiring invented social proof. Pick the structure that fits the strength of the available message, whether product demonstration, service positioning, or portfolio introduction.",
    integration:
      "Replace sample copy and imagery with current product language, then connect actions to exact destinations. Keep the primary heading unique, reserve media space to prevent movement, provide informative alternatives where needed, and make the central proposition survive a narrow single-column layout.",
    review:
      "Review claims, pricing references, customer marks, screenshots, and action labels against live evidence. Test long translations, slow media, reduced motion, dark mode, high zoom, and missing imagery. Decorative polish must not obscure the page’s main purpose or imply availability before launch.",
  },
  navbars: {
    selection:
      "Select a navbar for the real hierarchy of the site or product, not for the number of menu effects it demonstrates. Primary destinations, account actions, and contextual navigation should remain distinguishable, with less important routes placed in a predictable secondary structure.",
    integration:
      "Connect navigation to canonical route data and preserve the current-page signal, focus return, escape behavior, and scroll handling. Responsive menus need a deliberate close strategy, correct labelling, and no hidden focusable content. Avoid using a menu when a simple list of links is clearer.",
    review:
      "Exercise every route, submenu, sign-in state, language direction, keyboard path, viewport, zoom level, and history transition. Confirm that product status and pricing links reflect reality, external destinations are identified where useful, and no paid-source location appears in public markup.",
  },
  onboarding: {
    selection:
      "Use an onboarding composition to reduce the first meaningful task into a small, ordered set of decisions: initial setup, preferences, import, or invitation. Explain why information is requested and allow customers to postpone steps that are not required for a safe account.",
    integration:
      "Persist progress server-side where cross-device continuity matters, validate authorization again for invitations and workspace changes, and separate completion from background processing. Back, skip, retry, and resume behavior should be explicit; progress decoration must not be the only statement of state.",
    review:
      "Test a new account, returning account, invitation, interrupted import, expired session, insufficient permission, provider failure, and completed setup. Check keyboard focus after each transition and ensure sample data, team names, or apparent success cannot be confused with real customer records.",
  },
  pricing: {
    selection:
      "Choose a pricing composition that matches the approved offer structure and the customer’s comparison task. Plans, billing intervals, seats, update periods, taxes, renewal behavior, and one-time terms need direct language; placeholder commercial values are never suitable for publication.",
    integration:
      "Render amounts and entitlements from one maintained commercial source and connect each action to the corresponding server-created checkout. Keep monthly, yearly, and lifetime distinctions explicit. Do not expose secret price identifiers or infer access from a client-side plan label.",
    review:
      "Reconcile visible figures against live provider products before every release, then test currency presentation, tax handoff, failed checkout, cancellation, refund, and access outcomes. Licence and refund links must remain nearby, and unavailable purchase actions must say so rather than simulate success.",
  },
  profiles: {
    selection:
      "Profile compositions cover people, organisations, accounts, and public identities; choose one only after identifying which fields are genuinely appropriate to display. Separate editable account controls from public presentation so privacy and authorization expectations stay clear.",
    integration:
      "Source identity, role, membership, and contact values from authorized records, with safe fallbacks for missing imagery and optional biography. Use informative image alternatives, protect mutation routes on the server, and never make hidden private fields discoverable through markup or client state.",
    review:
      "Test absent, long, international, and bidirectional names; multiple roles; deactivated accounts; restricted fields; and image failure. Confirm who may view or change each value, how deletion propagates, and that demonstration people cannot be mistaken for actual customers or employees.",
  },
  sidebars: {
    selection:
      "A sidebar is appropriate for a dense workspace with stable sibling destinations and contextual status. Organise items by customer task, keep the current location obvious, and avoid using persistent side navigation when a short linear flow would be easier to understand.",
    integration:
      "Connect groups, permissions, badges, and collapse behavior to real application state. Preserve content order, keyboard access, tooltips for icon-only states, and a usable small-screen alternative. Counts and alerts should have text equivalents and should not leak unauthorized workspace information.",
    review:
      "Exercise collapsed and expanded modes, long labels, deep nesting, empty groups, restricted routes, notification changes, zoom, RTL, and phone navigation. Verify focus return after overlays and ensure responsive transformation does not create duplicate controls or unreachable page content.",
  },
  statistics: {
    selection:
      "Choose a statistics composition only when a number helps a customer make or verify a decision. Pair every value with a clear unit, time range, comparison basis, and enough methodological context to prevent an attractive metric from becoming a misleading claim.",
    integration:
      "Format real values with locale-aware rules and define loading, unavailable, stale, zero, and error states. Charts need accessible summaries and consistent scales. Keep source or methodology links close to public claims, and never replace missing data with plausible demonstration growth.",
    review:
      "Reconcile figures against their system of record, test extreme and negative values, and inspect colour-independent meaning, narrow layouts, tables, and screen-reader output. Owners should approve rounding, trend language, freshness labels, and any conclusion drawn from the displayed comparison.",
  },
  teams: {
    selection:
      "Team compositions support directories, leadership context, collaboration, and recruiting. Decide whether the page serves internal coordination or public storytelling, then include only roles, relationships, and contact details appropriate for that audience and purpose.",
    integration:
      "Drive membership and permission-sensitive actions from authorized server data. Public profiles need publication consent; internal directories need scoped visibility. Preserve useful order, filters, missing-photo fallbacks, and explicit invitation or removal outcomes without exposing private email addresses in page source.",
    review:
      "Test empty and large teams, duplicate names, multiple roles, pending invitations, suspended members, restricted actions, and long international names. Confirm every public biography and image is approved, and never invent employee totals, leadership quotes, or customer-facing collaboration activity.",
  },
  testimonials: {
    selection:
      "Use a testimonial layout only when the exact quotation, speaker identity, organisation, and permission have been verified. Select the composition for the evidence available rather than adding a logo, metric, or portrait that the customer did not authorize.",
    integration:
      "Store approved wording and attribution in a maintained record so corrections or withdrawal propagate consistently. Mark fictional demonstration copy unmistakably, provide alternatives for informative portraits or logos, and avoid auto-advancing carousels that make evidence difficult to read or control.",
    review:
      "Retain a record of consent, source, approval scope, and removal process. Check quotation accuracy, title changes, links, imagery rights, keyboard controls, pause behavior, narrow layouts, and long translations. Bundled examples remain fictional and must never be presented as real customer endorsement.",
  },
} satisfies Record<
  string,
  { selection: string; integration: string; review: string }
>;

const categoryHandoffGuidance = {
  about:
    "For handoff, record the owner of each factual section and the date it was last checked. Give implementation a content outline, approved media, responsive priority, and destinations for every link. Also define what the page should show when a biography, milestone, or supporting image is withdrawn, so future maintenance does not replace a missing fact with an unreviewed placeholder.",
  "artificial-intelligence":
    "A useful handoff names the model or service version behind each example, the evaluation source for every measured result, and the owner of limitations and incident language. Include approved failure copy and escalation routes alongside the happy path. That record gives future reviewers a way to distinguish a product change from a purely visual update.",
  authentication:
    "Before implementation, document each form’s identity-provider action, session transition, redirect allowlist, error class, audit event, and support fallback. State which verification must occur again on the server and which customer input may be retained after failure. This prevents a visually complete form from concealing an incomplete recovery, invitation, or account-enumeration control.",
  "bento-grids":
    "Provide implementation with an explicit content order for wide and narrow layouts, plus minimum and maximum expectations for every card. Name which artwork is optional, which values are live, and how unavailable evidence should be represented. The grid should remain a complete explanation when all ornamental backgrounds and motion are removed.",
  blogs:
    "Define the canonical article fields, editorial owner, correction policy, archive ordering, pagination model, and image fallback before styling the index. Include examples at the shortest and longest supported lengths. Implementation should not infer publication status from the presence of a draft title, and search results should never expose scheduled or withdrawn material.",
  "calls-to-action":
    "The content handoff should identify one conversion goal, the approved claim supporting it, the exact primary destination, and the owner who can withdraw the promotion. Provide non-authenticated, already-complete, and temporarily unavailable outcomes. If a deadline or price changes, one maintained commercial record should update both the callout and the destination experience.",
  cards:
    "Give each card type a field contract that separates required identity, optional context, live status, and actions. Document sorting and truncation rules, along with the destination or mutation behind each control. A card that cannot render truthfully with missing optional data should be redesigned before it becomes a reusable product pattern.",
  careers:
    "Record which recruiting system owns each role, how often listings refresh, who approves culture copy, and how candidates receive privacy information before submitting. Supply a deliberate no-openings message and removal behavior for closed roles. The public page should not preserve a vacancy after its application destination or hiring authority has ended. Include a correction route for location, salary, accessibility, and accommodation information that changes during an active search.",
  contact:
    "Handoff should pair every inquiry type with its monitored owner, required fields, retention period, response expectation, and provider failure route. Include the exact public address or endpoint only after it is active. Define what is recorded for abuse prevention without copying message bodies or unnecessary personal details into logs.",
  faq:
    "For every answer, record a canonical policy or product source, subject owner, review date, and conditions that would make it obsolete. Provide stable anchors for frequently shared questions. If an answer changes a customer’s contractual understanding, update the governing document first and make the FAQ summarize and link to it rather than becoming a competing source.",
  features:
    "Create a feature evidence sheet containing the supported plans, prerequisites, screenshots, limitations, documentation destination, and accountable product owner. Mark future or private work explicitly and keep it out of published claims. Implementation should receive content for unavailable and permission-restricted states instead of inventing a universal success example.",
  footers:
    "Maintain the footer groups as a small route contract with an owner for product, company, support, and legal destinations. Supply the breakpoint order and identify links that leave the service. A removed route should fail review rather than linger as a redirect chain, and a new provider or policy should reach the canonical disclosure from every relevant page.",
  forms:
    "Document field purpose, data type, validation ownership, sensitivity, retention, authorization, and downstream system for each question. Provide exact errors and recovery behavior, not just a completed visual. The implementation handoff should also identify fields that must never enter analytics, ordinary logs, email notifications, or client-persisted drafts. State how customers correct, export, or delete accepted information after submission. Assign an owner to abandoned and duplicate records as well as completed requests.",
  heroes:
    "Supply one approved value proposition, supporting proof, media rights, primary action, secondary route, and an owner for every time-sensitive statement. Include the expected line lengths and the story order after media stacks below copy. When proof is withdrawn, the hero should become simpler rather than substituting a fabricated logo, quote, or metric.",
  navbars:
    "Define route labels, hierarchy, current-page matching, signed-in variants, permission visibility, external destinations, and the owner of each group in one navigation record. Provide explicit responsive behavior rather than leaving items to disappear by available width. A hidden link is not an authorization control, so server access rules remain a separate implementation requirement.",
  onboarding:
    "Map each step to its durable data, validation, authorization, optionality, and resume rule. Include copy for previously completed work, expired invitations, background jobs, and support escalation. Progress should come from stored outcomes rather than the current screen index, otherwise a refresh or provider retry can tell the customer that unfinished setup is complete.",
  pricing:
    "Handoff one versioned offer table containing plan names, billing intervals, amounts, seats, update windows, entitlements, renewal terms, provider references, and approved destinations. Record who reconciled it and when. Product UI, checkout creation, confirmation email, account access, refund behavior, and support guidance should all consume or verify that same commercial contract.",
  profiles:
    "Prepare a visibility and mutation matrix for every field, including where the value originates, who can edit it, who can see it, and how correction or deletion propagates. Provide neutral fallbacks that reveal no restricted attribute. The design handoff must not contain copied production records, even when realistic content would make the composition easier to evaluate.",
  sidebars:
    "List the canonical destinations, group order, permission rules, current-route matching, badge sources, and mobile transformation before implementation. State what remains visible when a group is empty or access changes during a session. Counts should come from authorized summaries and should degrade to unavailable, not zero, when the service cannot prove their value. Document focus return when a temporary mobile drawer closes after navigation or cancellation.",
  statistics:
    "For every statistic, supply a definition, unit, time zone, date range, comparison formula, freshness expectation, source owner, and approved rounding. Include zero, unavailable, stale, and error examples. Implementation should not calculate a persuasive trend from incomplete client data or let a delayed provider response silently reuse an old value without its timestamp.",
  teams:
    "Separate public profile content from operational membership data in the handoff. Document invitation, acceptance, role change, removal, and last-owner rules, plus who may perform and observe each action. Provide safe example identities rather than real records. Public team storytelling also needs named consent and a correction path independent of account administration.",
  testimonials:
    "Each approved testimonial should arrive with the exact quotation, speaker display name, role, organisation, media rights, destination, consent scope, approval date, and owner of the relationship. Define expiry or revalidation where appropriate. If any element cannot be substantiated later, remove it cleanly instead of preserving the layout with an unattributed or rewritten claim.",
} satisfies Record<string, string>;

function getCategoryGuidance(slug: string) {
  return Object.hasOwn(categoryGuidance, slug)
    ? categoryGuidance[slug as keyof typeof categoryGuidance]
    : undefined;
}

function getCategoryHandoffGuidance(slug: string) {
  return Object.hasOwn(categoryHandoffGuidance, slug)
    ? categoryHandoffGuidance[
        slug as keyof typeof categoryHandoffGuidance
      ]
    : undefined;
}

export function generateStaticParams() {
  return proBlockCategories.map(({ slug: category }) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getProBlockCategory(categorySlug);
  if (!category) return {};
  return {
    title: `${category.name} React UI Pro blocks · Gummy UI`,
    description: `Explore ${category.count} original ${category.name} React UI compositions, their implementation status, and the source-free review and release boundary for Gummy UI Pro.`,
    alternates: { canonical: `/blocks/${category.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ProBlockCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = getProBlockCategory(categorySlug);
  if (!category) notFound();
  const blocks = getProBlocksByCategory(category.slug);
  const statuses = [...new Set(blocks.map(({ status }) => status))];
  const dependencies = [
    ...new Set(blocks.flatMap(({ dependencies }) => dependencies)),
  ];
  const requirements = [
    ...new Set(blocks.flatMap(({ requirements }) => requirements)),
  ];
  const guidance = getCategoryGuidance(category.slug);
  const handoffGuidance = getCategoryHandoffGuidance(category.slug);

  return (
    <PublicTextPage
      eyebrow={`Private Pro category · ${blocks.length} compositions`}
      title={category.name}
      lede={`${category.purpose} These records are manifest-derived and source-free; an implemented status does not imply manual verification, release readiness, entitlement protection, or availability for purchase.`}
    >
      <section>
        <h2>Manifest items</h2>
        <p>
          {statuses.length === 1
            ? `All ${blocks.length} records currently carry ${statuses[0]} status.`
            : `These ${blocks.length} records currently span ${statuses.join(", ")} status.`}
          {" "}A dedicated detail becomes internally discoverable only after
          release readiness and a reviewed public preview.
        </p>
        <ul className="pro-block-manifest">
          {blocks.map((block) => {
            const discoverable = isProBlockDiscoverable(block);
            return (
              <li id={block.slug} key={block.id}>
                <article className="pro-block-record">
                  <header>
                    <h3>
                      {discoverable ? (
                        <Link href={`/blocks/${category.slug}/${block.slug}`}>
                          {block.name}
                        </Link>
                      ) : block.name}
                    </h3>
                    {statuses.length > 1 ? <span>{block.status}</span> : null}
                  </header>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2>Category contract</h2>
        <dl>
          <div>
            <dt>Purpose</dt>
            <dd>{category.purpose}</dd>
          </div>
          <div>
            <dt>Declared dependencies</dt>
            <dd>{dependencies.join(", ") || "None declared"}</dd>
          </div>
          <div>
            <dt>Required review</dt>
            <dd>{requirements.join(", ")}</dd>
          </div>
        </dl>
      </section>
      {guidance ? (
        <section>
          <h2>How to evaluate {category.name} blocks</h2>
          <p>{guidance.selection}</p>
          <p>{guidance.integration}</p>
          <p>{guidance.review}</p>
          {handoffGuidance ? <p>{handoffGuidance}</p> : null}
        </section>
      ) : null}
      <section>
        <h2>Boundary</h2>
        <p>
          Public pages contain only approved names, purposes, dependency
          aliases, requirements, status, and any future reviewed image preview.
          Editable paid source, test paths, release locations, and entitlement
          details remain private.
        </p>
        <p><Link href="/blocks">Return to all Pro block categories</Link></p>
      </section>
    </PublicTextPage>
  );
}
