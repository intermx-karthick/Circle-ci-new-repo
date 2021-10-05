import { AppAutocompleteOptionsModel } from "@shared/components/app-autocomplete/model/app-autocomplete-option.model";

export function AutocompleteMapper<T>(items: T[]): AppAutocompleteOptionsModel[] {
  if(!items) {
    return;
  }

  const autocompleteItems: AppAutocompleteOptionsModel[] = items.map((item: T) => {
      const autocompleteItem: AppAutocompleteOptionsModel = {
        id: item['_id'] || ( !!item['identities'] && !!item['identities'][0] ? item['identities'][0]['user_id'] : "" ),
        value: item['nickname'] || item['clientName'] || item['name'] || item['firstName'] + ' ' + item['lastName'] /* append last name while firstname exists */
      }

      return autocompleteItem;
  });

  return autocompleteItems;
}

export function AutocompleteUsersMapper(items: any[]): AppAutocompleteOptionsModel[] {
  if(!items) {
    return;
  }

  const autocompleteItems: AppAutocompleteOptionsModel[] = items.map((item) => {
      const autocompleteItem: AppAutocompleteOptionsModel = {
        id: item['_id'],
        value: item['email'],
        name: item['name']
      }

      return autocompleteItem;
  });

  return autocompleteItems;
}