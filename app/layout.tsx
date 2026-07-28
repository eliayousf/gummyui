import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/compositions.css";

const display = Bricolage_Grotesque({
  display: "optional",
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Geist({
  display: "optional",
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  display: "optional",
  preload: false,
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gummyui.dev"),
  title: "Gummy UI · Deliberately designed React components",
  description:
    "Open-source React components with tactile Gel Pop material, accessible behavior, and editable source.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Gummy UI",
    description: "Make vibe-coded products feel deliberately designed.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gummy UI product composition" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gummy UI",
    description: "Make vibe-coded products feel deliberately designed.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('gummy-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}",
          }}
        />
      </head>
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
