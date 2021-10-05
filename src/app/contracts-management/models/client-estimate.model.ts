import { NestedItem } from "./contract.model"

export interface ClientEstimate {
  _id: string;
  billing: Billing;
  clientId: string;
  createdAt: string;
  createdBy: string;
  estimate: Estimate[];
  estimateName: string;
  oohRevenue:OohRevenue;
  product: any;
  productCode: number
  productName: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Billing {
  commissionBasis: NestedItem;
  feeBasis: NestedItem;
  media: number;
}

interface OohRevenue {
  commissionBasis: NestedItem;
  feeBasis: NestedItem;
  media: number;
}

interface Estimate {
  clientRequirementCode: any;
  endDate: string;
  etimateId: number;
  startDate: string;
  tbd: boolean
  _id: string;
}