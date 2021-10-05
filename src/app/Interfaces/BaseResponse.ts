export interface BaseResponse<T = null> {
  status: string;
  'api-message': string;
  message: string;
  data?: T;
}
