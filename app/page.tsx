import type { Metadata } from "next";
import { CompositionShowcase } from "./components/CompositionShowcase";

export const metadata: Metadata = {
  title: "Gummy UI · Deliberately designed React components",
  description: "Explore 57 MIT-licensed React and TypeScript components with editable native, Base UI, and Radix UI source, light and dark themes, RTL, and Gel Pop material.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <CompositionShowcase />;
}
