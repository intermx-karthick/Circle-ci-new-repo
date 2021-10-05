import { RecordsPagination } from '@interTypes/pagination';


interface BillingCompany {
  _id: string;
  name: string;
  billingEmail: string;
  phone: string;
  fax: string;
  organizationType: string;
}

interface Type {
  _id: string;
  name: string;
}

interface GenericBasis{
  _id: string;
  name: string;
}

interface BillingContact {
  _id: string;
  type: Type;
  firstName: string;
  lastName: string;
}

interface Billing {
  feeBasis: GenericBasis;
  media: string;
  commissionBasis: GenericBasis;
}

interface OohRevenue {
  feeBasis: GenericBasis;
  media: string;
  commissionBasis: GenericBasis;
}

export interface ClientProduct {
  _id: string;
  productCode: string;
  productName: string;
  billingCompany: BillingCompany;
  billingContact: BillingContact;
  billing: Billing;
  oohRevenue: OohRevenue;
}

export interface ClientProductsResponse {
  pagination: RecordsPagination;
  results: ClientProduct[];
}

