import { Pagination } from "./pagination.model";

export interface IOFilter {
    startDate: string;
    endDate: string;
    revisedSince?: string;
    createdSince?: string;
    divisions?: string[];
    offices?: string[];
    clientType?: string[];
    clientIds?: string[];
    contractNumber?: string;
    contractName?: string;
    isDeleted?: boolean;
    campaigns?: string[];
    estimate?: string;
    estimateName?: string[];
    lineItemIDs?: string[];
    itemStatus?: string[];
    contractStatus?: string[];
    parentClientIds?: string[];
    clientName?: string;
    productCode?: string;
    productIds?: string[];
    clientCode?: string;
    isDigital?: boolean;
    estimateNumber?: number[];
    agencies?: string[];
    vendorIds?: string[];
    parentVendorIds?: string[];
    reseller?: string[];
    products?: string[];
    mediaClasses?: string[];
    estimateIds?: string[];
    mediaTypes?: string[];
    dma?: string[];
    buyers?: string[];
    clientManagedBy?: string[];
    placeTypes?: string[];
    ids?: string[];
    excludedIds?: string[];
}

export interface InsertionOrderFilters {
    filter: IOFilter;
}

export interface IOVendor {
    _id: string;
    name: string;
    pubA: {
        id: string; edition: string;
    }
}

export interface InsertionOrder {
    clientCode?: string;
    productCode?: string;
    doNotExport?: boolean;
    deletedStatus?: boolean;
    exportedStatus?: boolean;
    accountingDept: string;
    estimateNumber?: string;
    clientName?: string;
    estimateName?: string;
    insertionDate: string;
    lineItemId: string;
    mediaDescription?: string;
    netCost?: number;
    productName?: string;
    vendor?: IOVendor;
    name: string;
    exportedAt?: string;
    revisedAt?: string;
    lineItem?: { _id: string, contract: { _id: string, client: { _id: string } } };
    _id: string;
}

export interface InsertionOrdersResponse {
    pagination: Pagination;
    results: InsertionOrder[];
}

