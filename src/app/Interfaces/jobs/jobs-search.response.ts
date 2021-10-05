import { Pagination } from '@interTypes/reports';

export interface GenericNameAnId {
  _id: string;
  name: string;
}

export interface ParentClient {
  _id: string;
  clientName: string;
  id: string;
}

export interface MediaAgency {
  _id: string;
  name: string;
  organizationId: string;
  id: string;
}

export interface Client {
  _id: string;
  clientName: string;
  parentClient: ParentClient;
  mediaAgency: MediaAgency;
  creativeAgency?: any;
  mediaClientCode: string;
  id: string;
}

export interface Agency {
  _id: string;
  name: string;
  type: GenericNameAnId;
  id: string;
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

export interface ClientContact {
  email: any[];
  _id: string;
  firstName: string;
  lastName: string;
  type: GenericNameAnId;
  companyId: CompanyId;
  companyType: string;
  mobile?: any;
  office?: any;
  note?: any;
  id: string;
}

export interface CreativeAgency {
  _id: string;
  name: string;
  type: GenericNameAnId;
  id: string;
}

export interface DisplayCostOption {
  _id: string;
  name: string;
}


export interface JobResult {
  jobTotal: number;
  materialsTotal: number;
  shippingTotal: number;
  installationTotal: number;
  totalTax: number;
  totalFee: number;
  totalCommission: number;
  _id: string;
  checkPoints: GenericNameAnId[];
  client: Client;
  name: string;
  siteId: string;
  updatedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  jobId: string;
  acctgJobId: string;
  agency: Agency;
  billingCompany?: any;
  billingContact?: any;
  billingNote: string;
  clientContact: ClientContact;
  creativeAgency: CreativeAgency;
  displayCostOption: DisplayCostOption;
  dueDate: string;
  invoiceDate: string;
  invoiceId: string;
  oohMediaContact: string;
  poNumber: string;
  producer: GenericNameAnId;
  project: GenericNameAnId;
  startDate: string;
  status: GenericNameAnId;
  totalAuthorizedAmount: number;
  isFromDialog?: boolean;
}

export interface JobSearchResponse {
  pagination: Pagination;
  results: JobResult[];
}


