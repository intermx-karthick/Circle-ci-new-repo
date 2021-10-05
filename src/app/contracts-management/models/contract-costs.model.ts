import { Costs } from './contract.model';

export interface ContractCostsSummary {
    fieldName: string;
    costs: Costs
}

export interface ContractCostsDisplay {
    first?: ContractCostsSummary,
    middle?: ContractCostsSummary[]
    last: ContractCostsSummary; 
}