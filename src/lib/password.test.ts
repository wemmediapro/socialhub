import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, isHashed } from "@/lib/password";

describe("password", () => {
  it("hashes a plain password", () => {
    const plain = "secret123";
    const hashed = hashPassword(plain);
    expect(hashed).not.toBe(plain);
    expect(hashed.startsWith("$2")).toBe(true);
  });

  it("comparePassword returns true for matching plain vs hash", () => {
    const plain = "secret123";
    const hashed = hashPassword(plain);
    expect(comparePassword(plain, hashed)).toBe(true);
    expect(comparePassword("wrong", hashed)).toBe(false);
  });

  it("isHashed returns true for bcrypt hash", () => {
    const hashed = hashPassword("x");
    expect(isHashed(hashed)).toBe(true);
    expect(isHashed("plain")).toBe(false);
  });

  it("hashPassword is idempotent for already hashed value", () => {
    const hashed = hashPassword("secret");
    expect(hashPassword(hashed)).toBe(hashed);
  });
});
