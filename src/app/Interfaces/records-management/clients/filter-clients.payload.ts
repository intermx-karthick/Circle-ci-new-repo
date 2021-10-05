export interface ClientFilter {
  parentClient?: string;
  isParent?: boolean;
  mediaClientCode?: string;
  divisions?: string[];
  offices?: string[];
  clientOfAgency?: string[];
  managedBy?: string[];
  clientType?: string[];
  businessCategory?: string[];
  currentStatus?: boolean[];
  isCurrent?: boolean;
  city?: string;
  states?: string[];
}

export interface FilterClientsPayload {
  search?: string;
  filter?: ClientFilter;
}



