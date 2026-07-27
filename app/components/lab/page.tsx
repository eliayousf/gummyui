import type { Metadata } from "next";
import { ComponentLab } from "../ComponentLab";

export const metadata: Metadata = {
  title: "Canonical Component Lab · Gummy UI",
  description: "Live states and composition evidence for all 57 Gummy UI component categories.",
  robots: { index: false, follow: true },
};

export default function ComponentLabPage() {
  return <ComponentLab />;
}
