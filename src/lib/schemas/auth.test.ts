import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/schemas/auth";

describe("auth schemas", () => {
  it("loginSchema accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "a@b.co", password: "pwd" });
    expect(result.success).toBe(true);
  });

  it("loginSchema rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "invalid", password: "pwd" });
    expect(result.success).toBe(false);
  });

  it("loginSchema rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.co", password: "" });
    expect(result.success).toBe(false);
  });
});
