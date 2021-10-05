import {GeographySet} from '@interTypes/Population';

export class Market {
  id: any;
  name: string;
  type?: string;
}

export type  MarketType = 'DMA' | 'CBSA' | 'County' | 'National' | 'GEO_SET';

export type  SelectionType = 'Single' | 'Multi';

export type ModuleName = 'explore' | 'place' | 'workspace';

type marketSubmitType = 'individual' | 'group';

export interface MarketSelectorConfig {
  groupSelectionEnabled: boolean;
  singleButtonLabel: string;
  groupButtonLabel: string;
  cancelButtonLabel: string;
  allowedGeoTypes: MarketType[];
}

export interface SelectedMarket {
  slno: number;
  name: string;
  id: string;
  count: number;
}
export interface MarketSelectionState {
  selectedMarkets: SelectedMarket[];
  selected: string;
  type: MarketType;
  submitType: marketSubmitType;
  selectedGeographySet?: GeographySet;
  
}
export interface GeographySetsState {
  type: string;
  selectedGeographySets: GeographySet;
}
