export type ClientContext = {
  snacks?: string | string[];
  table?: number;
};


export type OrderSummary = {
  type: "OrderSummary";
  table?: number;
  children?: { name: string; quantity: number; resolved?: boolean }[];
  props?: {
    table?: number;
    items?: { name: string; quantity: number; resolved?: boolean }[];
  };
};

export type Choice = {
  type: "Choice";
  props: {
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
};

export type CardTablePrompt = {
  type: "CardTablePrompt";
  props: {
    prompt: string;
    buttonLabel?: string;
    input?: {
      type?: string;
      min?: number;
      max?: number;
      placeholder?: string;
    };
  };
};

export type CardCheckout = {
  type: "CardCheckout";
  table?: number;
  total?: string | { amount: number; currency: string };
  summary?: string[];
  message?: string;
  title?: string;
  status?: string;
  primaryAction?: {
    name: string;
    label: string;
  };
  secondaryAction?: {
    name: string;
    label: string;
  };
};

export type CardConfirmation = {
  type: "CardConfirmation";
  props: {
    title: string;
    message: string;
    buttonLabel: string;
  };
};

export type ErrorTree = {
  type: "Error";
  message: string;
};

export type ServerTree =
  | OrderSummary
  | Choice
  | CardTablePrompt
  | CardCheckout
  | CardConfirmation
  | ErrorTree;
