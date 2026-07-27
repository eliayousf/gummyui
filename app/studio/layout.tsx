/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps the frame-studio payload route-scoped in Vinext. */
export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/styles/frame-studio.css" precedence="gummy-studio" />
      {children}
    </>
  );
}
