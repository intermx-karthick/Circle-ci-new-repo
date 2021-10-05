import { Pagination } from '@interTypes/Population';
import { Address, Contact } from '@interTypes/records-management';

export interface Type {
  _id: string;
  name: string;
}

export interface GenericName {
  name: string;
}

export interface Vendor {
  _id: string;
  name: string;
  parentCompany: string;
  email: string;
  uploadInstruction?: any;
  instructionUrl?: any;
  organizationId: string;
}

export interface Agency {
  _id: string;
  name: string;
  organizationId: string;
  id: string;
  type?: Type[];
}

export interface Client {
  _id: string;
  clientName: string;
  parentClient?: any;
  mediaClientCode: string;
  mediaAgency: Agency;
  creativeAgency: Agency;
  id: string;
}

export interface ClientContact {
  address: Address;
  email: any[];
  _id: string;
  firstName: string;
  lastName: string;
  companyId: CompanyId;
  companyType: string;
  mobile?: any;
  office?: any;
  fax?: any;
  note?: any;
  id: string;
}

export interface Type {
  _id: string;
  name: string;
}

export interface BillingCompany {
  address: Address;
  _id: string;
  organizationType: string;
  name: string;
  parentCompany: string;
  phone: string;
  fax: string;
  billingEmail?: any;
  parentCompanyId: string;
  organizationTypeId: string;
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

export interface BillingContact {
  address: Address;
  email: any[];
  _id: string;
  firstName: string;
  lastName: string;
  type: Type;
  companyId: CompanyId;
  companyType: string;
  mobile?: any;
  office: string;
  fax: string;
  note?: any;
  id: string;
}

export interface Jobs {
  _id: string;
  client: Client;
  name: string;
  jobId: string;
  dueDate: string;
  invoiceDate: string;
  producer: GenericName;
  startDate: string;
  totalAuthorizedAmount: number;
  clientContact: ClientContact;
  billingNote: string;
  acctgJobId: string;
  agency: Agency;
  billingCompany: BillingCompany;
  billingContact: BillingContact;
  creativeAgency: Agency;
  invoiceId: string;
  oohMediaContact: any;
  poNumber: string;
  jobNote: string;
}

export interface JobLineItemsSearchResult {
  _id: string;
  cancelledAt: string;
  printer: Vendor;
  contact: Contact;
  startDate: string;
  filesDate: string;
  noOfPeriods: number;
  proofsDate: string;
  proofsApprovedDate: string;
  materialShippingDate: string;
  materialDeliveryDate: string;
  mediaType: Type;
  unitQty: number;
  dma: Type;
  designQty: number;
  unitHeight: string;
  unitWidth: string;
  materials: number;
  salesTax: number;
  shippingCost: number;
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
  revisedAt: string;
  lineItemId: string;
  createdAt: Date;
  code: number;
  substrateType: GenericName;
  vendor: Vendor;
  jobs: Jobs;
}

export interface JobLineItemsSearchResponse {
  pagination: Pagination;
  results: JobLineItemsSearchResult[];
}


