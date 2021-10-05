import { GenerateReportFilters } from "@interTypes/reports";
import { Pagination } from "./pagination.model";

export interface ReportsApiResponse {
    pagination: Pagination;
    results: ReportItem[];
}
export interface Link{
    key: string;
    label: string;
    target: string;
    url: string;
}
export interface Category{
    code: string;
    createdAt: string;
    isActive: boolean;
    name: string;
    order: number;
    siteId: string;
    updatedAt: string;
    _id: string;
}
export interface CostType{
    code: string;
    createdAt: string;
    isActive: boolean;
    name: string;
    order: number;
    siteId: string;
    updatedAt: string;
    _id: string;
}
export interface Type{
    code: string;
    contractReportCategoryId: string;
    createdAt: string;
    isActive: boolean
    name: string;
    order: number;
    siteId: string;
    updatedAt: string;
    _id: string;
}
export interface Metadata{
    category: string;
    categoryData: Category;
    costType: string;
    costTypeData: CostType;
    displayName: string;
    endDate: string;
    rawPayload: GenerateReportFilters;
    startDate: string;
    type: string;
    typeData: Type;
}
export interface ReportItem {
    _id: string;
    createdAt: string;
    module: string;
    owner: string;
    retentionDate: string;
    siteId: string;
    type: string;
    updatedAt: string;
    link: Link;
    metadata: Metadata;
}