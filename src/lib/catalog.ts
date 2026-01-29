import { z } from "zod";
import { createCatalog } from "@json-render/core";

export const catalog = createCatalog({
    name: "spoons",
    components: {
        OrderSummary: {
            props: z.object({
                table: z.number().optional(),
                items: z.array(z.object({
                    name: z.string(),
                    quantity: z.number(),
                    resolved: z.boolean().optional()
                })).optional()
            })
        },

        OrderItem: {
            props: z.object({
                name: z.string(),
                quantity: z.number(),
                resolved: z.boolean()
            })
        },

        Choice: {
            props: z.object({
                prompt: z.string(),
                options: z.array(z.string()).optional(),
                name: z.string().optional(),
                requiredCount: z.number().optional(),
                input: z.object({
                    type: z.string().optional(),
                    min: z.number().optional(),
                    max: z.number().optional(),
                    placeholder: z.string().optional()
                }).optional()
            })
        },
        CardTablePrompt: {
            props: z.object({
                prompt: z.string(),
                buttonLabel: z.string().optional(),
                input: z.object({
                    type: z.string().optional(),
                    min: z.number().optional(),
                    max: z.number().optional(),
                    placeholder: z.string().optional()
                }).optional()
            })
        },

        CardCheckout: {
            props: z.object({
                title: z.string().optional(),
                status: z.string().optional(),
                table: z.number().optional(),
                summary: z.array(z.string()).optional(),
                total: z.union([
                    z.string(),
                    z.object({
                        amount: z.number(),
                        currency: z.string()
                    })
                ]).optional(),
                message: z.string().optional(),
                primaryAction: z.object({
                    name: z.string(),
                    label: z.string()
                }).optional(),
                secondaryAction: z.object({
                    name: z.string(),
                    label: z.string()
                }).optional()
            })
        },
        CardConfirmation: {
            props: z.object({
                title: z.string(),
                message: z.string(),
                buttonLabel: z.string()
            })
        },

        Error: {
            props: z.object({
                message: z.string()
            })
        }
    },
    actions: {
        pay: { description: "Pay for the current order" },
        reset: { description: "Reset the current order" }
    },
    validation: "strict"
});



const json = {
    "root": "order",
    "elements": {
        "order-summary": {
            "key": "order-summary",
            "type": "Text",
            "props": {
                "content": "2 x Pint of Guinness, 1 x Salt and Vinegar Crisps",
                "variant": "body"
            }
        },
        "table-input": {
            "key": "table-input",
            "type": "Input",
            "props": {
                "label": "Table number",
                "name": "table",
                "type": "number",
                "placeholder": "e.g. 19"
            }
        },
        "confirm-button": {
            "key": "confirm-button",
            "type": "Button",
            "props": {
                "label": "Place order",
                "variant": "primary",
                "actionText": "Sending order..."
            }
        }
    }
}
