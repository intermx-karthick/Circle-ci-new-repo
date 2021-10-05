export interface Filter {
  parentVendors: string[];
  childVendors: string[];
  vendorReps: string[];
  vendorSecReps: string[];
  displayVendor: string;
}
export interface VendorFilter {
    filter: Filter;
  }
  