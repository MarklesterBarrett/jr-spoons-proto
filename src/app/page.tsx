"use client";

import { useState } from "react";
import { registry } from "@/lib/registry";
import { chooseSnacks, removeSnackAt, formatTotalDisplay } from "@/lib/helpers";
import type { ClientContext, ServerTree } from "@/lib/types";

export default function Page() {
  const [prompt, setPrompt] = useState("2 pints of guinness and a bag of crisps for table 19 please");
  const [ctx, setCtx] = useState<ClientContext>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [tree, setTree] = useState<ServerTree | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tableInput, setTableInput] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  async function send(text: string, context: ClientContext) {
    setIsStreaming(true);
    setApiError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, context }),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : `HTTP error: ${response.status}`;
        throw new Error(message);
      }

      setTree(data as ServerTree);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsStreaming(false);
    }
  }

  async function submit() {
    setLocalError(null);
    const text = prompt.trim();
    if (!text) return;

    try {
      await send(text, { ...ctx });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
    }
  }

  async function submitTable() {
    setLocalError(null);
    const value = tableInput.trim();
    const table = Number(value);
    const tablePrompt = tree?.type === "CardTablePrompt" ? tree : null;
    const min = tablePrompt?.props.input?.min ?? 1;
    const max = tablePrompt?.props.input?.max ?? 256;
    if (!value || Number.isNaN(table) || table < min || table > max) {
      setLocalError(`Table not recognised (valid tables are ${min}-${max}). Please try again.`);
      return;
    }

    setTableInput("");
    const nextCtx = { ...ctx, table };
    setCtx(nextCtx);

    try {
      await send(`${prompt.trim()} for table ${table}`, nextCtx);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
    }
  }

  async function payAndShowConfirmation(table?: number) {
    if (isPaying) return;

    const t = typeof table === "number" ? table : (ctx.table ?? undefined);
    if (!t) {
      setLocalError("Missing table number - please set your table before paying.");
      return;
    }

    setIsPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsPaying(false);

    // clear order UI but keep the success screen
    setTree(null);
    setCtx({});
    setTableInput("");
    setApiError(null);

    setTree({
      type: "CardConfirmation",
      props: {
        title: "Order complete",
        message: `Table ${t} order is on it's way`,
        buttonLabel: "Start over",
      },
    });
  }

  function confirmTryAgain() {
    const confirmed = window.confirm("Discard this order and try again?");
    if (!confirmed) return;
    reset();
  }

  function reset() {
    setLocalError(null);
    setCtx({});
    setTree(null);
    setApiError(null);
    setTableInput("");
    setIsPaying(false);
  }

  const baseRenderContext = {
    snacks: ctx.snacks,
    tableInput,
    setTableInput,
    onSubmitTable: submitTable,
    onChooseSnacks: (option: string, requiredCount = 1) =>
      chooseSnacks({
        option,
        requiredCount,
        ctx,
        setCtx,
        prompt,
        send,
        setLocalError,
      }),
    onRemoveCrispsAt: (index: number) => removeSnackAt({ index, ctx, setCtx }),
    onPay: () => {},
    onReset: () => {},
    isPaying,
    formatTotalDisplay,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">A Deterministic Ordering UX</h1>
          <small className="text-gray-500">React 18. Only Guinness. and Crisps</small>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-lg  border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 cursor-pointer
    hover:bg-red-50  focus-visible:outline-none  focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition"
        >
          Reset
        </button>
      </div>

      {!tree ? (
        <div className="mt-6 flex flex-col gap-2 min-[481px]:flex-row">
          <label htmlFor="prompt" className="sr-only">
            Order prompt
          </label>
          <textarea name="prompt" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full min-[481px]:flex-1 rounded-lg border px-3 py-2 text-sm" />
          <button type="button" onClick={submit} disabled={isStreaming} className="w-full min-[481px]:w-[100px] rounded-lg bg-green-500 px-4 py-2 text-sm text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
            {isStreaming ? "Working" : "Proceed"}
          </button>
        </div>
      ) : null}

      {localError ? <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{localError}</div> : null}

      {apiError ? <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{apiError}</div> : null}

      <section className="mt-6 rounded-xl border p-4 border-gray-300">
        <div className="text-xs text-gray-500">Rendered UI (from JSON)</div>

        {!tree ? <div className="mt-3 text-sm text-gray-600">No output yet</div> : null}

        {tree?.type === "OrderSummary"
          ? registry.OrderSummary(
              {
                table: tree.props?.table ?? tree.table,
                items:
                  tree.props?.items ??
                  tree.children?.map((child) => ({
                    name: child.name,
                    quantity: child.quantity,
                    resolved: child.resolved,
                  })),
              },
              baseRenderContext,
            )
          : null}

        {tree?.type === "Choice" ? registry.Choice(tree.props, baseRenderContext) : null}

        {tree?.type === "CardTablePrompt" ? registry.CardTablePrompt(tree.props, baseRenderContext) : null}

        {tree?.type === "CardCheckout"
          ? (() => {
              const { type, ...props } = tree;
              return registry.CardCheckout(props, {
                ...baseRenderContext,
                onPay: () => payAndShowConfirmation(props.table),
                onReset: confirmTryAgain,
              });
            })()
          : null}

        {tree?.type === "Error"
          ? (() => {
              const { type, ...props } = tree;
              return registry.Error(props, baseRenderContext);
            })()
          : null}

        {tree?.type === "CardConfirmation" ? registry.CardConfirmation(tree.props, { ...baseRenderContext, onReset: reset }) : null}
      </section>

      <section className="mt-6 rounded-xl border p-4 border-gray-300">
        <div className="text-xs text-gray-500">Raw tree</div>
        <pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs">{tree ? JSON.stringify(tree, null, 2) : ""}</pre>
      </section>
    </main>
  );
}
