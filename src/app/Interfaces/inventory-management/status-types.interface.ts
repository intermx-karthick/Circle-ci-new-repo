export interface StatusType {
    id: number;
    name: string;
    description: string;
    updated_desc?: string;
}

export interface StatusTypeResponse {
  status_types: StatusType[];
}