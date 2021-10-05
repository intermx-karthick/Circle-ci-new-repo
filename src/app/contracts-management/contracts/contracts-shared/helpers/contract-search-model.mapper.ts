import { ContractSearchForm } from "app/contracts-management/models/contaract-search-form.model";
import { ContractsSearch } from "app/contracts-management/models/search-contracts.model";

// TODO: fix value.buyer.length ? null : value.buyer
export function MapToContractSearch(value: ContractSearchForm): ContractsSearch {
  const contractsSearch: ContractsSearch = {
    search: value.contractId,
    filters: {
      buyer: value.buyer?._id,
      client: value?.clientName?.id,
      contractName: value.contactName,
      status: value.contactStatus,
      contractEvents: value.contractEvents,
      project: value.campaign,
      startDate: formatDate(value.start),
      endDate: formatDate(value.end),
    }
  }

  return contractsSearch;
}

function formatDate(initial: Date | any) {
  /* contract page breakdown due to string value passed here */
  /* blocked string values to avoid page break issue */
  if (!initial) {
    return;
  } else if (!!initial && Object.prototype.toString.call(initial) !== "[object Date]") {
    return initial;
  }

  return `${initial?.getMonth() + 1}/${initial?.getDate()}/${initial?.getFullYear()}`;
}