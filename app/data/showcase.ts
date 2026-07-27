export type ShowcaseEntry = {
  name: string;
  url: string;
  description: string;
  submittedBy: string;
  permissionRecordedAt: string;
};

// Publish only verified, permissioned community work. An empty launch manifest is
// more truthful than example logos or fictional customer sites.
export const showcaseEntries: readonly ShowcaseEntry[] = [];
export const showcaseCount = showcaseEntries.length;
