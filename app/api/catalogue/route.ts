import { catalogueGroups, components } from "../../data/catalogue";

export function GET() {
  return Response.json(
    {
      schemaVersion: "1.0",
      generatedFrom: "app/data/catalogue.ts",
      count: components.length,
      groups: catalogueGroups,
      components,
    },
    {
      headers: {
        "cache-control": "public, max-age=300, s-maxage=3600",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
