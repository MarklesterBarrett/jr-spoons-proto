
import { MENU } from "@/lib/menu";

function norm(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/*export function findCandidates(query: string): MenuItem[] {
    const q = norm(query);

    // quick heuristics for the demo
    if (q.includes("guinness")) return MENU.filter(m => m.tags.includes("guinness") && m.tags.includes("pint"));
    if (q.includes("crisp")) return MENU.filter(m => m.tags.includes("crisps"));

    // fallback simple contains match
    return MENU.filter(m => norm(m.name).includes(q));
}*/


type ClientContext = {
    // single selection or multi selection depending on requiredCount
    snacks?: string | string[];
};

function crispsOptions(): string[] {
    // For Choice display, return clean flavour labels
    return MENU
        .filter(item => item.tags.includes("crisps"))
        .map(item =>
            item.name
                .replace(/\s*Crisps$/i, "")
                .trim()
        );
}

function parseCrispsParts(prompt: string): string[] {
    // Split only when "and" joins items, not flavours
    // "salt and vinegar and a bag of cheese and onion" -> [ "...salt and vinegar", "...cheese and onion" ]
    return prompt.split(/\s+and\s+(?=(a|one|\d+)\s+(bag|packet)\b)/i);
}

function parseSingleCrispsRequest(part: string): { qty: number; flavour?: string } | null {
    // quantity
    const numeric = part.match(/(\d+)\s+(bags?|packets?)(\s+of)?\s+crisps?\b/i);
    const qtyFromNumber = numeric ? Number(numeric[1]) : 0;

    const singular = /\b(a|one)\s+(bag|packet)(\s+of)?\s+crisps?\b/i.test(part);
    const qty = qtyFromNumber || (singular ? 1 : 0);

    if (!qty) return null;

    // flavour (simple deterministic recognition from menu options)
    const opts = crispsOptions();
    const partNorm = normaliseSnacksChoice(part);

    const matched = opts.find(opt => partNorm.includes(normaliseSnacksChoice(opt)));

    return { qty, flavour: matched };
}

function parseSnacksIntent(prompt: string): {
    wantsSnacks: boolean;
    totalBags: number;
    specifiedFlavours: string[];
} {
    const wantsSnacks = /\bcrisps?\b/i.test(prompt);
    if (!wantsSnacks) return { wantsSnacks: false, totalBags: 0, specifiedFlavours: [] };

    const parts = parseCrispsParts(prompt);
    const requests = parts
        .map(parseSingleCrispsRequest)
        .filter((x): x is { qty: number; flavour?: string } => Boolean(x));

    // If user said just "two bags of crisps" with no "a bag" phrasing,
    // the regex above might miss it - catch that too:
    let totalBags = requests.reduce((sum, r) => sum + r.qty, 0);

    if (!totalBags) {
        const simpleNumeric = prompt.match(/(\d+)\s+bags?\s+of\s+crisps?\b/i);
        if (simpleNumeric) totalBags = Number(simpleNumeric[1]);

        const simpleSingular = /\b(a|one)\s+bag\s+of\s+crisps?\b/i.test(prompt) ||
            /\b(a|one)\s+packet\s+of\s+crisps?\b/i.test(prompt);
        if (!totalBags && simpleSingular) totalBags = 1;

        // If they just said "crisps" with no qty - default 1
        if (!totalBags) totalBags = 1;
    }

    const specifiedFlavours = requests
        .map(r => r.flavour)
        .filter((f): f is string => typeof f === "string");

    return { wantsSnacks: true, totalBags, specifiedFlavours };
}

function requestSnacks(requiredCount: number) {
    return new Response(
        JSON.stringify({
            type: "Choice",
            props: {
                prompt:
                    requiredCount > 1
                        ? `Choose crisp flavours`
                        : "Which crisps would you like?",
                options: crispsOptions(),
                name: "crisps",
                requiredCount,
            },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
}

export function normaliseSnacksChoice(value: string): string {
    return value
        .trim()
        .replace(/\s*&\s*/g, " and ")
        .replace(/\s+/g, " ")
        .toLowerCase();
}

/**
 * Call this from your route:
 * - returns Response if you need to ask a question
 * - otherwise returns resolved crisp selections and qty
 */
export function resolveSnacks(prompt: string, context: ClientContext) {
    const intent = parseSnacksIntent(prompt);
    if (!intent.wantsSnacks) return { ok: true as const, qty: 0, flavours: [] as string[] };

    // If prompt already specified flavours like:
    // "a bag of salt and vinegar and a bag of cheese and onion"
    // then we can treat those as the chosen flavours (qty implied 1 each)
    if (intent.specifiedFlavours.length >= intent.totalBags) {
        return {
            ok: true as const,
            qty: intent.totalBags,
            flavours: intent.specifiedFlavours.slice(0, intent.totalBags),
        };
    }

    // Context can provide a single choice or multi-choice
    const chosen = context.snacks;

    const chosenList =
        typeof chosen === "string"
            ? [chosen]
            : Array.isArray(chosen) && chosen.every(x => typeof x === "string")
                ? chosen
                : [];

    // Need N selections if they asked for N bags
    const requiredCount = Math.max(1, intent.totalBags);

    if (chosenList.length !== requiredCount) {
        return requestSnacks(requiredCount);
    }

    return { ok: true as const, qty: intent.totalBags, flavours: chosenList };
}

export function resolveDrinks(prompt: string) {
    const wantsGuinness = /\bguinness\b|\bguiness\b/i.test(prompt);
    const guinnessQtyMatch = prompt.match(/(\d+)\s+pints?/i);
    const guinnessQty = guinnessQtyMatch ? Number(guinnessQtyMatch[1]) : (wantsGuinness ? 1 : 0);
    return { wantsGuinness, guinnessQty };
}

