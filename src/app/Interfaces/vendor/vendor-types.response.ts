export interface VendorTypesPagination {
  total?: number;
  page?: number;
  perPage?: number;
}

export interface VendorType {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface VendorTypesResponse {
  pagination: VendorTypesPagination;
  results: VendorType[];
}


