import generated from "./component-api.generated.json";

export type ComponentApiProperty = {
  name: string;
  optional: boolean;
  type: string;
};

export type ComponentApiType = {
  name: string;
  extends: string[];
  props: ComponentApiProperty[];
};

export type ComponentApiRecord = {
  slug: string;
  source: string;
  components: string[];
  hooks: string[];
  types: ComponentApiType[];
};

const records = generated.records as ComponentApiRecord[];

export function getComponentApi(slug: string) {
  return records.find((record) => record.slug === slug);
}

export const componentApiCount = generated.count;
export const componentApiRecords = records;
