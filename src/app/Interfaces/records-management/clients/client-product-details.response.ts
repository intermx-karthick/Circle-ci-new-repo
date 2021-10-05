import {
  BillingCompany,
  BillingContact,
  GenericBilling
} from './clients-common-models';

export interface ClientProductDetailsResponse {
  _id: string;
  productCode: string;
  productName: string;
  billingCompany: BillingCompany;
  billingContact: BillingContact;
  billing: GenericBilling;
  oohRevenue: GenericBilling;
  updatedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  oiProduct: boolean;
}

