export interface Billing {
  feeBasis: string;
  media: number;
  commissionBasis: string;
}

export interface OohRevenue {
  feeBasis: string;
  media: number;
  commissionBasis: string;
  isSameAsBilling: boolean;
}

export interface CreateClientPayload {
  clientName: string;
  parentClient?: string;
  isParent: boolean;
  clientType: string;
  division: string;
  office: string;
  isOpsApproved?: boolean;
  isCurrent?: boolean;
  mediaAgency?: string;
  agencyContact?: string;
  creativeAgency?: string;
  creativeAgencyContact?: string;
  phone?: string;
  fax?: string;
  companyEmail?: string;
  website?: string;
  address?: string;
  state?: string;
  city?: string;
  managedBy: string;
  operationsContact?: string;
  notes?: string;
  mediaClientCode?: string;
  interCompanyRcv?: boolean;
  incomeAcctCode?: string;
  prdScheme?: string;
  estScheme?: string;
  estTiming?: string;
  billing?: Billing;
  oohRevenue?: OohRevenue;
  install?: number;
  installBasis?: string;
  oiRev?: number;
  oiClientCode?: string;
  oiClientApproved?: boolean;
  businessCategory?: string;
  diversityOwnership?: string;
  creditRating?: string;
  cancellationPrivilege?: string;
  contractTermsType?: string;
  doNotUse?: boolean;
  retirementDate?: Date;
  zipcode: string;
}

