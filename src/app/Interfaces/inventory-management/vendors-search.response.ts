import { ShippingAddress } from "@interTypes/records-management";

export interface VendorsSearchPagination {
  total?: number;
  page?: number;
  perPage?: number;
  found?: number;
}

export interface VendorContact {
  _id: string;
  name: string;
  email: string;
}

export interface Pub {
  id: string;
  edition: string;
}

export interface Vendor {
  _id?: string;
  deletedAt?: any;
  name?: string;
  contacts?: VendorContact[];
  parentCompany?: string;
  email?: string;
  taxIdNumber?: any;
  pubId?: any;
  accountId?: number;
  siteId?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  type?: any;
  groupId?: any;
  businessPhone?: any;
  businessFax?: any;
  businessWebsite?: any;
  addressLine1?: any;
  addressLine2?: any;
  city?: any;
  state?: any;
  country?: any;
  zipCode?: any;
  currentFlag?: any;
  opsApprovedFlag?: any;
  doNotUseFlag?: any;
  retirementDate?: any;
  diversityOwnership?: any;
  notesId?: any;
  updatedBy?: string;
  attachments?: any[];
  error?: any;
  parentFlag?: boolean;
  pubA?: Pub;
  pubB?: Pub;
  shippingAddress?: ShippingAddress[];
}

export interface VendorsSearchResponse {
  pagination: VendorsSearchPagination;
  results: Vendor[];
}

export interface VendorUpdateResponse {
  status?: string;
  message?: string;
  code?: number;
  error?: any;
}


export interface Filters {
  ids?: string[];
  parentCompany?: string;
  name?: string;
  type?: string | string[];
  state?: string;
  city?: string;
  currentFlag?: string;
  parentFlag?: string;
}

export interface VendorSearchPayload {
  search?: string;
  filters?: Filters;
}
