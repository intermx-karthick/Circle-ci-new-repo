import { Estimate, GenericRevenue } from '@interTypes/records-management/clients/clients-common-models';

export interface ClientEstimatePayload {
  product: string;
  productCode: string;
  estimateName: string;
  estimate: Estimate[];
  tbd: boolean;
  clientRequirementCode: string;
  billingCompany: string;
  billingContact: string;
  billing: GenericRevenue;
  oohRevenue: GenericRevenue;
}

