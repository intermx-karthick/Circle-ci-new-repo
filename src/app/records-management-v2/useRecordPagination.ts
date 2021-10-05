import { Pagination, RecordsPagination } from '@interTypes/pagination';
import { PageEvent } from '@angular/material/paginator/paginator';

export class UseRecordPagination  implements RecordsPagination{

  public page?: number = null;
  public pageSize?: number = null;
  public perPage?: number = null;
  public total?: number = null;
  public found?: number = null;
  private _value = {
    page: this.page,
    perPage: this.perPage,
    total: this.total,
    found: this.found
  }

  private _defaultSize = 10;

  constructor(recordsPagination: RecordsPagination) {
    this.page = recordsPagination.page;
    this.perPage = recordsPagination.perPage;
    this._defaultSize = recordsPagination.perPage;
  }

  public isPageSizeReachedTotal() {
    return this.page * this.perPage >= this.total;
  }

  public resetPagination() {
    this.page = 1;
    this.perPage = this._defaultSize;
    this.total = 0;
    this.found = 0;
    this._value = {
      page: this.page,
      perPage: this.perPage,
      total: this.total,
      found: this.found
    }
  }

  public moveNextPage() {
    this.page += 1;
  }

  public doPagination(event: PageEvent){
    this.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
  }

  public updateTotal(total){
    this.total = total;
  }

  public updateFound(found){
    this.found = found;
  }

  public getValues(): RecordsPagination{
    return {
      page: this.page,
      perPage: this.perPage,
      total: this.total,
      found: this.found
    }
  }

  // bind this on paginator
  public get value(){
    return this.getValues();
  }

  public set value(pagination: RecordsPagination ){
    this.page = pagination.page;
    this.perPage = pagination.perPage;
    this.total = pagination.total
    this.pageSize = pagination.perPage;
    this.found = pagination.found;

    this._value = {
      page: this.page,
      perPage: this.perPage,
      total: this.total,
      found: this.found
    }
  }

  public selfClone(){
    this.value = {...this._value}
  }
}
