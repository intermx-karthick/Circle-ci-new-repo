import { ContractCostsSummary } from "app/contracts-management/models/contract-costs.model";

export function MapToContractCostsSummary(summary: any): ContractCostsSummary[] {

  const fields: string[] = Object.keys(summary);
  let resultCosts: ContractCostsSummary[] = [];

  for(let i = 0; i < fields.length; i++) {
    const key = fields[i];

    let coastsFields = Object.keys(summary[key]);
    let costsTemp = {};

    for(let j = 0; j < coastsFields.length; j++) {
      let costKey = coastsFields[j];

      if(summary[key][costKey] === null) {
        costsTemp[costKey] = 0
      } else {
        costsTemp[costKey] = summary[key][costKey];
      }
    }

    const cost: ContractCostsSummary = {
        fieldName: key,
        costs: {...costsTemp}
    }

    resultCosts.push(cost);
  }

  return resultCosts;
}