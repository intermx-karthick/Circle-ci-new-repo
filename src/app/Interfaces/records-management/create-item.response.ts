export interface Data {
  id: string;
}

export interface CreateItemResponse {
  status: string;
  'api-message': string;
  message: string;
  data: Data;
}



