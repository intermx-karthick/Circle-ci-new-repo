export interface IllumnationType {
  id: number;
  name: string;
  description: string;
  updated_desc?: any;
}

export interface IllumnationTypeResponse {
  illumination_types: IllumnationType[];
}
