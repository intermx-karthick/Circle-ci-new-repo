
interface Filter {
  contractId?: number;
  clientCode?: string;
  clientIds?: string[];
  parentClientIds?: string[];
  contractEvents?: string[];
  operationsContacts?: string[];
  vendorIds?: string[];
  parentVendorIds?: string[];
  primarySalesReps?: string[];
  secondarySalesReps?: string[];
  divisions?: string[];
  offices?: string[];
  buyers?: string[];
  contractName?: string;
  productName?: string;
  productCode?: string;
  estimate?: string;
  startDate?: string;
  endDate?: string;
  contractCreatedSince?: string;
  contractRevisedSince?: string;
}

export interface VendorContractSearch {
  filter: Filter;
}

export interface Pagination {
  total: number;
  found: number;
  page: number;
  perPage: number;
  pageSize: number;
}

export interface Id {
  vendorContractRep: string;
  contractId: string;
  contractVendor: string;
}

export interface Vendor {
  _id: string;
  name: string;
  email: string;
  organizationId: string;
  billingEmail: string;
}

export interface ParentVendor {
  _id: string;
  name: string;
  email: string;
  organizationId: string;
  billingEmail: string;
}

export interface ParentCompany {
  _id: string;
  organizationType: string;
  name: string;
}

export interface CompanyId {
  _id: string;
  organizationType: string;
  name: string;
  parentCompany: ParentCompany;
  organizationTypeId: string;
}

export interface Type {
  _id: string;
  name: string;
}

export interface PContact {
  _id: string;
  email: string[];
  firstName: string;
  lastName: string;
  companyType: string;
  companyId: CompanyId;
  type: Type;
  mobile: string;
  office: string;
}

export interface VendorRep {
  primary: PContact;
  secondary: PContact;
}

export interface VContractEvent {
  _id: string;
  name: string;
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface VClient {
  _id: string;
  clientName: string;
}

export interface Status {
  _id: string;
  name: string;
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
  code: string;
}

export interface VContract {
  _id: string;
  contractEvents: VContractEvent[];
  client: VClient;
  contractName: string;
  status: Status;
  contractId: number;
}

export interface SignedAttachment {
  _id: string;
  parentVendors: string[];
  childVendors: string[];
  vendorReps: string[];
  caption: string;
  contract: string;
  type: string;
  name: string;
  key: string;
  url: string;
  siteId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VContract {
  _id: string ;
  totalLineItems: number;
  vendor: Vendor[];
  parentVendor: ParentVendor[];
  vendorRep: VendorRep[];
  issueDate: string;
  createdDate: string;
  startDate: string;
  endDate: string;
  updatedDate: string;
  contract: VContract;
  signedAttachment: SignedAttachment;
}

export interface formatContract {
  _id?: Id | any;
  contractId?: string | number;
  contractName?: string;
  clientName?: string;
  vendorName?:string;
  vendorRep?: string;
  vendorEmail?:string;
  issueDate?: string;
  createdDate?: string;
  startDate?: string;
  endDate?: string;
  updatedDate?: string;
  signedAttachment?: SignedAttachment;
}

export interface VContractsResponse {
  pagination: Pagination;
  results: VContract[];
}

