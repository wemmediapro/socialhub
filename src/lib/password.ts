import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a plain password for storage. Safe to call multiple times
 * (e.g. on every save); only hashes if the value is not already a bcrypt hash.
 */
export function hashPassword(plain: string): string {
  if (plain.startsWith("$2")) {
    return plain;
  }
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

/**
 * Compare a plain password with a stored hash (or legacy plain text for migration).
 */
export function comparePassword(plain: string, stored: string): boolean {
  if (stored.startsWith("$2")) {
    return bcrypt.compareSync(plain, stored);
  }
  return plain === stored;
}

/**
 * Returns true if the stored value is already a bcrypt hash (so we can re-hash on first login).
 */
export function isHashed(stored: string): boolean {
  return stored.startsWith("$2");
}
