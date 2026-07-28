import { describe, expect, it, vi } from "vitest";
import {
  parseOperatorMetadata,
  runProtectedReleaseOperator,
} from "../scripts/protected-release-operator";
import { PROTECTED_RELEASE_METADATA_SCHEMA } from
  "../lib/commerce/protected-releases";

const publicationJson = JSON.stringify({
  schemaVersion: PROTECTED_RELEASE_METADATA_SCHEMA,
  productRef: "gummy-ui-pro-blocks",
  version: "1.2.3",
  objectKey: "releases/v1.2.3/gummy-ui-pro-blocks.zip",
  outerArchiveSha256: "a".repeat(64),
  sizeBytes: 4_096,
});

describe("protected release operator", () => {
  it("validates a redacted metadata file and defaults to a network-free dry run", async () => {
    const execute = vi.fn();
    const outputs: string[] = [];
    await runProtectedReleaseOperator({
      argv: ["publish", "/secure/release-metadata.json"],
      environment: {},
      readTextFile: async () => publicationJson,
      execute,
      writeOutput: (output) => outputs.push(output),
    });

    expect(execute).not.toHaveBeenCalled();
    expect(outputs).toEqual([
      JSON.stringify({
        mode: "dry-run",
        operation: "publish",
        productRef: "gummy-ui-pro-blocks",
        version: "1.2.3",
      }),
    ]);
    expect(outputs[0]).not.toContain("releases/");
    expect(outputs[0]).not.toContain("a".repeat(64));
  });

  it("requires explicit apply confirmation before invoking the injected client", async () => {
    const execute = vi.fn();
    await expect(runProtectedReleaseOperator({
      argv: ["publish", "/secure/release-metadata.json", "--apply"],
      environment: {
        PROTECTED_RELEASE_CONVEX_URL:
          "https://production-example.convex.cloud",
        CONVEX_SERVER_SECRET: "s".repeat(40),
      },
      readTextFile: async () => publicationJson,
      execute,
      writeOutput: vi.fn(),
    })).rejects.toThrow(
      "Protected release apply configuration is unavailable",
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it("applies only the validated operation and emits a redacted result", async () => {
    const execute = vi.fn().mockResolvedValue({
      releaseId: "release:gummy-ui-pro-blocks:1.2.3",
      productRef: "gummy-ui-pro-blocks",
      version: "1.2.3",
      status: "published",
      outcome: "published",
      storageKey: "must-not-be-logged",
    });
    const outputs: string[] = [];
    await runProtectedReleaseOperator({
      argv: ["publish", "/secure/release-metadata.json", "--apply"],
      environment: {
        PROTECTED_RELEASE_CONVEX_URL:
          "https://production-example.convex.cloud",
        CONVEX_SERVER_SECRET: "s".repeat(40),
        PROTECTED_RELEASE_APPLY_CONFIRMATION:
          "APPLY_PROTECTED_RELEASE_TO_CONFIGURED_CONVEX",
      },
      readTextFile: async () => publicationJson,
      execute,
      writeOutput: (output) => outputs.push(output),
    });

    expect(execute).toHaveBeenCalledWith(
      {
        url: "https://production-example.convex.cloud",
        serverSecret: "s".repeat(40),
      },
      "releases.publish",
      {
        productRef: "gummy-ui-pro-blocks",
        version: "1.2.3",
        objectKey: "releases/v1.2.3/gummy-ui-pro-blocks.zip",
        outerArchiveSha256: "a".repeat(64),
        sizeBytes: 4_096,
      },
    );
    expect(outputs[0]).toBe(JSON.stringify({
      mode: "apply",
      operation: "publish",
      productRef: "gummy-ui-pro-blocks",
      version: "1.2.3",
      outcome: "published",
      status: "published",
    }));
    expect(outputs[0]).not.toContain("must-not-be-logged");
    expect(outputs[0]).not.toContain("s".repeat(40));
  });

  it("accepts minimal withdrawal metadata and rejects extra sensitive fields", () => {
    expect(parseOperatorMetadata("withdraw", JSON.stringify({
      schemaVersion: PROTECTED_RELEASE_METADATA_SCHEMA,
      productRef: "gummy-ui-pro-design-kit",
      version: "2.0.0",
    }))).toEqual({
      productRef: "gummy-ui-pro-design-kit",
      version: "2.0.0",
    });
    expect(() => parseOperatorMetadata("publish", JSON.stringify({
      ...JSON.parse(publicationJson),
      objectUrl: "https://objects.example/protected.zip?signature=secret",
    }))).toThrow("Invalid protected release metadata");
    expect(() => parseOperatorMetadata("publish", JSON.stringify({
      ...JSON.parse(publicationJson),
      archiveBytesBase64: "private-archive",
    }))).toThrow("Invalid protected release metadata");
  });

  it("rejects unsafe target URLs without making a request", async () => {
    const execute = vi.fn();
    await expect(runProtectedReleaseOperator({
      argv: ["publish", "/secure/release-metadata.json", "--apply"],
      environment: {
        PROTECTED_RELEASE_CONVEX_URL:
          "https://production-example.convex.cloud.attacker.example",
        CONVEX_SERVER_SECRET: "s".repeat(40),
        PROTECTED_RELEASE_APPLY_CONFIRMATION:
          "APPLY_PROTECTED_RELEASE_TO_CONFIGURED_CONVEX",
      },
      readTextFile: async () => publicationJson,
      execute,
      writeOutput: vi.fn(),
    })).rejects.toThrow("Invalid protected release Convex deployment URL");
    expect(execute).not.toHaveBeenCalled();
  });
});
