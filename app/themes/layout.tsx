/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps primitive theme examples route-scoped in Vinext. */
export default function ThemesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/styles/gummy-primitives.css" precedence="gummy-themes" />
      {children}
    </>
  );
}
