import { IMXMatPaginator } from '@shared/common-function';
import { Sort } from '@angular/material/sort';
import { CustomColumnsArea } from '@interTypes/enums';
import { Helper } from 'app/classes/helper';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  Inject,
  ChangeDetectorRef,
  AfterViewInit,
  Optional,
  SkipSelf
} from '@angular/core';
import { DivisionsService } from '../../services/divisions.service';
import { AddDivisionDialogComponent } from '../add-division-dialog/add-division-dialog.component';

@Component({
  selector: 'app-division-table',
  templateUrl: './division-table.component.html',
  styleUrls: ['./division-table.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CustomizeColumnService,
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator }
  ]
})
export class DivisionTableComponent implements OnInit, AfterViewInit {
  constructor(
    public dialog: MatDialog,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<DivisionTableComponent>,
    public cdRef: ChangeDetectorRef,
    private divisionsService: DivisionsService,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  displayedColumns: string[];

  customizeColumnService: CustomizeColumnService;
  public dataSource = new MatTableDataSource([]);

  private selectedSort: Sort;

  public divisionsList = [];

  public isDialogOpenend = false;

  private defaultColumns: DisplayedColumns[] = [
    { displayname: 'Division Name', name: 'name' },
    { displayname: 'Division Abbreviation', name: 'abbreviation' },
    { displayname: 'Division Contact', name: 'contact' },
    { displayname: 'Signature Label', name: 'signatureLabel' },
    { displayname: 'Last modified', name: 'updatedAt' }
  ];

  public sortName = 'updatedAt';
  public sortDirection = 'desc';
  public pageSize;
  public page;

  public divisionPagination: SearchPagination = {
    page: 1,
    perPage: 10
  };

  public paginationSizes = [];

  ngOnInit() {
    this.displayedColumns = this.defaultColumns.map((column) => column.name);
    this.customizeColumnService = new CustomizeColumnService(this.dialog);

    this.customizeColumnService.init({
      defaultColumns: this.defaultColumns,
      sortableColumns: Helper.deepClone(this.defaultColumns),
      cachedKeyName: CustomColumnsArea.DIVISIONS_TABLE,
      successCallback: () => {
        this.cdRef.markForCheck();
      }
    });

    // if (this.data?.divisions.length && this.data?.pagination) {
    //   this.divisionsList = this.data.divisions;
    //   this.dataSource.data = this.data.divisions;
    //   console.log(this.data.pagination);

    //   this.divisionPagination = this.data.pagination;
    // } else {
    //   this.getDivisions();
    // }

    this.getDivisions();
  }

  enterFullScreen() {
    const config: MatDialogConfig = {
      height: '98%',
      width: '100%',
      panelClass: 'full-screen-modal',
      data: {
        fullScreenMode: true,
        divisions: this.divisionsList,
        pagination: this.divisionPagination
      }
    };

    this.isDialogOpenend = true;
    this.dialogRef = this.dialog.open(DivisionTableComponent, config);
    this.dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpenend = false;
    });
  }

  public openAddDivisionDialog(data?: any) {
    const dialogRef = this.dialog.open(AddDivisionDialogComponent, {
      width: '674px',
      data,
      position: data ? undefined : { bottom: '0' }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (!res?.isUpdateDivision) {
        return;
      }
      this.getDivisions(
        this.sortName,
        this.sortDirection,
        this.pageSize,
        this.page
      );
    });
  }

  exitFullScreen() {
    this.dialogRef.close();
  }

  customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.cdRef.detectChanges();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public getDivisions(sortBy?, order?, pageSize?, pageNum?) {
    this.divisionsService
      .getDivisionsList(sortBy, order, pageSize, pageNum)
      .subscribe((res) => {
        this.divisionsList = res.results;
        this.dataSource.data = res.results;
        const { page, perPage, total } = res.pagination;
        this.setPaginationSizes(total);
        this.divisionPagination = { page, perPage, total };
      });
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

  public onSorting(sort) {
    this.getDivisions(sort.active, sort.direction);
  }

  public getPageEvent($event) {
    const { pageIndex, pageSize } = $event;
    this.page = pageIndex + 1;
    this.pageSize = pageSize;
    this.getDivisions(
      this.sortName,
      this.sortDirection,
      pageSize,
      pageIndex + 1
    );
  }

  public openDivisionDetailsDialog(divisionId: string) {
    this.divisionsService.retriveDivisionById(divisionId).subscribe((data) => {
      this.openAddDivisionDialog({ ...data, divisionId });
    });
  }
}

export interface DivisionsListElement {
  name: string;
  abbreviation: string;
  contact: string[];
  signatureLabel: string;
  updatedAt: string;
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
