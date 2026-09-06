import { describe, it, expect } from "vitest";

const BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function generateShortCode(length = 7): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE58_CHARS.length);
    result += BASE58_CHARS[randomIndex];
  }
  return result;
}

describe("Base58 ShortCode Generator", () => {
  it("generates strings of specified length", () => {
    const code = generateShortCode(7);
    expect(code).toHaveLength(7);
  });

  it("only contains Base58 characters (no ambiguous 0, O, I, l)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateShortCode(8);
      expect(code).toMatch(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);
      expect(code).not.toContain("0");
      expect(code).not.toContain("O");
      expect(code).not.toContain("I");
      expect(code).not.toContain("l");
    }
  });

  it("produces high entropy with zero collisions in sample run", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const code = generateShortCode(7);
      expect(set.has(code)).toBe(false);
      set.add(code);
    }
    expect(set.size).toBe(1000);
  });
});
