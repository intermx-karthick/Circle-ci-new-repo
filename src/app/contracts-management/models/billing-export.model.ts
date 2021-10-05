import { Pagination } from "./pagination.model";

export interface BillingExportApiResponce {
  pagination: Pagination;
  results: BillingExportItem[];
}
export interface ImportStatus {
   skipStatus: boolean;
}
export interface BillingExportItem {
    IODateId: string;
    accountingDept: string,
    clientName: string;
    clientCode: string;
    deletedAt: string;
    deletedStatus: boolean;
    doNotExport: boolean;
    LIdoNotExport?: boolean;
    estimateName: string;
    estimateNumber: number;
    exportedAt: string;
    exportedStatus: boolean
    insertionDate: string;
    lineItemId: string;
    mediaDescription: string;
    netCost: number;
    parentVendor: ParentVendor;
    productCode: string;
    productName: string;
    revisedAt: string;
    vendor: VendorInBillingExport;
    _id: string;
}

export interface ParentVendor {
  _id: string;
  pubA: string;
  name: string;
}
export interface ClientProduct {
  productCode: string;
  productName: string;
  _id: string;
}

export interface BillingExportItemsTable {
    IODateId: string;
    accountingDept: string,
    clientName: string;
    clientCode: string;
    deletedAt: string;
    deletedStatus: boolean;
    doNotExport: boolean;
    LIdoNotExport?: boolean;
    estimateName: string;
    estimateNumber: number;
    exportedAt: string;
    exportedStatus: boolean
    insertionDate: string;
    lineItemId: string;
    mediaDescription: string;
    netCost?:string | number;
    parentVendor: string;
    productCode: string;
    productName: string;
    revisedAt: string;
    vendor: string;
    pubId: string;
    _id: string;
}

interface ItemStatus {
  name: string;
  _id: string;
}

interface SpotDetails {
  mediaDescription: string;
  mediaMarket: string;
  mediaType: string;
}

interface VendorInBillingExport {
  name: string;
  parentCompany: string;
  pubA: Pub;
  _id: string;
}

interface Pub {
  id: string;
  edition: string;
}

export interface IOExportsResponse {
  url: string;
  label: string;
  target: string;
  totalRecords: number;
  fileCountInZip: number;
  totalFiles: number;
  message?: string;
  success?: string;
}