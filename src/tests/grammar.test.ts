import { describe, expect, it } from "vitest";
import { agreeAdjective } from "../lib/engine/grammar";
import { normalizeTitle, titleCase } from "../lib/engine/text";
import { parseTemplate, slotsInTemplate } from "../lib/engine/templates";

describe("grammar (port of test_grammar.py)", () => {
  it("masculine kept", () => {
    expect(agreeAdjective("oscuro", "masculine", "singular")).toBe("oscuro");
  });
  it("feminine o->a", () => {
    expect(agreeAdjective("oscuro", "feminine", "singular")).toBe("oscura");
  });
  it("no gender no change", () => {
    expect(agreeAdjective("neon", null, null)).toBe("neon");
  });
});

describe("text utils", () => {
  it("normalize lower + collapse", () => {
    expect(normalizeTitle("  Midnight   DREAMS ")).toBe("midnight dreams");
  });
  it("title case en", () => {
    expect(titleCase("midnight dreams", "en")).toBe("Midnight Dreams");
  });
  it("title case es keeps connectors", () => {
    expect(titleCase("sombra de la noche", "es")).toBe("Sombra de la Noche");
  });
});

describe("templates", () => {
  it("parses slots vs literals", () => {
    expect(parseTemplate("Lost NOUN")).toEqual([
      { kind: "literal", value: "Lost" },
      { kind: "slot", value: "noun" },
    ]);
    expect(slotsInTemplate("ADJ NOUN")).toEqual(["adjective", "noun"]);
  });
});
