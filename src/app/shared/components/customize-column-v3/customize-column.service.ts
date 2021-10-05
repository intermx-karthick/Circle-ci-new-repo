import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { CustomizeColumnV3Component } from './customize-column-v3.component';
import { CustomColumnOrigin } from '@interTypes/enums';
import { Helper } from '../../../classes';

/**
 * @description
 *   This service is  the reusable customize column
 *   code. This code will manage the customize the column
 *   state and provide the displaycolumns in mat row.
 *
 *   Call customizeColumn method while clicking customize icon
 * @example
 *
 *
 * ```TS
 *  @Component({template:'',providers: [CustomizeColumnService]})
 *  export class ClientsComponent{
 *    constructor(
 *       public customizeColumnService: CustomizeColumnService,
 *    ){
 *      const defaultColumns = [
 *      { displayname: 'Client Name', name: 'clientName' },
 *      { displayname: 'Agency', name: 'agency' },
 *      { displayname: 'Client Code', name: 'clientCode' },
 *      { displayname: 'Office', name: 'office' },
 *      { displayname: 'Managed By', name: 'managedBy' },
 *      { displayname: 'Parent', name: 'parentFlag' },
 *      { displayname: 'Current', name: 'currentFlag' },
 *      { displayname: 'Last Modified', name: 'updatedAt' }
 *      ];
 *
 *
 *    this.customizeColumnService.init({
 *      defaultColumns: defaultColumns,
 *      sortableColumns: Helper.deepClone(defaultColumns),
 *      cachedKeyName: CustomColumnsArea.CLIENTS_PLAN_TABLE,
 *      successCallback: () => this.cdRef.markForCheck()
 *      });
 *    }
 *  }
 *  ```
 *  bind displayedColumns directly from service
 *
 *  ```TS
 *  <mat-table>
 *    <mat-header-row *matHeaderRowDef="customizeColumnService.displayedColumns;sticky: true"></mat-header-row>
 *    <mat-row *matRowDef="let row; let i = index; columns: customizeColumnService.displayedColumns;" (mouseover)="onHoverRow(i)" class="clist-row"></mat-row
 *  </mat-table>
 *  ```
 *
 */
@Injectable()
export class CustomizeColumnService {
  public defaultColumns = [];
  public sortableColumns = [];
  public currentSortables: any;
  public columns = [];
  public displayedColumns = [];
  public cachedKeyName: string = '';

  constructor(
    private dialog: MatDialog
  ) {
  }

  public init({ defaultColumns, sortableColumns, cachedKeyName, successCallback }) {
    this.defaultColumns = defaultColumns;
    this.sortableColumns = sortableColumns;
    this.cachedKeyName = cachedKeyName;
    this.displayedColumns = this.defaultColumns.map((column) => column['name']);
    this.prepareColumns(successCallback);
  }

  public getDefaultColumns() {
    const currentSortables = this.defaultColumns.map((x) =>
      Object.assign({}, x)
    );
    const currentSortablesValues = currentSortables.map(
      (sortable) => sortable.name
    );
    const sortables = this.sortableColumns.filter((sort) => {
      return !currentSortablesValues.includes(sort['name']);
    });
    return {
      defaultCurrentSortables: currentSortables,
      defaultSortables: sortables
    };
  }

  public customizeColumn(successCallback: Function) {
    if (this.currentSortables && this.currentSortables.length > 0) {
      this.currentSortables = this.currentSortables.map((x) =>
        Object.assign({}, x)
      );
    } else {
      this.currentSortables = this.columns.map((x) => Object.assign({}, x));
    }
    const currentSortablesValues = this.currentSortables.map(
      (sortable) => sortable.name
    );
    const sortables = this.sortableColumns.filter((sort) => {
      return !currentSortablesValues.includes(sort['name']);
    });

    const ref = this.dialog.open(CustomizeColumnV3Component, {
      data: {
        sortables: sortables,
        currentSortables: Helper.deepClone(this.currentSortables),
        defaultValues: this.getDefaultColumns(),
        origin: CustomColumnOrigin.recordsManagement
      },
      width: '540px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container',
      disableClose: true
    });
    ref.afterClosed().subscribe((res) => {
      if (res?.action !== 'close') {
        this.currentSortables = res.currentSortables;
        localStorage.setItem(
          this.cachedKeyName,
          JSON.stringify(this.currentSortables)
        );
        this.prepareColumns(successCallback);
      }
    });
  }

  private prepareColumns(successCallback: Function) {
    let customColumns = this.defaultColumns;
    const cachedColumns = localStorage.getItem(this.cachedKeyName);
    const localCustomColums = cachedColumns ? JSON.parse(cachedColumns): null;

    if (Array.isArray(localCustomColums) && localCustomColums.length) {
      customColumns = localCustomColums;
    }

    this.columns = customColumns;
    this.displayedColumns = this.columns.map((c) => c['name']);
    this.currentSortables = this.columns.map((x) => Object.assign({}, x));
    this.displayedColumns = Helper.removeDuplicate(this.displayedColumns);
    this.columns = Helper.removeDuplicate(this.columns, 'name');
    if (!!successCallback && typeof successCallback == 'function') successCallback();
  }
}
