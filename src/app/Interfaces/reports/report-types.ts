export interface Pagination {
    total: number;
    found: number;
    page: number;
    perPage: number;
    perSize: number;
}

export interface Report {
    _id: string;
    name: string;
    isActive: boolean;
    siteId: string;
    createdAt: Date;
    updatedAt: Date;
    order: number;
    category: string;
}

export interface ReportTypeResponse {
    pagination: Pagination;
    results: Report[];
}

