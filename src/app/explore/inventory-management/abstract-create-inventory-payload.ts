export interface RepresentationType {
  id: number;
  name: string;
  description: string;
}

export interface Account {
  id: number;
  name: string;
  operator_code: string;
  parent_account_id: number;
  parent_account_name: string;
}

export interface Representation {
  representation_type: RepresentationType;
  account: Account;
}

export interface Representations {
  [representationId: string]: Representation;
}

export interface RepresentationType2 {
  id: number;
  name: string;
  description: string;
}

export interface Account2 {
  id: number;
  name: string;
  operator_code: string;
  parent_account_id: number;
  parent_account_name: string;
}

export interface Representation2{
  representation_type: RepresentationType2;
  account: Account2;
}

export interface Representations2 {
  [representationId: string]: Representation2;
}

export interface RepresentationType3 {
  id: number;
  name: string;
  description: string;
}

export interface Account3 {
  id: number;
  name: string;
  operator_code: string;
  parent_account_id: number;
  parent_account_name: string;
}

export interface Representation {
  id: number;
  representation_type: RepresentationType3;
  account: Account3;
}

export interface Spot{
  uri: string;
  publisher_unique_id: string;
  length: number;
  full_motion: boolean;
  partial_motion: boolean;
  rotating: boolean;
  interactive: boolean;
  audio: boolean;
  share_of_voice: number;
  plant_spot_id: string;
  representations: Representation[];
}

export interface Spots {
  [id: string]: Spot;
}

export interface Face {
  uri ? : any;
  average_spot_length: number;
  publisher_unique_face_id: string;
  height: number;
  width: number;
  pixel_height ? : any;
  pixel_width ? : any;
  top_left_pixel_x ? : any;
  top_left_pixel_y ? : any;
  spots_in_rotation: number;
  representations: Representations2;
  spots: Spots;
}

export interface Faces {
  [id: string]: Face;
}

export interface Layout{
  uri ? : any;
  full_motion: boolean;
  partial_motion: boolean;
  rotating: boolean;
  interactive: boolean;
  audio: boolean;
  share_of_voice: number;
  representations: Representations;
  faces: Faces;
}

export interface Layouts {
  [id: string]: Layout;
}

export interface Geometry {
  type: string;
  coordinates: number[];
}

export interface Location {
  id: number;
  orientation: number;
  primary_read: string;
  primary_artery: string;
  level?: any;
  levels_visible?: any;
  latitude: number;
  longitude: number;
  block_id: string;
  elevation?: any;
  geo_point: string;
  geometry: Geometry;
  created_dtm: Date;
  updated_dtm: Date;
  dma_id: string;
  zip_code: string;
  county_name: string;
  state: string;
  time_zone: string;
}

export interface MediaType {
  id: number;
  name: string;
  description: string;
}

export interface StatusType {
  id: number;
  name: string;
  description: string;
}

export interface ConstructionType {
  id: number;
  name: string;
  description: string;
}

export interface RepresentationType4 {
  id: number;
  name: string;
  description: string;
}

export interface Account4 {
  id: number;
  name: string;
  operator_code: string;
  parent_account_id: number;
  parent_account_name: string;
}

export interface Representation2 {
  id: number;
  representation_type: RepresentationType4;
  account: Account4;
}

export interface Geometry2 {
  type: string;
  coordinates: number[];
}

export interface Location2 {
  id: number;
  orientation: number;
  primary_read: string;
  primary_artery: string;
  level?: any;
  levels_visible?: any;
  latitude: number;
  longitude: number;
  block_id: string;
  elevation?: any;
  geometry: Geometry2;
  created_dtm: Date;
  updated_dtm: Date;
  dma_id: string;
  zip_code: string;
  county_name?: any;
  state?: any;
  time_zone: string;
}

export interface Construction {
  id: number;
  name: string;
  description?: any;
  created_dtm: Date;
  updated_dtm: Date;
  construction_type: ConstructionType;
  representations: Representation2[];
  location: Location2;
  operating_hours: any[];
}

export interface PlacementType {
  id: number;
  name: string;
  description: string;
}

export interface RepresentationType5 {
  id: number;
  name: string;
  description: string;
}

export interface Account5 {
  id: number;
  name: string;
  operator_code: string;
  parent_account_id: number;
  parent_account_name: string;
}

export interface Representation3 {
  id: number;
  representation_type: RepresentationType5;
  account: Account5;
}

export interface IlluminationType {
  id: number;
  name: string;
  description: string;
}

export interface ClassificationType {
  id: number;
  name: string;
  description: string;
}

export interface AbstractCreateInventoryPayload {
  id: number;
  audio: boolean;
  notes?: any;
  digital: boolean;
  layouts: Layouts;
  location: Location;
  rotating: boolean;
  max_width: number;
  max_height: number;
  media_name: string;
  media_type: MediaType;
  created_dtm: Date;
  current_ind: boolean;
  description?: any;
  full_motion: boolean;
  interactive: boolean;
  status_type: StatusType;
  updated_dtm: Date;
  construction: Construction;
  partial_motion: boolean;
  placement_type: PlacementType;
  plant_frame_id: string;
  representations: Representation3[];
  construction_date: Date;
  illumination_type: IlluminationType;
  classification_type: ClassificationType;
  max_pixel_width?: any;
  illumination_end_time: string;
  max_pixel_height?: any;
  illumination_start_time: string;
  photos: any[];
}

