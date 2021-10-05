import { MatPaginatorIntl } from '@angular/material/paginator';
import { Injectable } from '@angular/core';

@Injectable()
export class IMXMatPaginator extends MatPaginatorIntl {
  itemsPerPageLabel = 'Rows';
}
