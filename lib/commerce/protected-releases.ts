export const protectedReleaseProducts = {
  "gummy-ui-pro-blocks": "gummy-ui-pro-blocks",
  "gummy-ui-pro-templates": "gummy-ui-pro-templates",
  "gummy-ui-pro-design-kit": "gummy-ui-pro-design-kit",
} as const;

export type ProtectedReleaseProductRef =
  keyof typeof protectedReleaseProducts;

export interface ProtectedReleasePublication {
  productRef: ProtectedReleaseProductRef;
  version: string;
  objectKey: string;
  outerArchiveSha256: string;
  sizeBytes: number;
}

export interface ProtectedReleaseWithdrawal {
  productRef: ProtectedReleaseProductRef;
  version: string;
}

export const PROTECTED_RELEASE_METADATA_SCHEMA =
  "gummyui.protected-release.v1";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u;

const PUBLICATION_FIELDS = [
  "objectKey",
  "outerArchiveSha256",
  "productRef",
  "sizeBytes",
  "version",
] as const;

const WITHDRAWAL_FIELDS = ["productRef", "version"] as const;

export function parseProtectedReleasePublication(
  value: unknown,
): ProtectedReleasePublication {
  const record = exactRecord(value, PUBLICATION_FIELDS);
  const productRef = protectedProductRef(record.productRef);
  const version = protectedVersion(record.version);
  const objectKey = stringValue(record.objectKey);
  const outerArchiveSha256 = stringValue(record.outerArchiveSha256);
  const sizeBytes = record.sizeBytes;
  const expectedObjectKey =
    `releases/v${version}/${protectedReleaseProducts[productRef]}.zip`;

  if (
    objectKey !== expectedObjectKey
    || !/^[a-f0-9]{64}$/u.test(outerArchiveSha256)
    || !Number.isSafeInteger(sizeBytes)
    || (sizeBytes as number) <= 0
  ) {
    throw new Error("Invalid protected release metadata");
  }

  return {
    productRef,
    version,
    objectKey,
    outerArchiveSha256,
    sizeBytes: sizeBytes as number,
  };
}

export function parseProtectedReleaseWithdrawal(
  value: unknown,
): ProtectedReleaseWithdrawal {
  const record = exactRecord(value, WITHDRAWAL_FIELDS);
  return {
    productRef: protectedProductRef(record.productRef),
    version: protectedVersion(record.version),
  };
}

export function protectedReleaseId(
  productRef: ProtectedReleaseProductRef,
  version: string,
): string {
  return `release:${productRef}:${version}`;
}

function protectedProductRef(value: unknown): ProtectedReleaseProductRef {
  if (
    typeof value !== "string"
    || !Object.hasOwn(protectedReleaseProducts, value)
  ) {
    throw new Error("Invalid protected release metadata");
  }
  return value as ProtectedReleaseProductRef;
}

function protectedVersion(value: unknown): string {
  const version = stringValue(value);
  if (version.length > 100 || !SEMVER_PATTERN.test(version)) {
    throw new Error("Invalid protected release metadata");
  }
  return version;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Invalid protected release metadata");
  }
  return value;
}

function exactRecord<const Fields extends readonly string[]>(
  value: unknown,
  fields: Fields,
): Record<Fields[number], unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid protected release metadata");
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...fields].sort();
  if (
    actual.length !== expected.length
    || actual.some((field, index) => field !== expected[index])
  ) {
    throw new Error("Invalid protected release metadata");
  }
  return record as Record<Fields[number], unknown>;
}
