import { NestedItem } from "app/contracts-management/models";
import { IContractCheckpoints } from "app/contracts-management/models/contract-checkpoints.model";
import { ContractEvent } from "app/contracts-management/models/contract-event.model";
import { ContractCheckpoints } from "./contract-checkpoints.enum";

export function MapToContractsCheckpoint(contractEvents: NestedItem[]): IContractCheckpoints {
  const contractCheckpoints: IContractCheckpoints = {
    clientSignedAuthorizationUploaded: findEventEntry(contractEvents, ContractCheckpoints.clientSignedAuthorizationUploaded),
    contractsSubmittedForReview: findEventEntry(contractEvents, ContractCheckpoints.contractsSubmittedForReview),
    vendorContractsApproved: findEventEntry(contractEvents, ContractCheckpoints.vendorContractsApproved),
    vendorContractsDistributed: findEventEntry(contractEvents, ContractCheckpoints.vendorContractsDistributed),
    approvedForBillingExport: findEventEntry(contractEvents, ContractCheckpoints.approvedForBillingExport),
  }

  return contractCheckpoints;
}

export function MapToSaveContractsCheckpoints(selected: IContractCheckpoints, events: ContractEvent[]): string[] {
  const keys: string[] = Object.keys(selected);
  const ids: string[] = [];

  for(let i = 0; i < keys.length; i++) {
    const current = keys[i];

    if(selected[current]) {
     ids.push(getSelectedEventId(ContractCheckpoints[current], events))
    }
  }

  return ids;
}

export function findEventEntry(contractEvents: NestedItem[], event: ContractCheckpoints): boolean {
  for(let i = 0; i < contractEvents.length; i++) {
    if(contractEvents[i].name === event) {
      return true;
    }
  }
}

function getSelectedEventId(eventName: string, events: ContractEvent[]) {
  for(let i = 0; i < events.length; i++) {
    if(events[i].name === eventName) {
      return events[i]._id;
    }
  }
}
