import {
  BillingCompany,
  BillingContact, Estimate,
  GenericBilling
} from '@interTypes/records-management/clients/clients-common-models';


export interface Product {
  _id: string;
  name: string;
}

export interface ClientEstimateDetailsResponse {
  _id: string;
  product: Product;
  productCode: string;
  estimateName: string;
  estimate: Estimate[];
  tbd: string;
  billingCompany: BillingCompany;
  billingContact: BillingContact;
  billing: GenericBilling;
  oohRevenue: GenericBilling;
  updatedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  clientRequirementCode: string; // not available in spec
}

