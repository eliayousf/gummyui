import type { Metadata } from "next";
import Link from "next/link";
import { PublicTextPage } from "../components/PublicTextPage";
import { commercialFacts } from "../data/commercial";

export const metadata: Metadata = {
  title: "Gummy UI Pro commercial licence",
  description:
    "Read the Gummy UI Pro commercial licence covering named seats, projects, client work, paid source, redistribution, updates, support and termination.",
  alternates: { canonical: "/commercial-license" },
  robots: { index: true, follow: true },
};

export default function CommercialLicensePage() {
  return (
    <PublicTextPage
      eyebrow={`Commercial Licence v1.0 · effective ${commercialFacts.effectiveDate}`}
      title="Build products. Do not redistribute the kit."
      lede={`${commercialFacts.legalName}, trading as ${commercialFacts.tradingName}, grants this licence to the person or organisation identified in the completed order. Your plan, seats and delivered files form part of this licence.`}
    >
      <section>
        <h2>1. Licence grant</h2>
        <p>After full payment, we grant you a worldwide, non-exclusive, non-transferable commercial licence to use, copy and modify the Gummy UI Pro files delivered under your plan to create an unlimited number of permitted websites, applications and other end products for yourself, your employer or your clients.</p>
        <p>The Individual licence covers one named human. The Team licence covers up to five named humans in the purchasing organisation. The Organization licence covers unlimited named humans in one purchasing organisation. Devices, bots, shared accounts, job titles and generic inboxes are not seats. Contractors need a seat while they access paid source.</p>
      </section>
      <section>
        <h2>2. Permitted client work</h2>
        <p>You may use paid files in a client end product and hand over project-specific customised source needed to maintain that end product. The client receives a right to use that customised source only as part of the delivered end product. They do not receive the reusable Gummy UI Pro library, your account, future updates or a right to extract or reuse the paid files across other projects unless they buy their own licence.</p>
        <p>You remain responsible for making these limits clear to the client and for ensuring that anyone with reusable paid-source access holds a valid seat.</p>
      </section>
      <section>
        <h2>3. What is not allowed</h2>
        <p>You must not sell, sublicense, share, publish, upload or otherwise distribute paid files on a standalone basis or in a form from which they can be extracted as a reusable library.</p>
        <ul>
          <li>Do not place paid source in a public repository, public package, shared drive, marketplace or unauthorised account.</li>
          <li>Do not use paid files to create or supply a competing UI kit, component library, block library, template library, design system, theme collection, builder, generator or marketplace.</li>
          <li>Do not share credentials, evade seat limits or give the private Gummy UI Pro repository to customers.</li>
          <li>Do not use paid files to train, fine-tune or build a dataset for an AI model. An authorised user may use a private assistant that does not train on, retain or share the supplied source.</li>
          <li>Do not remove proprietary notices from the supplied package or misrepresent Gummy UI source as your own standalone product.</li>
        </ul>
      </section>
      <section>
        <h2>4. Ownership and open-source boundary</h2>
        <p>{commercialFacts.legalName} retains all intellectual-property rights in Gummy UI Pro except for third-party material identified in the supplied notices. Your ownership of an end product does not transfer ownership of the underlying Gummy UI Pro files.</p>
        <p>The 57-component public catalogue is separate and remains available under the <Link href="/license">MIT licence</Link>. This commercial licence applies only to paid blocks, templates, design-kit files and related paid releases.</p>
      </section>
      <section>
        <h2>5. Subscription, lifetime access, backups and support</h2>
        <p>Monthly and yearly plans require an active subscription for new downloads, future updates and paid support. If you cancel, access continues until the end of the paid period. You may keep using versions already delivered to you in existing permitted projects, but you may not download new files or receive updates or paid support after the paid period ends.</p>
        <p>A lifetime purchase has no recurring charge and includes future releases and paid support for the commercial lifetime of Gummy UI Pro. “Lifetime” means the commercial lifetime of that product; it does not guarantee that the product, website, download service or support service will exist forever.</p>
        <p>You may make reasonable private backups. Support aims to send a first reply within two UK business days. This is not an SLA and does not include bespoke implementation, project debugging, security certification or a promise that every requested change will be made.</p>
      </section>
      <section>
        <h2>6. Refunds and licence termination</h2>
        <p>The <Link href="/refund">refund policy</Link> forms part of this licence. If a purchase is refunded, reversed or charged back, this licence ends and you must stop using and delete the refunded paid files, except where applicable law provides otherwise.</p>
        <p>We may suspend access while investigating misuse and may terminate this licence for a material breach. Where the breach can reasonably be fixed, we will normally give written notice and 14 days to fix it. Rights that by nature should survive—including ownership, payment already due, confidentiality, restrictions and liability provisions—continue after termination.</p>
      </section>
      <section>
        <h2>7. Warranties and liability</h2>
        <p>We will supply digital content that matches its description and will not exclude rights that cannot lawfully be excluded. Except for those mandatory rights, paid files are supplied without a promise that they fit every project, dependency, browser, law, accessibility target or business outcome. You are responsible for reviewing and testing your end product.</p>
        <p>Nothing limits liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any other liability that cannot legally be limited. Subject to that, our total liability arising from this licence is limited to the amount you paid for the affected plan, and we are not liable for indirect or consequential loss to the extent the law permits.</p>
      </section>
      <section>
        <h2>8. Law, consumers and contact</h2>
        <p>This licence is governed by the law of England and Wales. Courts in England and Wales have jurisdiction, but consumers keep any mandatory rights and may use any local court that applicable consumer law requires.</p>
        <p>Questions and licence notices: <a href={commercialFacts.supportHref}>{commercialFacts.supportEmail}</a>. Registered office: {commercialFacts.registeredAddress}. Company number {commercialFacts.companyNumber}.</p>
      </section>
    </PublicTextPage>
  );
}
