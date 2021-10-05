export interface CDEHeaders {
    lineItemType?: string;
    itemStatus?: string;
    jsonPath?: string;
}

export interface CDEFilters {
    lineItemType?: string;
    itemStatus?: string;
    buyMethod?: string;
    clientProduct?: string;
    vendor?: string;
    vendorRep?: string;
}

export interface ContractDetailsExportPayload {
    headers?: CDEHeaders;
    filters?: CDEFilters;
}
