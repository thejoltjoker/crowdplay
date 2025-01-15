import { describe, expect, it } from "vitest";

import { adjectives } from "./adjectives";
import { animals } from "./animals";
import {
  capitalize,
  randomAdjective,
  randomAnimal,
  randomString,
} from "./random-string";

describe("randomString helpers", () => {
  describe("capitalize", () => {
    it("should capitalize the first letter of a string", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("world")).toBe("World");
    });

    it("should return an empty string if input is empty", () => {
      expect(capitalize("")).toBe("");
    });
  });

  describe("randomAnimal", () => {
    it("should return a string from the animals array", () => {
      const result = randomAnimal();
      expect(animals).toContain(result);
    });
  });

  describe("randomAdjective", () => {
    it("should return a string from the adjectives array", () => {
      const result = randomAdjective();
      expect(adjectives).toContain(result);
    });
  });

  describe("randomString", () => {
    it("should return different strings on multiple calls", () => {
      const results = new Set();
      for (let i = 0; i < 10; i++) {
        results.add(randomString());
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
