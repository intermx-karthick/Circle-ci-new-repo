import { RecordsPagination } from '@interTypes/pagination';

interface FeeBasis {
  _id: string;
  name: string;
}

interface CommissionBasis {
  _id: string;
  name: string;
}

interface Billing {
  feeBasis: FeeBasis;
  media: string;
  commissionBasis: CommissionBasis;
}

interface FeeBasis2 {
  _id: string;
  name: string;
}

interface CommissionBasis2 {
  _id: string;
  name: string;
}

interface OohRevenue {
  isSameAsBilling: boolean;
  feeBasis: FeeBasis2;
  media: string;
  commissionBasis: CommissionBasis2;
}

interface BusinessCategory {
  _id: string;
  name: string;
}

interface DiversityOwnership {
  _id: string;
  name: string;
}

interface ClientType {
  _id: string;
  name: string;
}

interface Division {
  _id: string;
  name: string;
}

interface Office {
  _id: string;
  name: string;
}

interface PrdScheme {
  _id: string;
  name: string;
}

interface EstScheme {
  _id: string;
  name: string;
}

interface EstTiming {
  _id: string;
  name: string;
}

interface InstallBasis {
  _id: string;
  name: string;
}

interface CancellationPrivilege {
  _id: string;
  name: string;
}

interface ContractTermsType {
  _id: string;
  name: string;
}

export interface FilteredClient {
  billing: Billing;
  oohRevenue: OohRevenue;
  isParent: boolean;
  isOpsApproved: boolean;
  isCurrent: boolean;
  interCompanyRcv: boolean;
  oiClientApproved: boolean;
  businessCategory: BusinessCategory[];
  diversityOwnership: DiversityOwnership[];
  doNotUse: boolean;
  _id: string;
  clientName: string;
  clientType: ClientType;
  division: Division;
  office: Office;
  mediaAgency: string;
  agencyContact: string;
  creativeAgency: string;
  creativeAgencyContact: string;
  phone: string;
  fax: string;
  companyEmail: string;
  website: string;
  address: string;
  state: string;
  city: string;
  managedBy: string;
  operationsContact: string;
  mediaClientCode: string;
  incomeAcctCode: string;
  prdScheme: PrdScheme;
  estScheme: EstScheme;
  estTiming: EstTiming;
  install: string;
  installBasis: InstallBasis;
  oiRev: string;
  oiClientCode: string;
  creditRating: string;
  cancellationPrivilege: CancellationPrivilege;
  contractTermsType: ContractTermsType;
  retirementDate: Date;
  createdBy: string;
  updatedBy: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterClientsResponse {
  pagination: RecordsPagination;
  results: FilteredClient[];
}



