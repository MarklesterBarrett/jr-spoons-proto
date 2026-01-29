import { getTableNumberFromPrompt, requestTableNumber } from "@/lib/userTableChoice";

export function resolveTableNumber(
    promptText: string,
    sessionTable?: number
): number | Response {
    // naive extraction - fine for prototype
    const tableParsedFromPrompt = getTableNumberFromPrompt(promptText);
    const tableNumber = Number.isInteger(tableParsedFromPrompt)
        ? tableParsedFromPrompt
        : sessionTable;

    // If table missing - ask (Choice)
    if (typeof tableNumber !== "number") {
        return requestTableNumber("What table number are you sat on?");
    }

    if (tableNumber && (tableNumber < 1 || tableNumber > 256)) {
        return requestTableNumber("Table not recognised (valid tables are 1-256)");
    }

    return tableNumber;
}
