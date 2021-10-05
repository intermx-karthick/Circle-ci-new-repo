export interface BulkExportRequest {
  aud: string;
  aud_name: string;
  orientation?: 'portrait' | 'landscape';
  panel_id: string[];
  custom_panel_ids?: string[];
  type: 'inventory_details';
  site?: string;
  report_format?: 'pdf' | 'csv';
  columns?: BulkExportColumns;
  target_geography?: string;
  market_name?: string;
  market_type?: string;
  target_segment?: string;
  base_segment?: string;
  period_days?: number;
  target_geography_list?: Array<any>;
}
export interface BulkExportColumns {
  plant_operator?:  'Plant Operator';
  frame_id?:  'Geopath ID';
  plant_frame_id?:  'Plant Unit ID';
  media_type?:  'Media Type';
  imp?:  'Total Weekly Impressions';
  imp_target?:  'Target Impressions';
  index_comp_target?:  'Target Audience Index';
  reach_pct?:  'Reach';
  freq_avg?:  'Target In-Market Frequency';
  imp_inmkt?:  'Total In-Market Impressions';
  pct_imp_target_inmkt?:  'Target % In-Market Impressions';
  pct_comp_imp_target?:  'Target % Impression Comp';
  trp?:  'Target In-Market Rating Points';
  pct_imp_inmkt?:  'Total % In-Mkt Impr.';
  classification_type?:  'Classification';
  construction_type?:  'Construction';
  digital?:  'Material';
  max_height?:  'Height (ft & in)';
  max_width?:  'Width (ft & in)';
  primary_artery?:  'Primary Artery';
  zip_code?:  'ZIP Code';
  longitude?:  'Longitude';
  latitude?:  'Latitude';
  pct_comp_imp_target_inmkt?:  'Target % In-Market Impr. Comp.';
  illumination_type?:  'Illumination Type';
}
