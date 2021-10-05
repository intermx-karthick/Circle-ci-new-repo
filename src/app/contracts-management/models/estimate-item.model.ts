export interface EstimateItem {
  estimateNumber?: number;
  startDate?: string;
  endDate?: string;
  fee?: string;
  oohComm?: string;
  billingComm?: string;
  startDateAsDate?: Date;
  endDateAsDate?: Date;
  commissionBasis?:string;
  media: number | string;
}
export interface IODate {
    date?: string;
    net?: number;
    estimateId?: string | number;
    id?: string | number;
}

export interface CostCalculation {
    marketRate?: string;
    installCost?: string;
    clientEstimate?: string;
    noOfPeriods?: number;
    periodLength?: string;
    startDate?: string;
    endDate?: string;
    net?: number;
    agencyCommission?: number;
    installs?: string;
    tax?: number;
    IODates?: IODate[];
    isAuto?: boolean;
    isPeriodFormValid?: boolean;
    isIOdateError?: boolean;
}
