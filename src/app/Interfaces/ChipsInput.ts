export interface ChipSource<T> {
  label: string;
  data?: T;
}
export interface GroupAutocompleteChipSource<T> {
  label: string;
  data: ChipSource<T>[];
}
