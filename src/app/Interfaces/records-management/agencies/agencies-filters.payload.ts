export interface AgencyFilter {
  types?: string[];
  divisions?: string[];
  offices?: string[];
  managedBy?: string[];
  ids?: string[];
  onlyParent?: boolean;
}

export interface AgencyFilterPayload {
  search: string;
  filter: AgencyFilter;
}



