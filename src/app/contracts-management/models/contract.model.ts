import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";
import { Pagination } from "./pagination.model";

export interface ApiIncoming<T> {
   pagination: Pagination;
   results?: T[];
   projects?: T[];
}

export interface NestedItem {
  name: string | any;
  _id: string;
}

export interface Contract {
  _id: string;
  buyer: NestedItem;
  cancellationPrivilege: NestedItem;
  cancelledBy: string;
  canclledAt: string;
  client: Client;
  clientContact: ClientContact;
  contractEvents: NestedItem[];
  contractId: number;
  contractName: string;
  createdAt: string;
  createdBy: string;
  endDate: string;
  latestLineItemId: string;
  poNumber: string;
  project: NestedItem;
  revisedAt: string;
  revisedBy: string;
  startDate: string;
  status: Status;
  summary: Summary;
  totalAuthorizedAmount: number;
  totalLineItems: number;
  updatedAt: string;
  updatedBy: string;
}

export interface ContractDetails {
  id: string;
  contractId: number;
  contractName: string;
  startDate: Date;
  endDate: Date;
  status: Status;
  contractEvents: NestedItem[];
  buyer: any;
  campaign: AppAutocompleteOptionsModel;
  client: AppAutocompleteOptionsModel;
  mediaClientCode: string;
  summary: Summary;
  clientContact?: AppAutocompleteOptionsModel;
  poNumber?: string;
  totalAuthorizedAmount?: string;
}

export interface Costs {
  agencyComm?: number;
  clientNet?: number;
  fee?: number;
  gross?: number;
  net?: number;
  tax?: number;
}

interface ClientContact {
  companyId: string;
  companyType: string;
  createdBy: string;
  email: string[]
  firstName: string;
  id: string;
  lastName: string;
  mobile: string;
  office: string;
  updatedBy: string;
  _id: string;
}

interface Client {
  accounting: Accounting;
  clientName: string;
  mediaClientCode: string;
  office: Office;
  organizationId: string;
  _id: string;
}

interface Office {
  createdAt: string;
  isActive: boolean;
  name: string;
  order: number
  siteId: string;
  updatedAt: string;
  _id: string;
}

interface Accounting {
  _id: string;
  clientCode: string;
  accountingDept: NestedItem;
  fileSystemId: NestedItem
  pubIdType: NestedItem
}

interface Status {
  code: string;
  name: string;
  _id: string;
}

interface Summary {
  Extention: Costs;
  total: Costs;
}
