export interface ContactPayload {
  firstName: string;
  lastName: string;
  title?: string;
  type?: string;
  companyType: string;
  companyId: string;
  email?: [string];
  mobile?: string;
  office?: string;
  ext?: string;
  fax?: string;
  address?: Address;
  isActive: boolean;
  current: boolean;
  note?: string;
}

export interface Address {
  line: string;
  zipcode: string;
  city: string;
  state: string | State;
}

export interface ContactType {
  _id: string;
  name: string;
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface State {
  _id: string;
  geo_id: string;
  name: string;
  short_name: string;
  geo_type: string;
}

export interface Note {
  _id: string;
  notes: string;
}
export interface Contact {
  _id: string;
  address: Address;
  email: string[];
  firstName: string;
  lastName: string;
  title: string;
  type: string;
  mobile: string;
  office: string;
  ext: string;
  fax: string;
  isActive: boolean;
  current: boolean;
  companyId: string | CompanyId;
  companyName: string;
  companyType: string;
  note: Note;
  createdBy: string;
  updatedBy: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyId {
  _id: string;
  organizationType: string;
  name: string;
  parentCompany: string | ParentCompany;
}

export interface ParentCompany {
  name: string
  organizationType: string
  _id: string
}

export interface Filter {
  name: string;
  ids: string[];
}

export interface ContractEventPayload {
  filter: Filter;
}


export interface ContractEventPagination {
  total: number;
  page: number;
  perPage: number;
  pageSize: number;
  found: number;
}

export interface ContractEventResult {
  _id: string;
  name: string;
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractEventResponse {
  pagination: ContractEventPagination;
  results: ContractEventResult[];
}

export interface ContactResponse {
  pagination: ContractEventPagination;
  results: Contact[];
}

export interface ContactFilter {
  firstName: string;
  lastName: string;
  email: string;
  states: string[];
  officeIds: string[];
  companyIds: string[];
  companyTypes: string[];
  ids: string[];
  city: string;
  current: boolean;
}

export interface ContactFilterPayload {
  search: string;
  filter: ContactFilter;
}