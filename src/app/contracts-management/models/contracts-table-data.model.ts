import { Sort } from "@angular/material/sort";
import { ContractsPagination } from "./contracts-pagination.model";
import { ContractsTableItem } from "./contracts-table-item.model";

export interface ContractsTableData {
    found?: number;
    total?: number;
    contractTableItems?: ContractsTableItem[];
    pagination?: ContractsPagination
}

export interface ContractsTableModalData extends ContractsTableData {
    pagination?: ContractsPagination,
    sort: Sort
}