import { IMXMatPaginator } from '@shared/common-function';
import { CustomColumnsArea } from '@interTypes/enums';
import { Helper } from '../../../classes/helper';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { OfficesService } from '../../services/offices.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig
} from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Optional,
  SkipSelf,
  ChangeDetectorRef,
  Inject,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { AddOffficeDialogComponent } from '../add-offfice-dialog/add-offfice-dialog.component';

@Component({
  selector: 'app-offices-table',
  templateUrl: './offices-table.component.html',
  styleUrls: ['./offices-table.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CustomizeColumnService,
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator }
  ]
})
export class OfficesTableComponent implements OnInit, AfterViewInit {
  constructor(
    public dialog: MatDialog,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<OfficesTableComponent>,
    public cdRef: ChangeDetectorRef,
    private officesService: OfficesService,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  @ViewChild(MatPaginator) paginator: MatPaginator;
  displayedColumns: string[];

  customizeColumnService: CustomizeColumnService;
  public dataSource = new MatTableDataSource([]);

  private selectedSort: Sort;

  public officesList = [];

  public isDialogOpenend = true;

  private defaultColumns: DisplayedColumns[] = [
    { displayname: 'Office Name', name: 'name' },
    { displayname: 'Division', name: 'division' },
    { displayname: 'Street Address', name: 'line' },
    { displayname: 'City', name: 'city' },
    { displayname: 'State', name: 'state' },
    { displayname: 'ZIP Code', name: 'zipcode' }
  ];

  public sortName = 'name';
  public sortDirection = 'desc';
  public pageSize;
  public page;

  public officesPagination: SearchPagination;

  public paginationSizes = [10, 20, 50, 100];

  ngOnInit() {
    this.displayedColumns = this.defaultColumns.map((column) => column.name);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.OFFICES_TABLE,
      successCallback: () => {
        this.cdRef.markForCheck();
      }
    });

    this.getOfficesList();
  }

  enterFullScreen() {
    const config: MatDialogConfig = {
      height: '98%',
      width: '100%',
      panelClass: 'full-screen-modal',
      data: {
        fullScreenMode: true
      }
    };

    this.isDialogOpenend = true;
    this.dialogRef = this.dialog.open(OfficesTableComponent, config);
    this.dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpenend = false;
    });
  }

  exitFullScreen() {
    this.dialogRef.close();
  }

  public setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
  }

  customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.cdRef.detectChanges();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public getOfficesList(
    sortBy?: string,
    order?: string,
    pageSize?: string,
    pageNum?: string
  ) {
    this.officesService
      .getOfficesList(sortBy, order, pageSize, pageNum)
      .subscribe((res) => {
        this.officesList = res.results;
        this.dataSource.data = res.results;
        const { page, perPage, total } = res.pagination;
        this.setPaginationSizes(total);
        this.officesPagination = { page, perPage, total };
      });
  }

  public onSorting(sort) {
    this.sortName = sort.active;
    this.sortDirection = sort.direction;
    this.getOfficesList(sort.active, sort.direction);
    // this.resetVendorPagination(this.isDialogOpenend ? true : false);
    // this.vendorApi.setVendorListLocal('vendorSorting', this.selectedSort);
    // this.loadVendors();
  }

  public getPageEvent($event) {
    const { pageIndex, pageSize } = $event;
    this.page = pageIndex + 1;
    this.pageSize = pageSize;
    this.getOfficesList(
      this.sortName,
      this.sortDirection,
      pageSize,
      pageIndex + 1
    );
  }

  public openAddOfficesDialog(data?: any) {
    const dialogRef = this.dialog.open(AddOffficeDialogComponent, {
      width: '640px',
      data,
      position: data ? undefined : { bottom: '0' }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (!res?.isUpdateOffices) {
        return;
      }
      this.getOfficesList(
        this.sortName,
        this.sortDirection,
        this.pageSize,
        this.page
      );
    });
  }

  public openOfficeDetailsDialog(officeId) {
    this.officesService.retrieveOfficeById(officeId).subscribe((data) => {
      this.openAddOfficesDialog({ ...data, officeId });
    });
  }
}

export interface OfficesListElement {
  name: string;
  division: string;
  line: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface DisplayedColumns {
  displayname: string;
  name: string;
}

export interface SearchPagination {
  total?: number;
  page?: number;
  perPage?: number;
}
