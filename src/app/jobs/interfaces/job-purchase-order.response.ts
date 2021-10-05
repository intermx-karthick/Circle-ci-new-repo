import { JobsPagination } from "./job-pagination";

export interface JobPurchaseOrderPubA {
    id: string;
    edition: string;
}

export interface JobPurchaseOrderPrinter {
    _id: string;
    name: string;
    parentCompany: string;
    pubA: JobPurchaseOrderPubA;
}

export interface JobPurchaseOrderContact {
    email: string;
    name: string;
}

export interface JobPurchaseSignedDocument {
    caption: string;
    createdAt: string;
    createdBy: string;
    deletedAt: string;
    job: string;
    key: string;
    name: string;
    printer: string;
    siteId: string;
    type: string;
    updatedAt: string;
    updatedBy: string;
    url: string;
    _id: string;
}

export interface JobPurchaseOrder {
    _id: string;
    jobId: string;
    name: string;
    poNumber: string;
    printer: JobPurchaseOrderPrinter;
    startDate: string;
    contact: JobPurchaseOrderContact;
    updatedAt: Date;
    signedAttachment?: JobPurchaseSignedDocument;
}

export interface JobPurchaseOrderResponse {
    pagination: JobsPagination;
    results: JobPurchaseOrder[];
}


