import { Pagination } from "./pagination.model";

export interface ContractLineItemsApiResponce {
  lastImportedDetails:LastImportedDetails;
  pagination: Pagination;
  results: ContractLineItem[];
  search?: SearchValidity;
}
export interface SearchValidity {
  isValid: boolean;
}
export interface ImportStatus {
   skipStatus: boolean;
}
export interface ContractLineItem {
  agencyCommission: number;
  clientNet: number;
  endDate: string;
  media?: any;
  geopathSpotId: string;
  itemStatus: ItemStatus;
  clientProduct: ClientProduct;
  lineItemId: string;
  lineItemType: string;
  net: number;
  noOfPeriods: number;
  spotDetails: SpotDetails;
  startDate: string;
  tax: number;
  updatedAt: string;
  vendor: VendorInLineItem;
  import: ImportStatus;
  _id: string;
  totalSummary: {
    gross: number;
    fee: number;
    tax: number;
    net: number;
  };
}

export interface ClientProduct {
  productCode: string;
  productName: string;
  _id: string;
}

export interface ContractsLineItemsTable {
  lineItemId: string;
  lineItemType: string;
  lineItemStatus: string;
  market: string;
  vendor: string;
  mediaType: string;
  clientNet: string;
  description: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
  importskipStatus: boolean;
  _id: string;
  clientNetTotal?:string | number;
  fee?:string | number;
  gross?:string | number;
  tax?:string | number;
  net?:string | number;
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

interface VendorInLineItem {
  name: string;
  _id: string;
}

interface LastImportedDetails {
  errorLines: number;
  id: string;
  importedDate: string;
  importedLines: number;
  key: string;
  successLines: number
}
