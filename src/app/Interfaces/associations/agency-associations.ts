import { Accounting, Agency, Client, Product } from "./associations";

export interface AgencyAssociations {
    agencies: Agency[];
    accounting: Accounting[];
    product: Product[];
}
