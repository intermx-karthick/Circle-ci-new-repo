import { Pagination } from "./pagination.model";

export interface ContractsSearchBuyerApi {
  pagination: Pagination,
  result: any[],
  results?: any[],
}