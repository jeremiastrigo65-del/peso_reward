import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${Buffer.from(hash).toString("base64")}`;
}

export async function verifyPassword(password, savedPassword) {
  const [algorithm, encodedSalt, encodedHash] = String(savedPassword).split("$");
  if (algorithm !== "scrypt" || !encodedSalt || !encodedHash) return false;

  const actual = Buffer.from(encodedHash, "base64");
  const expected = Buffer.from(await scrypt(password, Buffer.from(encodedSalt, "base64"), KEY_LENGTH));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
