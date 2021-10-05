export interface VendorsGroupPagination {
  total?: number;
  page?: number;
  perPage?: number;
}

export interface VendorGroup {
  _id: string;
  deletedAt?: any;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorsGroupSearchResponse {
  pagination?: VendorsGroupPagination;
  results?: VendorGroup[];
}
