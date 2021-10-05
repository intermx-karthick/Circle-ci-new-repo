export interface PeriodLength {
  createdAt: string;
  duration: number;
  isDefault: boolean;
  label: string;
  position: number;
  siteId: string;
  unit: string;
  updatedAt: string;
  _id: string;
}

export interface PeriodLengthForRecalculation {
  numberOfPeriods: string;
  periodLength: string;
  startDate: Date;
  endDate: Date;
}