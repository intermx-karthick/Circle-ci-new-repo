import { Accounting, Client, Product } from "./associations";

export interface ClinetAssociations {
    clients: Client[];
    accounting: Accounting[];
    product: Product[];
}