export interface EstimateSearchPagination {
    total?: number;
    page?: number;
    perPage?: number;
    perSize?: number;
    found?: number;
}

export interface Product {
    _id: string;
    name: string;
}

export interface Estimate {
    etimateId: string;
    startDate: Date;
    endDate: Date;
}

export interface BillingCompany {
    _id: string;
    name: string;
    billingEmail: string;
    phone: string;
    fax: string;
    organizationType: string;
}

export interface Type {
    _id: string;
    name: string;
}

export interface BillingContact {
    _id: string;
    type: Type;
    firstName: string;
    lastName: string;
}

export interface commonBase {
    _id: string;
    name: string;
}

export interface Billing {
    feeBasis: commonBase;
    media: string;
    commissionBasis: commonBase;
}

export interface EstimateData {
    _id: string;
    product: Product;
    productCode: string;
    estimate: Estimate;
    tbd: boolean;
    clientRequirementCode: string;
    billing: Billing;
    oohRevenue: Billing;
    billingCompany?: any;
    billingContact?: any;
    clientId: string;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    productName: string;
}

export interface EstimateSearchResponse {
    pagination: EstimateSearchPagination;
    results: EstimateData[];
}

export interface EstimateFilters {
    productIds?: any[];
    ids?: any[];
}

export interface EstimateSearchFilter {
    search?: string;
    filters?: EstimateFilters;
}