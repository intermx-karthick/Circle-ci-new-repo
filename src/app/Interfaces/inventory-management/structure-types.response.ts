export interface ConstructionType {
  id: number;
  name: string;
  description: string;
  updated_desc: string;
}

export interface StructureTypesResponse {
  construction_types: ConstructionType[];
}


