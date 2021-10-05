export interface ClassificationType {
  id: number;
  name: string;
  description: string;
  updated_desc?: any;
}

export interface MediaClassResponse {
  classification_types: ClassificationType[];
}


