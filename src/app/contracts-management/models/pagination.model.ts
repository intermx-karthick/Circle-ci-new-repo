export interface Pagination  {
    total?: number, 
    found?: number,
    page: number, 
    perPage: number,
    pageSize?: number
  }