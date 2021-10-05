import { RecordsPagination } from '@interTypes/pagination';

export interface Logo {
  _id: string;
  name: string;
  path: string;
  url: string;
  createdAt: Date;
  createdBy: string;
  key: string;
  type: string;
}

export interface LogosListResponse {
  pagination: RecordsPagination;
  result: Result;
}
export interface Result {
  attachments: Logo[];
  createdAt: Date;
  createdBy: string;
  organizationId: string;
  siteId: string;
  updatedAt: Date;
  updatedBy: string;
  _id: string;
}
