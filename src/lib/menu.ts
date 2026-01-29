export type MenuItem = {
    id: string;
    name: string;
    pricePence: number;
    tags: string[];
};

export const MENU: MenuItem[] = [
    { id: "beer_guinness_pint", name: "Guinness", pricePence: 500, tags: ["beer", "pint", "guinness"] },
    { id: "crisps_ready_salted", name: "Ready Salted Crisps", pricePence: 100, tags: ["snacks", "crisps"] },
    { id: "crisps_cheese_onion", name: "Cheese and Onion Crisps", pricePence: 100, tags: ["snacks", "crisps"] },
    { id: "crisps_salt_vinegar", name: "Salt and Vinegar Crisps", pricePence: 100, tags: ["snacks", "crisps"] },
    { id: "nuts", name: "Nuts", pricePence: 999, tags: ["snacks", "nuts"] }
];

