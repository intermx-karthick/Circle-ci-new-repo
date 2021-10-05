interface Limit {
  min: number;
  max: number;
}
export interface Threshold {
  inMarketCompIndex: Limit; // In-Market Target Audience Imp. Comp. Index
  targetCompPer: Limit; // Target Audience Imp. Comp. %
  inMarketCompPer: Limit; // In-Market Target Audience Imp. Comp. %
  targetImp: Limit; // Target Audience Impressions
}
export interface ThresholdFilter {
  inMarketCompIndex:  [number, number];
  targetCompPer: [number, number];
  inMarketCompPer: [number, number];
  targetImp:   [number, number];
}

export interface MarketThresholdFilter {
  inMarketCompIndex: [number, number];
  targetImp:   [number, number];
}


export interface ThresholdWidget {
  inMarketCompIndex: [number, number];
  targetImp:   [number, number];
}


/*************************************************************************************
 * threshold field vs label mapping discussed with API team,                         *
 *                                                                                   *
 * compim  => inMarketCompIndex  ------> In-Market Target Audience Imp. Comp. Index  *
 * comptot => targetCompPer -----------> Target Audience Imp. Comp. %                *
 * tgtinmi => inMarketCompPer ---------> In-Market Target Audience Imp. Comp. %      *
 * tgtwi   => targetImp  --------------> Target Audience Impressions                 *
 *                                                                                   *
 *************************************************************************************/
