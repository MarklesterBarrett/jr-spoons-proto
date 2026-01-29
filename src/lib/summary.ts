import { MENU } from "@/lib/menu";

export function calculateOrderTotalPence(lines: { menuId: string; qty: number }[]): number {
    let total = 0;
    for (const l of lines) {
        const item = MENU.find(m => m.id === l.menuId);
        if (!item) continue;
        total += item.pricePence * l.qty;
    }
    return total;
}

export function formatGBP(pence: number): string {
    const pounds = (pence / 100).toFixed(2);
    return `GBP ${pounds}`;
}

export function buildSummary(lines: { menuId: string; qty: number }[]): string[] {
    const aggregated = new Map<string, number>();
    const order: string[] = [];

    for (const line of lines) {
        if (!aggregated.has(line.menuId)) {
            order.push(line.menuId);
            aggregated.set(line.menuId, line.qty);
        } else {
            aggregated.set(line.menuId, (aggregated.get(line.menuId) ?? 0) + line.qty);
        }
    }

    return order.map(menuId => {
        const item = MENU.find(m => m.id === menuId);
        const name = item ? item.name : menuId;
        const qty = aggregated.get(menuId) ?? 0;
        return `${qty} x ${name}`;
    });
}
