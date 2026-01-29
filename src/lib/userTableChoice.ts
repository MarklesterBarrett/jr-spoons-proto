export function getTableNumberFromPrompt(prompt: string): number | undefined {
    const text = prompt.toLowerCase();

    // "table 19" or "table #19"
    const tableMatch = text.match(/\btable\s*#?\s*(\d+)\b/);
    if (tableMatch) return Number(tableMatch[1]);

    // "#19"
    const hashMatch = text.match(/#\s*(\d+)\b/);
    if (hashMatch) return Number(hashMatch[1]);

    // "for 19" but avoid "for 2 pints"/"for 1 bag"
    const forMatch = text.match(/\bfor\s*#?\s*(\d+)\b/);
    if (forMatch) {
        const after = text.slice(forMatch.index! + forMatch[0].length).trimStart();
        const nextWord = after.split(/\s+/)[0] ?? "";
        const forbidden = new Set(["pint", "pints", "packet", "packets", "bag", "bags", "crisps", "nuts"]);
        if (!forbidden.has(nextWord)) return Number(forMatch[1]);
    }

    return undefined;
}

export function requestTableNumber(prompt: string) {
    return new Response(
        JSON.stringify({
            type: "CardTablePrompt",
            props: {
                prompt,
                buttonLabel: "Set",
                input: {
                    type: "number",
                    min: 1,
                    max: 256,
                    placeholder: "Enter a number",
                },
            },
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }
    );
}
