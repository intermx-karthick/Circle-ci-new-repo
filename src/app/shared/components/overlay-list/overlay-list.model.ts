export interface OverlayListInputModel {
    label: string;
    value: any;
}

export interface OverlayListModel {
    label: string;
    value: any;
    selected: boolean;
    isHide: boolean;
}

export interface OverlayListResponseModel {
    result: OverlayListInputModel[];
    pagination: any
}

export interface Pagination {
    perPage: number;
    page: number;
}

export class LoadMoreItemsModel {
    searchText: string;
    pagination: Pagination;
    constructor(text: string, pageDetails: Pagination) {
        this.searchText = text;
        this.pagination = pageDetails;
    }
}

export class ApplyFilterModel {
    selectedItem: OverlayListModel[];
    searchString: string;
  }