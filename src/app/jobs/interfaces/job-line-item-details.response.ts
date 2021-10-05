import { JobLineItemDma } from './job-line-items.response';

export interface JobLineItemParentClient {
    _id: string;
    clientName: string;
    id: string;
}

export interface JobLineItemClientType {
    _id: string;
    name: string;
}

export interface JobLineItemDivision {
    _id: string;
    name: string;
}

export interface JobLineItemOffice {
    _id: string;
    name: string;
}

export interface JobLineItemMediaAgency {
    _id: string;
    name: string;
    organizationId: string;
    id: string;
}

export interface Client {
    businessCategory: any[];
    _id: string;
    clientName: string;
    parentClient: JobLineItemParentClient;
    clientType: JobLineItemClientType;
    division: JobLineItemDivision;
    office: JobLineItemOffice;
    mediaAgency: JobLineItemMediaAgency;
    creativeAgency?: any;
    mediaClientCode: number;
    id: string;
}

export interface JobId {
    _id: string;
    client: Client;
    name: string;
    jobId: string;
}

export interface JobLineItemFeeBasis {
    _id: string;
    name: string;
}

export interface JobLineItemCommissionBasis {
    _id: string;
    name: string;
}

export interface JobLineItemBilling {
    feeBasis: JobLineItemFeeBasis;
    media: number;
    commissionBasis: JobLineItemCommissionBasis;
}

export interface JobLineItemClientProduct {
    _id: string;
    productCode: number;
    productName: string;
    billing: JobLineItemBilling;
}

export interface JobLineItemItemStatus {
    _id: string;
    name: string;
}

export interface JobLineItemType {
    _id: string;
    name: string;
}

export interface JobLineItemCompanyId {
    _id: string;
    organizationType: string;
    name: string;
    parentCompany?: any;
    organizationTypeId: string;
}

export interface JobLineItemContact {
    email: string[];
    _id: string;
    firstName: string;
    lastName: string;
    type: JobLineItemType;
    companyId: JobLineItemCompanyId;
    companyType: string;
    mobile: number;
    office: number;
    title: string;
    note?: any;
    id: string;
}

export interface JobLineItemPubA {
    id: string;
    edition: string;
}

export interface JobLineItemVendor {
    _id: string;
    name: string;
    parentCompany: string;
    pubA: JobLineItemPubA;
}

export interface JobLineItemDesignator {
    _id: string;
    designator: string;
    businessName?: any;
    email: string;
    contactName: string;
    address: string;
    city: string;
    state: string;
    zipcode: number;
    phoneNumber: string;
    stateCode: string;
}

export interface JobLineItemPeriodLength {
    _id: string;
    duration: number;
    unit: string;
    position: number;
    label: string;
    isDefault: boolean;
}

export interface JobLineItemSubstrateType {
    _id: string;
    name: string;
}

export interface JobLineItemShippingType {
    _id: string;
    name: string;
}

export interface JobLineItemDetails {
    _id: string;
    deletedAt?: any;
    jobId: JobId;
    clientProduct: JobLineItemClientProduct;
    itemStatus: JobLineItemItemStatus;
    contact: JobLineItemContact;
    vendor: JobLineItemVendor;
    designator: JobLineItemDesignator;
    startDate: string;
    filesDate: string;
    noOfPeriods: number;
    proofsDate: string;
    periodLength: JobLineItemPeriodLength;
    proofsApprovedDate: string;
    materialShippingDate: string;
    materialDeliveryDate: string;
    mediaType?: any;
    unitQty: number;
    venueType?: any;
    dma: JobLineItemDma;
    designQty: number;
    unitHeight: string;
    unitWidth: string;
    state: string;
    stateCode: string;
    substrateType: JobLineItemSubstrateType;
    materials: number;
    salesTax: number;
    shippingCost: number;
    shippingType: JobLineItemShippingType;
    installCost: number;
    printerNetTotal: number;
    oiCommissionAmt: number;
    oiCommissionPercentage: number;
    clientMaterialCost: number;
    clientCostTotal: number;
    clientNotes: string;
    vendorNotes: string;
    productionNotes: string;
    internalNotes: string;
    siteId: string;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    lineItemId: string;
}


