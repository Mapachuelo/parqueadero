import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { env } from "../../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  return Buffer.from(env.PLATE_ENCRYPTION_KEY, "hex");
}

export function encryptPlate(plaintext: string): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted, iv, tag };
}

export function decryptPlate(encrypted: Buffer, iv: Buffer, tag: Buffer): string {
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
}

export function hashPlate(plate: string): string {
  return createHash("sha256").update(plate.toLowerCase()).digest("hex");
}

export function maskPlate(plate: string): string {
  if (plate.length <= 4) return plate;
  return plate.slice(0, plate.length - 4) + "****";
}

export function encryptPlateToBuffer(plate: string): Buffer {
  const { encrypted, iv, tag } = encryptPlate(plate);
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptPlateFromBuffer(buffer: Buffer | Uint8Array): string {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  return decryptPlate(encrypted, iv, tag);
}

export function uint8ArrayToBuffer(arr: Uint8Array): Buffer {
  return Buffer.from(arr);
}
