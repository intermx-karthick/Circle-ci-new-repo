import { JobsPagination } from "./job-pagination";

export interface JobLineItemPrinter {
    _id: string;
    name: string;
    parentCompany: string;
    uploadInstruction?: any;
    instructionUrl?: any;
    pubA?: any;
}

export interface JobLineItemMediaType {
    _id: string;
    name: string;
}

export interface JobLineItemDma {
    id: string;
    name: string;
}

export interface JobLineItemJobs {
    _id: string;
    name: string;
}

export interface JobLineItemResult {
    _id: string;
    lineItemId: string;
    printer: JobLineItemPrinter;
    startDate: string;
    mediaType: JobLineItemMediaType;
    dma: JobLineItemDma;
    materials: number;
    clientMaterialCost: number;
    clientCostTotal: number;
    revisedAt: number;
    createdAt: Date;
    jobs: JobLineItemJobs;
}

export interface JobLineItemsResponse {
    pagination: JobsPagination;
    results: JobLineItemResult[];
}
