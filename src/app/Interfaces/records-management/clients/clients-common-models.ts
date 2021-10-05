export interface GenericBasis {
  _id: string;
  name: string;
}

export interface BillingCompany {
  _id: string;
  name: string;
  billingEmail: string;
  phone: string;
  fax: string;
  organizationType: string;
}

export interface BillingContactType {
  _id: string;
  name: string;
}

export interface BillingContact {
  _id: string;
  type: BillingContactType;
  firstName: string;
  lastName: string;
}

export interface GenericRevenue {
  feeBasis: string;
  media: string;
  commissionBasis: string;
}

export interface GenericBilling {
  feeBasis: GenericBasis;
  media: string;
  commissionBasis: GenericBasis;
}


export interface Estimate {
  etimateId: string;
  startDate: Date;
  endDate: Date;
  id: string;
}

