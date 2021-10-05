interface Pagination {
  total: number;
  page: number;
  perPage: number;
  perSize: number;
}

export interface ClientDropDownValue {
  _id: string;
  name: string;
  isActive: boolean;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientDropDownResponse { //same of offices, client types, business categories as well
  pagination: Pagination;
  results: ClientDropDownValue[];
}



