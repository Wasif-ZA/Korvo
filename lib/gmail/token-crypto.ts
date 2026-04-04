// lib/gmail/token-crypto.ts
// AES-256-GCM symmetric encryption for Gmail OAuth refresh tokens.
// Key must be 32 bytes stored as 64 hex chars in GMAIL_TOKEN_ENCRYPTION_KEY.
// Encoded format: iv(12 bytes) + authTag(16 bytes) + ciphertext, all base64.
//
// Source: Node.js crypto docs (https://nodejs.org/api/crypto.html)
// See: .planning/phases/05-gmail-send-deliverability/05-RESEARCH.md Pattern 2
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const envKey = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error(
      "GMAIL_TOKEN_ENCRYPTION_KEY is not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(envKey, "hex");
}

/**
 * Encrypts a Gmail refresh token using AES-256-GCM.
 * Returns base64-encoded string: iv(12) + authTag(16) + ciphertext.
 * Each call produces a different ciphertext due to a random IV.
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16-byte GCM auth tag
  // Format: iv(12) + authTag(16) + ciphertext — all base64
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a base64-encoded token produced by encryptToken.
 * Throws if the ciphertext has been tampered with (GCM auth tag mismatch)
 * or if the wrong key is used.
 */
export function decryptToken(encoded: string): string {
  const key = getKey();
  const data = Buffer.from(encoded, "base64");
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
