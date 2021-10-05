export interface PlaceType {
  id: number;
  name: string;
  description: string;
  updated_desc?: any;
}

export interface PlaceTypesResponse {
  place_types: PlaceType[];
}



