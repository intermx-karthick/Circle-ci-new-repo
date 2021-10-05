import { Pagination } from '@interTypes/pagination';
interface Type {
  _id: string;
  name: string;
}

interface Address {
  line: string;
  zipcode: string;
  city: string;
  state: string;
}

interface Billing {
  media: string;
  commissionBasis: string;
  feeBasis: string;
}

interface OohRevenue {
  sameAsBilling: boolean;
  media: string;
  commissionBasis: string;
  feeBasis: string;
}

export interface Agency {
  _id: string;
  name: string;
  organizationId: string;
  type: Type;
  isParent: boolean;
  division: string;
  office: string;
  managedBy: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  diversityOwnership: string;
  creditRating: string;
  cancellationPrivilege: string;
  current: boolean;
  note: string;
  retirementDate: string;
  intercompanyRcv: boolean;
  prdScheme: string;
  estScheme: string;
  estTiming: string;
  address: Address;
  billing: Billing;
  oohRevenue: OohRevenue;
  install: string;
  installBasis: string;
  OIRev: string;
  OIClientCode: string;
  OIClientApproved: boolean;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgenciesResponse {
  pagination: Pagination;
  results: Agency[];
}
