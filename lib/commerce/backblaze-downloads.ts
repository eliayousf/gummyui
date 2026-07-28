import "server-only";
import {
  GetObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import type { ConsumableReleaseObject } from "./convex-downloads";

export interface BackblazeReleaseConfig {
  endpoint: string;
  region: string;
  bucket: string;
  keyId: string;
  applicationKey: string;
}

export function readBackblazeReleaseConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): BackblazeReleaseConfig | null {
  const endpointValue = environment.BACKBLAZE_B2_ENDPOINT?.trim();
  const region = environment.BACKBLAZE_B2_REGION?.trim();
  const bucket = environment.BACKBLAZE_B2_BUCKET?.trim();
  const keyId = environment.BACKBLAZE_B2_KEY_ID?.trim();
  const applicationKey =
    environment.BACKBLAZE_B2_APPLICATION_KEY?.trim();
  if (!endpointValue && !region && !bucket && !keyId && !applicationKey) {
    return null;
  }
  if (!endpointValue || !region || !bucket || !keyId || !applicationKey) {
    throw new Error("Invalid Backblaze release configuration");
  }
  const endpoint = new URL(endpointValue);
  if (
    endpoint.protocol !== "https:"
    || endpoint.pathname !== "/"
    || endpoint.search
    || endpoint.hash
    || endpoint.username
    || endpoint.password
    || !/^s3\.[a-z0-9-]+\.backblazeb2\.com$/u.test(endpoint.hostname)
    || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/u.test(bucket)
    || !/^[a-z0-9-]{3,40}$/u.test(region)
    || keyId.length < 10
    || applicationKey.length < 20
  ) {
    throw new Error("Invalid Backblaze release configuration");
  }
  return {
    endpoint: endpoint.origin,
    region,
    bucket,
    keyId,
    applicationKey,
  };
}

export class BackblazeReleaseStore {
  private readonly client: S3Client;

  constructor(private readonly config: BackblazeReleaseConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
    });
  }

  async get(
    release: ConsumableReleaseObject,
  ): Promise<{
    body: ReadableStream<Uint8Array>;
    contentLength: number;
    checksumSha256: string;
  }> {
    const result = await this.client.send(new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: release.storageKey,
    }));
    validateObject(result, release);
    const body = result.Body;
    if (!body || typeof body.transformToWebStream !== "function") {
      throw new Error("Backblaze release stream is unavailable");
    }
    return {
      body: body.transformToWebStream(),
      contentLength: release.sizeBytes,
      checksumSha256: release.checksumSha256,
    };
  }
}

function validateObject(
  result: GetObjectCommandOutput,
  release: ConsumableReleaseObject,
) {
  const checksum = result.Metadata?.sha256?.toLowerCase();
  if (
    result.ContentLength !== release.sizeBytes
    || checksum !== release.checksumSha256
    || result.ContentType !== "application/zip"
  ) {
    throw new Error("Backblaze release integrity metadata mismatch");
  }
}
