import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";

export interface CreateContractDialog {
  clients: AppAutocompleteOptionsModel[];
  buyers: AppAutocompleteOptionsModel[];
  campaigns: AppAutocompleteOptionsModel[];
  preloadValues?: any;
}

export interface Client {
  id: string,
  value: string
}

export interface CreateContractResultDialog {
  client: Client,
  buyer: any,
  name: string,
  campagin: string,
  number: string,
}