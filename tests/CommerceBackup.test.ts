import { describe, expect, it } from "vitest";
import {
  authenticateBackupManifest,
  canonicalJson,
  createBackupManifest,
  decryptBackupObject,
  encryptBackupObject,
  reconcileRecords,
  verifyBackupManifest,
  verifyAuthenticatedBackupManifest,
} from "../lib/commerce";

const now = 1_800_000_000_000;

describe("backup integrity and restore reconciliation", () => {
  it("creates a deterministic manifest and verifies an exact restore", async () => {
    const objects = [
      {
        name: "database/export.jsonl",
        bytes: new TextEncoder().encode('{"id":"record:001"}\n'),
        recordCount: 1,
        schemaVersion: "schema:local:001",
      },
      {
        name: "releases/manifest.json",
        bytes: new TextEncoder().encode('{"release":"opaque"}'),
        recordCount: 1,
        schemaVersion: "release-manifest:local:001",
      },
    ];
    const manifest = await createBackupManifest({
      backupId: "backup:opaque:001",
      createdAt: now,
      objects: [...objects].reverse(),
    });
    expect(manifest.objects.map(({ name }) => name)).toEqual([
      "database/export.jsonl",
      "releases/manifest.json",
    ]);
    await expect(verifyBackupManifest(manifest, objects)).resolves.toEqual({
      valid: true,
      errors: [],
    });
  });

  it("detects altered bytes, counts and unexpected restore objects", async () => {
    const original = {
      name: "database/export.jsonl",
      bytes: new TextEncoder().encode('{"id":"record:001"}\n'),
      recordCount: 1,
      schemaVersion: "schema:local:001",
    };
    const manifest = await createBackupManifest({
      backupId: "backup:opaque:001",
      createdAt: now,
      objects: [original],
    });
    const verification = await verifyBackupManifest(manifest, [
      {
        ...original,
        bytes: new TextEncoder().encode('{"id":"record:tampered"}\n'),
        recordCount: 2,
      },
      {
        name: "unexpected",
        bytes: new Uint8Array(),
        recordCount: 0,
        schemaVersion: "schema:local:001",
      },
    ]);
    expect(verification.valid).toBe(false);
    expect(verification.errors).toEqual(
      expect.arrayContaining([
        { object: "database/export.jsonl", reason: "record_count" },
        { object: "database/export.jsonl", reason: "checksum" },
        { object: "unexpected", reason: "unexpected" },
      ]),
    );
  });

  it("reports missing, unexpected and mismatched restored records", async () => {
    await expect(
      reconcileRecords(
        [
          { id: "a", state: "active" },
          { id: "b", state: "active" },
        ],
        [
          { id: "a", state: "revoked" },
          { id: "c", state: "active" },
        ],
        ({ id }) => id,
      ),
    ).resolves.toEqual({
      consistent: false,
      missingIds: ["b"],
      unexpectedIds: ["c"],
      mismatchedIds: ["a"],
    });
  });

  it("canonicalizes record keys for stable checksums", () => {
    expect(canonicalJson({ z: 1, a: { y: 2, x: 3 } })).toBe(
      '{"a":{"x":3,"y":2},"z":1}',
    );
  });

  it("authenticates the manifest and rejects tampering or a wrong key", async () => {
    const manifest = await createBackupManifest({
      backupId: "backup:opaque:authenticated",
      createdAt: now,
      objects: [{
        name: "database/export.jsonl",
        bytes: new TextEncoder().encode('{"id":"record:001"}\n'),
        recordCount: 1,
        schemaVersion: "schema:local:001",
      }],
    });
    const authenticationKey =
      "backup-authentication-key-kept-separate-from-storage";
    const envelope = await authenticateBackupManifest({
      manifest,
      keyId: "backup-auth-key:local:001",
      authenticationKey,
    });
    await expect(
      verifyAuthenticatedBackupManifest({ envelope, authenticationKey }),
    ).resolves.toBe(true);
    await expect(
      verifyAuthenticatedBackupManifest({
        envelope,
        authenticationKey:
          "wrong-backup-authentication-key-with-enough-bytes",
      }),
    ).resolves.toBe(false);

    const tampered = structuredClone(envelope);
    tampered.manifest.createdAt += 1;
    await expect(
      verifyAuthenticatedBackupManifest({
        envelope: tampered,
        authenticationKey,
      }),
    ).resolves.toBe(false);
  });

  it("encrypts backup objects with bound AES-256-GCM metadata", async () => {
    const object = {
      name: "database/export.jsonl",
      bytes: new TextEncoder().encode('{"account":"private"}\n'),
      recordCount: 1,
      schemaVersion: "schema:local:001",
    };
    const encryptionKey = new TextEncoder().encode(
      "0123456789abcdef0123456789abcdef",
    );
    const first = await encryptBackupObject({
      backupId: "backup:opaque:encrypted",
      object,
      keyId: "backup-encryption-key:local:001",
      encryptionKey,
    });
    const second = await encryptBackupObject({
      backupId: "backup:opaque:encrypted",
      object,
      keyId: "backup-encryption-key:local:001",
      encryptionKey,
    });

    expect(first.encryption.algorithm).toBe("AES-256-GCM");
    expect(first.encryption.nonceBase64Url).not.toBe(
      second.encryption.nonceBase64Url,
    );
    expect(first.ciphertextBase64Url).not.toContain("private");
    const decrypted = await decryptBackupObject({
      envelope: first,
      encryptionKey,
      expected: {
        backupId: "backup:opaque:encrypted",
        keyId: "backup-encryption-key:local:001",
        name: object.name,
      },
    });
    expect({
      ...decrypted,
      bytes: [...decrypted.bytes],
    }).toEqual({
      ...object,
      bytes: [...object.bytes],
    });
  });

  it("rejects encrypted backup tampering, swaps, wrong keys and weak keys", async () => {
    const object = {
      name: "database/export.jsonl",
      bytes: new TextEncoder().encode('{"account":"private"}\n'),
      recordCount: 1,
      schemaVersion: "schema:local:001",
    };
    const encryptionKey = new TextEncoder().encode(
      "0123456789abcdef0123456789abcdef",
    );
    const envelope = await encryptBackupObject({
      backupId: "backup:opaque:encrypted",
      object,
      keyId: "backup-encryption-key:local:001",
      encryptionKey,
    });
    const expected = {
      backupId: "backup:opaque:encrypted",
      keyId: "backup-encryption-key:local:001",
      name: object.name,
    };
    const tamperedCiphertext = structuredClone(envelope);
    const firstCiphertextCharacter =
      tamperedCiphertext.ciphertextBase64Url.slice(0, 1);
    tamperedCiphertext.ciphertextBase64Url =
      `${firstCiphertextCharacter === "A" ? "B" : "A"}${
        tamperedCiphertext.ciphertextBase64Url.slice(1)
      }`;
    const tamperedMetadata = structuredClone(envelope);
    tamperedMetadata.encryption.associatedData.recordCount = 2;

    for (const attempt of [
      {
        envelope: tamperedCiphertext,
        encryptionKey,
        expected,
      },
      {
        envelope: tamperedMetadata,
        encryptionKey,
        expected,
      },
      {
        envelope,
        encryptionKey: new TextEncoder().encode(
          "fedcba9876543210fedcba9876543210",
        ),
        expected,
      },
      {
        envelope,
        encryptionKey,
        expected: { ...expected, name: "database/other.jsonl" },
      },
    ]) {
      await expect(decryptBackupObject(attempt)).rejects.toThrow(
        "Backup object decryption failed",
      );
    }

    await expect(
      encryptBackupObject({
        backupId: "backup:opaque:encrypted",
        object,
        keyId: "backup-encryption-key:local:001",
        encryptionKey: "too-short",
      }),
    ).rejects.toThrow("exactly 256 bits");
  });
});
