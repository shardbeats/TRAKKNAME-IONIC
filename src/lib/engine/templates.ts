/** Pattern rendering — port of app/generator/templates.py */

export type SlotName = "adjective" | "noun" | "verb";
export type TemplatePart = { kind: "slot"; value: SlotName } | { kind: "literal"; value: string };

const SLOT_MAP: Record<string, SlotName> = {
  ADJ: "adjective",
  ADJECTIVE: "adjective",
  NOUN: "noun",
  VERB: "verb",
};

export function parseTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  for (const tok of template.split(/\s+/).filter(Boolean)) {
    const up = tok.toUpperCase();
    if (up in SLOT_MAP) parts.push({ kind: "slot", value: SLOT_MAP[up] });
    else parts.push({ kind: "literal", value: tok });
  }
  return parts;
}

export function slotsInTemplate(template: string): SlotName[] {
  return parseTemplate(template)
    .filter((p) => p.kind === "slot")
    .map((p) => (p as { kind: "slot"; value: SlotName }).value);
}
