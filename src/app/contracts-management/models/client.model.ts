import { FilteredClient } from "@interTypes/records-management";

export interface Client extends FilteredClient {
    organizationId: string;
}