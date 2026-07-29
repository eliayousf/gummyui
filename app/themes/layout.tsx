/* eslint-disable @next/next/no-css-tags -- React 19 stylesheet precedence keeps Theme Builder component styles route-scoped in Vinext. */
export default function ThemesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/styles/theme-builder-components.css" precedence="gummy-themes" />
      {children}
    </>
  );
}
