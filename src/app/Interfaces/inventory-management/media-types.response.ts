export interface MediaType {
  id: number;
  name: string;
  description: string;
  updated_desc?: any;
}

export interface MediaTypesResponse {
  media_types: MediaType[];
}

