import {ThresholdFilter} from './threshold';

export interface Filters {
  audience: any;
  market: any;
  /*scheduleDeliver: any;*/
  mediaAttributes: any;
  orientationList: any;
  illuminationHrsRange: any;
  mediaTypeList: any;
  operatorList: any;
  location: any;
  geoPanelId: any;
  plantUnitId: any;
  inventorySet: any;
  scenario: any;
  sortQuery: any;
  selectQuery: any;
  selectedFids: any;
  selectQueryLimited: any;
  mapPosition: any;
  thresholds: Partial<ThresholdFilter>;
  inventory_market_list: any;
  period_days: number;
  rotating?: boolean;
  placesList: any;
  measuresRelease: number;
}
