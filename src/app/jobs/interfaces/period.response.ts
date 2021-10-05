import { Pagination } from "@interTypes/pagination";

export interface ApiIncoming<T> {
    pagination: Pagination;
    results?: T[];
    projects?: T[];
 }

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