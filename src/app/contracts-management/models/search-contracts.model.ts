export interface ContractsSearch {
    search?: number,
    filters?: Filters
}

interface Filters {
  contractName?: string,
  buyer?: string;
  client?: string;
  project?: string;
  contractEvents?: string,
  status?: string;
  startDate?: string,
  endDate?: string
}