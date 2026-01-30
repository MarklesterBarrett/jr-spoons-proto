import type { ReactNode } from "react";

export type ChoiceProps = {
  prompt: string;
  options?: string[];
  name?: string;
  requiredCount?: number;
  input?: {
    type?: string;
    min?: number;
    max?: number;
    placeholder?: string;
  };
};

export type Card_Table_PromptProps = {
  prompt: string;
  buttonLabel?: string;
  input?: {
    type?: string;
    min?: number;
    max?: number;
    placeholder?: string;
  };
};

export type CardCheckoutProps = {
  table?: number;
  total?: string | { amount: number; currency: string };
  summary?: string[];
  message?: string;
  title?: string;
  status?: string;
  primaryAction?: { name: string; label: string };
  secondaryAction?: { name: string; label: string };
};

export type OrderSummaryProps = {
  table?: number;
  items?: { name: string; quantity: number; resolved?: boolean }[];
};

export type ErrorProps = {
  message: string;
};

export type CardConfirmationProps = {
  title: string;
  message: string;
  buttonLabel: string;
};

export type RenderContext = {
  snacks?: string | string[];
  tableInput: string;
  setTableInput: (value: string) => void;
  onSubmitTable: () => void;
  onChooseSnacks: (option: string, requiredCount?: number) => void;
  onRemoveCrispsAt: (index: number) => void;
  onPay: () => void;
  onReset: () => void;
  isPaying?: boolean;
  formatTotalDisplay?: (total?: CardCheckoutProps["total"]) => string;
};

export type Renderer<T> = (props: T, ctx: RenderContext) => ReactNode;

export const registry: {
  Choice: Renderer<ChoiceProps>;
  CardTablePrompt: Renderer<Card_Table_PromptProps>;
  CardCheckout: Renderer<CardCheckoutProps>;
  CardConfirmation: Renderer<CardConfirmationProps>;
  OrderSummary: Renderer<OrderSummaryProps>;
  Error: Renderer<ErrorProps>;
} = {
  Choice: (props, ctx) => {
    const requiredCount = props.requiredCount ?? 1;
    const chosenCount = Array.isArray(ctx.snacks) ? ctx.snacks.length : ctx.snacks ? 1 : 0;
    const chosenList = typeof ctx.snacks === "string" ? [ctx.snacks] : Array.isArray(ctx.snacks) ? ctx.snacks : [];

    return (
      <div className="mt-4">
        <div className="text-sm font-medium">{props.prompt}</div>

        {requiredCount > 1 ? (
          <div className="text-sm">
            Bag {chosenCount + 1} of {requiredCount}:
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          {(props.options ?? []).map((opt) => (
            <button key={opt} type="button" onClick={() => ctx.onChooseSnacks(opt, requiredCount)} className="rounded-lg cursor-pointer border-2 border-green-500  px-3 py-1.5 text-sm hover:bg-green-500 transistion">
              {opt}
            </button>
          ))}
        </div>

        {requiredCount > 1 ? (
          <div className="mt-3 text-sm">
            <ul role="list" className="mt-1 list-disc pl-0 max-w-md divide-y divide-slate-200">
              {Array.from({ length: requiredCount }).map((_, index) => {
                const value = chosenList[index];
                return (
                  <li key={`bag-${index}`} className="flex items-center justify-between py-2">
                    <div className={value ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
                      Bag {index + 1} - <span>{value ?? "flavour?"}</span>
                    </div>

                    {value ? (
                      <button type="button" onClick={() => ctx.onRemoveCrispsAt(index)} className="ml-3 cursor-pointer text-xs text-gray-900 dark:text-gray-100 hover:text-green-500">
                        Change
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    );
  },

  CardTablePrompt: (props, ctx) => (
    <div className="mt-4">
      <div className="text-sm font-medium">{props.prompt}</div>
      <div className="mt-2 flex gap-2">
        <input
          type={props.input?.type ?? "number"}
          min={props.input?.min}
          max={props.input?.max}
          value={ctx.tableInput}
          onChange={(e) => ctx.setTableInput(e.target.value)}
          placeholder={props.input?.placeholder ?? "Enter a number"}
          className="w-40 rounded-lg border px-3 py-2 text-sm"
        />
        <button type="button" onClick={ctx.onSubmitTable} className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
          {props.buttonLabel ?? "Set"}
        </button>
      </div>
    </div>
  ),

  CardCheckout: (props, ctx) => {
    const displayTotal = ctx.formatTotalDisplay?.(props.total);
    const primaryLabel = props.primaryAction?.label ?? (displayTotal ? `Yes, PAY ${displayTotal}` : "Yes, PAY");
    const secondaryLabel = props.secondaryAction?.label ?? "No, start over";

    return (
      <div className="mt-4 space-y-2 text-sm">
        {props.summary?.length ? (
          <div>
            <div className="font-medium">{props.message ? <div className="font-medium">{props.message}</div> : null}</div>
            <ul className="mt-1 list-disc pl-5">
              {props.summary.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {props.title ? <div className="font-medium">{props.title}</div> : null}

        <button type="button" onClick={ctx.onPay} disabled={ctx.isPaying} className="flex w-full max-[480px]:w-full min-[481px]:w-48 items-center justify-center cursor-pointer rounded-lg bg-green-500 px-4 py-2 text-white disabled:opacity-70">
          {primaryLabel}
          {ctx.isPaying ? <span className="inline-block ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <span className="inline-block ml-2">(mock)</span>}
        </button>
        <button
          type="button"
          onClick={ctx.onReset}
          className="flex w-full max-[480px]:w-full min-[481px]:w-auto 
        items-center justify-center cursor-pointer rounded-lg p-0 text-sm font-medium  text-red-600
        hover:underline hover:underline-offset-2 transition"
        >
          {secondaryLabel}
        </button>
      </div>
    );
  },

  CardConfirmation: (props, ctx) => (
    <>
      <h2 className="mt-2 text-xl font-semibold mb-2">{props.title}</h2>
      <p className="text-sm text-gray-500 mb-2">{props.message}</p>
      <button type="button" onClick={ctx.onReset} className="flex w-full max-[480px]:w-full min-[481px]:w-auto items-center justify-center cursor-pointer rounded-lg border border-transparent p-0 text-sm font-medium text-red-600  transition">
        {props.buttonLabel}
      </button>
    </>
  ),

  OrderSummary: (props) => (
    <div className="mt-3 space-y-2 text-sm">
      <div>
        <span className="font-medium">Table:</span> {props.table ?? "?"}
      </div>
      <ul className="list-disc pl-5">
        {(props.items ?? []).map((child, i) => (
          <li key={i}>
            {child.quantity} x {child.name} {!child.resolved ? <span className="text-gray-500">(needs choice)</span> : null}
          </li>
        ))}
      </ul>
    </div>
  ),

  Error: (props) => <div className="mt-3 text-sm text-red-600">{props.message}</div>,
};
