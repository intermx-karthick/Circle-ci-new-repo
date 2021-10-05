import { JobsPagination } from "./job-pagination";
export interface JobDetailsDropDownResult {
    _id: string;
    name: string;
    isActive: boolean;
    siteId: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
}

export interface JobDetailsDropDownResponse {
    pagination: JobsPagination;
    results: JobDetailsDropDownResult[];
}


