export interface PlaceTypeList {
  name: string;
  count?: any;
  selected?: boolean;
  loadMoreChild?: boolean;
  options?: PlaceTypeList[];
}
