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
  media: number;
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
  media: number;
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

export interface Division {
  _id: string;
  name: string;
}

export interface Office {
  _id: string;
  name: string;
}

interface MediaAgency {
  _id: string;
  name: string;
}

interface Address {
  line: string;
  zipcode: string;
  city: string;
  state: string;
}

interface AgencyContact {
  firstName: string;
  lastName: string;
  title: string;
  type: string;
  email: string[];
  mobile: string;
  office: string;
  ext: string;
  fax: string;
  isActive: boolean;
  current: boolean;
  note: string;
  address: Address;
}

interface CreativeAgency {
  _id: string;
  name: string;
}

interface Address2 {
  line: string;
  zipcode: string;
  city: string;
  state: string;
}

interface CreativeAgencyContact {
  firstName: string;
  lastName: string;
  title: string;
  type: string;
  email: string[];
  mobile: string;
  office: string;
  ext: string;
  fax: string;
  isActive: boolean;
  current: boolean;
  note: string;
  address: Address2;
}

interface Address3 {
  line: string;
  state: string;
  city: string;
  zipcode: number;
}

interface ManagedBy {
  _id: string;
  name: string;
}

interface OperationsContact {
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

export interface ClientDetailsResponse {
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
  net: boolean;
  gross: boolean;
  acPercentage: boolean;
  clientNet: boolean;
  clientGross: boolean;
  commissionPercentage: boolean;
  feeAmount: boolean;
  taxAmount: boolean;
  taxPercentage: boolean;
  _id: string;
  clientName: string;
  clientType: ClientType;
  division: Division;
  office: Office;
  mediaAgency: MediaAgency;
  agencyContact: AgencyContact;
  creativeAgency: CreativeAgency;
  creativeAgencyContact: CreativeAgencyContact;
  phone: string;
  fax: string;
  companyEmail: string;
  website: string;
  address: Address3;
  managedBy: ManagedBy;
  operationsContact: OperationsContact;
  mediaClientCode: string;
  incomeAcctCode: string;
  prdScheme: PrdScheme;
  estScheme: EstScheme;
  estTiming: EstTiming;
  install: number;
  installBasis: InstallBasis;
  oiRev: number;
  oiClientCode: string;
  creditRating: string;
  cancellationPrivilege: CancellationPrivilege;
  contractTermsType: ContractTermsType;
  retirementDate: Date;
  updatedBy: string;
  createdBy: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

