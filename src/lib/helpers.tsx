import type { ClientContext } from "@/lib/types";
import type { CardCheckout } from "@/lib/types";

type ChooseCrispsArgs = {
  option: string;
  requiredCount?: number;
  ctx: ClientContext;
  setCtx: (next: ClientContext) => void;
  prompt: string;
  send: (text: string, context: ClientContext) => Promise<void>;
  setLocalError: (message: string | null) => void;
};

export async function chooseSnacks({ option, requiredCount = 1, ctx, setCtx, prompt, send, setLocalError }: ChooseCrispsArgs) {
  setLocalError(null);
  const existing = ctx.snacks;
  const chosenList = typeof existing === "string" ? [existing] : Array.isArray(existing) ? existing : [];

  const nextChosen = requiredCount > 1 ? [...chosenList, option].slice(0, requiredCount) : option;
  const nextCtx = { ...ctx, snacks: nextChosen };
  setCtx(nextCtx);

  try {
    const hasEnough = requiredCount <= 1 || (Array.isArray(nextChosen) && nextChosen.length === requiredCount);
    if (hasEnough) {
      await send(prompt.trim(), nextCtx);
    }
  } catch (e) {
    setLocalError(e instanceof Error ? e.message : String(e));
  }
}

type RemoveCrispsAtArgs = {
  index: number;
  ctx: ClientContext;
  setCtx: (next: ClientContext) => void;
};

export function removeSnackAt({ index, ctx, setCtx }: RemoveCrispsAtArgs) {
  const existing = ctx.snacks;
  const chosenList = typeof existing === "string" ? [existing] : Array.isArray(existing) ? existing : [];
  if (!chosenList.length) return;
  const nextChosen = chosenList.filter((_, i) => i !== index);
  const nextCtx = { ...ctx, snacks: nextChosen.length ? nextChosen : undefined };
  setCtx(nextCtx);
}

export function formatTotalDisplay(total?: CardCheckout["total"]) {
  if (!total) return "";
  if (typeof total === "string") {
    return total.replace(/^GBP\s*/i, "GBP ");
  }
  const symbol = total.currency === "GBP" ? "GBP " : `${total.currency} `;
  const amount = total.currency === "GBP" ? total.amount / 100 : total.amount;
  return `${symbol}${amount.toFixed(2)}`;
}
