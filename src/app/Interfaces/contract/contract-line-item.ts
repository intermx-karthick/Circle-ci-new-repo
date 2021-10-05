export interface LineItemPagination {
  total?: number;
  found?: number;
  page: number;
  perPage: number;
  pageSize?: number;
}

export interface Dma {
  id: string;
  name: string;
}

export interface Cbsa {
  id: string;
  name: string;
}

export interface Media {
  dma: Dma;
  cbsa: Cbsa;
  isDigital: boolean;
  mediaType: string;
  geopathSpotId: string;
  vendorSpotId: string;
  mediaClass: string;
  vendorMediaName: string;
  material: string;
  placementType: string;
  structureType: string;
  placeCategory: string;
  state: string;
  city: string;
  mediaDescription: string;
  lat: number;
  lng: number;
  mediaUnitQty: number;
  venueQty: number;
  spotsPerLoop: number;
  spotsInRotation: number;
  spotDuration: number;
  unitHeight: string;
  unitWidth: string;
  impression: string | number;
  vendorUnit: string | number;
}

export interface Import {
  id: string;
  key: string;
  importedDate: Date;
  rowNumber: number;
  skipStatus: boolean;
  skippedFields: string[];
}

export interface Item {
  _id: string;
  name: string;
}

export interface ClientProduct {
  _id: string;
  productCode: string;
  productName: string;
}

export interface Vendor {
  _id: string;
  name: string;
  email: string;
  organizationId: string;
  billingEmail: string;
  parentCompanyId: string;
  parentCompany: string;
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

export interface Primary {
  _id: string;
  email: any[];
  firstName: string;
  lastName: string;
  companyType: string;
  companyId: CompanyId;
}

export interface VendorRep {
  primary: Primary;
  secondary: string;
}

export interface Product {
  _id: string;
  deletedAt?: any;
  productCode: string;
  productName: string;
  billingCompany?: any;
  billingContact?: any;
  clientId: string;
  siteId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Estimate {
  _id: string;
  etimateId: string;
  startDate: string;
  endDate: string;
  tbd: boolean;
  clientRequirementCode: string;
}

export interface FeeBasis {
  _id: string;
  name: string;
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface CommissionBasis {
  _id: string;
  name: string;
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface Billing {
  feeBasis: FeeBasis;
  media: string;
  commissionBasis: CommissionBasis;
}

export interface OohRevenue {
  feeBasis: FeeBasis;
  media: string;
  commissionBasis: CommissionBasis;
}

export interface ClientEstimate {
  _id: string;
  product: Product;
  productCode: string;
  estimateName: string;
  estimate: Estimate;
  clientId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  billing: Billing;
  oohRevenue: OohRevenue;
  productName: string;
}

export interface Contract {
  _id: string;
  contractName: string;
  contractId: number;
}

export interface Period {
  gross: number;
  tax: number;
  fee: number;
  clientNet: number;
}

export interface Total {
  net: number;
  agencyComm: number;
  gross: number;
  tax: number;
  fee: number;
  clientNet: number;
}

export interface CostSummary {
  period: Period;
  total: Total;
}

export interface LineItem {
  _id: string;
  media: Media;
  revisedAt?: any;
  cancelledAt?: any;
  deletedAt?: any;
  import: Import;
  lineItemId: string;
  contractId: string;
  lineItemType: Item;
  itemStatus: Item;
  buyMethod: Item;
  doNotExport: boolean;
  clientProduct: ClientProduct;
  vendor: Vendor;
  parentVendor?: any;
  vendorRep: VendorRep;
  company: string;
  resellerRep: string;
  clientEstimate: ClientEstimate;
  noOfPeriods: number;
  startDate: number;
  endDate: number;
  net: number;
  agencyCommission: number;
  tax: number;
  IODates: any[];
  contractNotes: string;
  prodNotes: string;
  clientNotes: string;
  intNotes: string;
  siteId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  code: number;
  contract: Contract;
  costSummary: CostSummary;
  installs: string;
  periodLength: string;
}

export interface LineItemsResponse {
  pagination: LineItemPagination;
  results: LineItem[];
}

