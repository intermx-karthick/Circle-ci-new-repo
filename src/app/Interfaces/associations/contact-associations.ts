import { Accounting, Client, Product } from "./associations";

export interface ContactAssociations {
    clients: Client[];
    accounting: Accounting[];
    product: Product[];
}