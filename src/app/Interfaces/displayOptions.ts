export interface CustomProps {
  customText: string;
  customLogo: string | File;
}
export interface FilterPillTypes {
  measuresRelease: boolean;
  audience: boolean;
  market: boolean;
  filters: boolean;
  // unitIds: boolean;
  deliveryWeeks: boolean;
  'saved view': boolean;
  geographySet: boolean;
}
export interface DisplayOptions {
  mapLegend: boolean;
  mapControls: boolean;
  pills: FilterPillTypes;
  filterPills: FilterPillTypes;
  customProps: CustomProps;
  baseMap: any;
}
