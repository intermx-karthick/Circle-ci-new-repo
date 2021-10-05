export interface Pagination {
  page: number;
  size: number;
  total?: number;
  perPage?: number;
  pageSize?: number;
}


export interface ProjectPagination {
  page: number;
  pageSize: number;
  perPage: number;
  total: number;
}

export interface RecordsPagination {
  page?: number;
  pageSize?: number;
  perPage?: number;
  total?: number;
  found?: number;
}

export interface ContractsPagination {
  page?: number;
  pageSize?: number;
  perPage?: number;
  total?: number;
  found?: number;
}
