import { MENU } from "@/lib/menu";
import { calculateOrderTotalPence, buildSummary } from "@/lib/summary";

import {
    normaliseSnacksChoice,
    resolveSnacks,
    resolveDrinks,
} from "@/lib/menuChoices";

import { resolveTableNumber } from "@/lib/tableNumber";

export const runtime = "nodejs";

type ClientContext = {
    snacks?: string | string[];
    table?: number;
};

export async function POST(req: Request) {
    try {
        const requestBody = await req.json();

        const promptText = String(requestBody.prompt ?? "");
        const rawContext = (requestBody.context ?? {}) as Record<string, unknown>;

        const sessionContext: ClientContext = {
            snacks:
                typeof rawContext.snacks === "string" ||
                    (Array.isArray(rawContext.snacks) &&
                        rawContext.snacks.every(v => typeof v === "string"))
                    ? (rawContext.snacks as string | string[])
                    : undefined,
            table: typeof rawContext.table === "number" ? rawContext.table : undefined,
        };

        const orderTableNumberOrResponse = resolveTableNumber(promptText, sessionContext.table);
        if (orderTableNumberOrResponse instanceof Response) {
            return orderTableNumberOrResponse;
        }
        const orderTableNumber = orderTableNumberOrResponse;

        const drinkIntent = resolveDrinks(promptText);

        const snackIntentOrResponse = resolveSnacks(promptText, sessionContext);
        if (snackIntentOrResponse instanceof Response) {
            return snackIntentOrResponse;
        }

        const snackQuantity = snackIntentOrResponse.qty;
        const snackFlavours = snackIntentOrResponse.flavours; // chosen flavours

        // Build order lines and compute total using your menu helper
        const orderLineItems: Array<{ menuId: string; qty: number }> = [];

        if (drinkIntent.wantsGuinness && drinkIntent.guinnessQty > 0) {
            orderLineItems.push({
                menuId: "beer_guinness_pint",
                qty: drinkIntent.guinnessQty,
            });
        }

        if (snackQuantity > 0) {
            for (const flavour of snackFlavours) {
                const menuItemMatch = MENU.find(
                    item =>
                        item.tags.includes("snacks") &&
                        normaliseSnacksChoice(item.name).includes(normaliseSnacksChoice(flavour))
                );

                if (menuItemMatch) {
                    orderLineItems.push({ menuId: menuItemMatch.id, qty: 1 });
                }
            }
        }

        if (!orderLineItems.length) {
            return new Response(
                JSON.stringify({
                    type: "Error",
                    message: "Nothing to order yet. Please add Guinness or crisps.",
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        const orderTotalPence = calculateOrderTotalPence(orderLineItems);
        const orderTotalAmount = orderTotalPence;
        const orderSummary = buildSummary(orderLineItems);

        return new Response(
            JSON.stringify({
                type: "CardCheckout",
                title: "Ready to place this order?",
                status: "pending",
                table: orderTableNumber,
                summary: orderSummary,
                total: {
                    amount: orderTotalAmount,
                    currency: "GBP",
                },
                message: `Order for Table ${orderTableNumber}`,
                primaryAction: {
                    name: "pay",
                    label: `Yes, PAY £${(orderTotalAmount / 100).toFixed(2)}`,
                },
                secondaryAction: {
                    name: "reset",
                    label: "No, start over",
                },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("API /api/generate failed:", err);
        const message = err instanceof Error ? err.message : "Unknown server error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
