import { ErrorHandlerResponse } from '@interTypes/error-handler.response';

export interface createInventorySuccessResponse {
  status: string;
  ['api-message']: string;
  message: string;
  data: string[];
}

export type CreateInventoryResponse = createInventorySuccessResponse |
  ErrorHandlerResponse;
