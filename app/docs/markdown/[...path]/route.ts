import { renderMarkdownDocument } from "../../../data/markdown-docs";

const markdownHeaders = {
  "content-type": "text/markdown; charset=utf-8",
  "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  "x-content-type-options": "nosniff",
};

function notFoundResponse() {
  return new Response(
    "# Documentation not found\n\nThe requested public Markdown document does not exist.\n",
    {
      status: 404,
      headers: {
        ...markdownHeaders,
        "cache-control": "no-store",
      },
    },
  );
}

export function GET(request: Request) {
  const namespace = "/docs/markdown/";
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith(namespace)) return notFoundResponse();

  let documentPath: string;
  try {
    documentPath = decodeURIComponent(pathname.slice(namespace.length));
  } catch {
    return notFoundResponse();
  }
  if (
    !documentPath
    || documentPath.includes("..")
    || documentPath.includes("\\")
    || documentPath.startsWith("/")
  ) {
    return notFoundResponse();
  }

  const markdown = renderMarkdownDocument(documentPath);
  if (!markdown) return notFoundResponse();
  return new Response(markdown, { headers: markdownHeaders });
}
