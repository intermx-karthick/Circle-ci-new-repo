import { GenericRevenue } from '@interTypes/records-management/clients/clients-common-models';

export interface ClientProductDetailsPayload {
  productCode: string;
  productName: string;
  billingCompany: string;
  billingContact: string;
  billing: GenericRevenue;
  oohRevenue: GenericRevenue;
}



