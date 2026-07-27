import type { Metadata } from "next";
import { DocsShell } from "../components/DocsShell";

export const metadata: Metadata = {
  title: "Gummy UI documentation · Install editable React source",
  description: "Install Gummy UI through its shadcn-compatible registry, understand theme tokens and component anatomy, and follow the tested public source contract.",
  alternates: { canonical: "/docs" },
};

export default function DocsPage() {
  return <DocsShell />;
}
