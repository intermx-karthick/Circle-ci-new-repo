export interface VendorTypesPagination {
    total?: number;
    page?: number;
    perPage?: number;
  }
  
  export interface VendorType {
    _id: string;
    name: string;
    parentCompanyId?: string;
    parentFlag?: boolean;
  }
  
  export interface VendorTypesResponse {
    pagination: VendorTypesPagination;
    results: VendorType[];
  }
  