import { components } from "../../data/catalogue";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "gummyui-public",
      catalogueEntries: components.length,
      registrySchema: "https://ui.shadcn.com/schema/registry.json",
    },
    {
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
