export interface State {
  _id: string;
  deletedAt?: any;
  name: string;
  short_name?: string;
  geo_type?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateSearchResponse {
  pagination?: StateSearchPagination;
  results?: State[];
}

export interface StateSearchPagination {
  total?: number;
  page?: number;
  perPage?: number;
}