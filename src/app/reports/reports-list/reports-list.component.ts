import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  Optional,
  SkipSelf,
  Inject,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
  OnDestroy,
  Input,
  NgZone
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { CustomColumnsArea } from '@interTypes/enums';
import { IMXMatPaginator } from '@shared/common-function';
import { CustomizeColumnService } from '@shared/components/customize-column-v3/customize-column.service';
import { ThemeService } from '@shared/services';
import { Helper } from 'app/classes';
import { of, Subject } from 'rxjs';
import { saveAs } from 'file-saver';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  mergeMap,
  switchMap,
  take,
  takeUntil
} from 'rxjs/operators';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { ReportsAPIService } from '../services/reports-api.service';
import { AbstractReportActionComponent } from '../abstract-report-action.component';
import { ApplyFilterModel, OverlayListInputModel } from '@shared/components/overlay-list/overlay-list.model';
import { Pagination } from '../models/pagination.model'
import { ReportsApiResponse, ReportItem } from '../models/reports-response.model'
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SaveAsFileComponent } from '@shared/components/save-as-file/save-as-file.component';

@Component({
  selector: 'app-reports-list',
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatPaginatorIntl, useClass: IMXMatPaginator },
    CustomizeColumnService,
    DatePipe
  ]
})
export class ReportsListComponent extends AbstractReportActionComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('tableScrollRef', { read: ElementRef, static: false }) tableScrollRef: ElementRef;
  @ViewChild(MatTable) table: MatTable<any>;

  @ViewChild('titleContent', { read: ElementRef, static: false })
  titleContent: ElementRef;

  @Output() public openReport: EventEmitter<any> = new EventEmitter<any>();
  @Output() public duplicateReportEmitter: EventEmitter<any> = new EventEmitter<any>();

  @Input() set refreshTable(value: boolean) {
    if(value) {
      this.getReports();
    }
  };

  protected unSubscribe: Subject<void> = new Subject<void>();

  public scrollContent: number;
  public hasHorizontalScrollbar = false;
  public isDialogOpenend = false;

  public paginationSizes = [10];
  public sortedReports: MatTableDataSource<any>;
  public isCategoryFilterOpen = false;
  public isSearchBarActive = false;
  public isTypeFilterOpen = false;
  public menuOpened: boolean;
  public hoveredIndex = null;
  public reportNameFC: FormControl = new FormControl();
  public typeOverlayOrigin: CdkOverlayOrigin;
  public categoryOverlayOrigin: CdkOverlayOrigin;
  themeSettings: any;
  clientId: any;
  disableSort: boolean;
  previousSort;
  fDatas = [];
  
  isLoading = false;
  public reports: ReportItem[];
  public overlayCategoryList: OverlayListInputModel[] = [];
  public overlayTypeList: OverlayListInputModel[] = [];
  public selectedCategories: any = [];
  public selectedTypes: any = [];
  timelineOptions = [
    { days: 7, title: 'Last 7 days' },
    { days: 30, title: 'Last 30 days' },
    { days: 60, title: 'Last 60 days' }
  ];
  selectionOptions = ['Viewing ALL', 'Viewing MINE'];
  selectedTimeline = null;
  selectedSelection = this.selectionOptions[0];
 
  public sort: Sort = {
    active: 'createdAt',
    direction: 'desc'
  };
  public tablePagination: Pagination = {
    page: 1,
    perPage: 10,
  };
  public typePagination: Pagination = {
    page: 1,
    perPage: 20,
  };

  constructor(
    public themeService: ThemeService,
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    public reportService: ReportsAPIService,
    public datepipe: DatePipe,
    private matSnackBar: MatSnackBar,
    private ngZone: NgZone,
    public customizeColumnService: CustomizeColumnService,
    @Optional()
    @SkipSelf()
    public dialogRef: MatDialogRef<ReportsListComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public injectedData: any
  ) {
    super(reportService, dialog);
    this.listenForReportContainerScroll();
  }

  ngOnInit(): void {
    this.themeSettings = this.themeService.getThemeSettings();
    this.clientId = this.themeSettings.clientId;

    if (this.injectedData?.dialogOpenened) {
      this.isDialogOpenend = true;
      if(this.injectedData?.searchKey?.length){
        this.isSearchBarActive = true;
        this.reportNameFC.setValue(this.injectedData.searchKey);
      }
      this.selectedSelection = this.injectedData?.viewOption;
      this.selectedTimeline = this.injectedData?.timeline;
      this.sort = this.injectedData?.sort;
    }

    this.reSize();
    this.initializeCustomizeColumn();

    this.sortedReports = new MatTableDataSource([]);
    this.filterReportBySearch();
   
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
    this.getCategories();
    this.getTypes(this.typePagination);
  }

  /**
   * @description
   * method to initialize column
   */
  public initializeCustomizeColumn() {
    const defaultColumns = [
      { displayname: 'Category', name: 'category' },
      { displayname: 'Report Type', name: 'type' },
      { displayname: 'Cost Type', name: 'costType' },
      { displayname: 'Start Date', name: 'startDate' },
      { displayname: 'End Date', name: 'endDate' },
      { displayname: 'Created Date', name: 'createdAt' }
    ];

    this.customizeColumnService.init({
      defaultColumns: defaultColumns,
      sortableColumns: Helper.deepClone(defaultColumns),
      cachedKeyName: CustomColumnsArea.REPORT_LIST_TABLE,
      successCallback: () => {
        this.customizeColumnService.displayedColumns.splice(0, 0, 'name'); // sticky column
        this.customizeColumnService.displayedColumns.splice(1, 0, 'action'); // sticky column
        this.cdRef.markForCheck();
      }
    });
  }

  /**
   * @description
   * method used to set content sizes
   */
  public reSize() {
    this.scrollContent = window.innerHeight - 420;
    setTimeout(() => {
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
      this.cdRef.detectChanges();
    }, 200);
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
  }

  getReports(
    sort: Sort = null,
    pagination: Pagination = null,
    searchKey = null,
    ){
      this.isLoading = true;
      const sortDup = Helper.deepClone(sort);
      if (sortDup && sortDup['active'] === 'name') {
        sortDup['active'] = 'metadata.displayName';
      } else if (sortDup && sortDup['active'] === 'category') {
        sortDup['active'] = 'metadata.categoryData.name';
      } else if (sortDup && sortDup['active'] === 'type') {
        sortDup['active'] = 'metadata.typeData.name';
      } else if (sortDup && sortDup['active'] === 'costType') {
        sortDup['active'] = 'metadata.costTypeData.name';
      } else if (sortDup && sortDup['active'] === 'startDate') {
        sortDup['active'] = 'metadata.startDate';
      } else if (sortDup && sortDup['active'] === 'endDate') {
        sortDup['active'] = 'metadata.endDate';
      }
      const payload = {
        module: "contract-reports"
      };

      if (searchKey) {
        payload['displayName'] = searchKey;
      }
      // setting current user view
      const userData = JSON.parse(localStorage.getItem('user_data'));
      if(this.selectedSelection === 'Viewing MINE' && userData) {
        payload['createdBy'] = userData['id'];
      }

      // setting timeline
      if (this.selectedTimeline) {
        var today = new Date()
        var priorDate = new Date();
        priorDate.setDate(new Date().getDate() - this.selectedTimeline?.days);
        payload['startDate'] = this.datepipe.transform(priorDate, 'MM/dd/yyyy');
        payload['endDate'] = this.datepipe.transform(today, 'MM/dd/yyyy');
      }

      // category filter
      if (this.selectedCategories.length) {
        payload['reportCategory'] = this.selectedCategories;
      }
      // type filter
      if (this.selectedTypes.length) {
        payload['reportType'] = this.selectedTypes;
      }
      this.reportService
      .searchAllReport(sortDup, pagination, [], payload, true)
      .subscribe((res: ReportsApiResponse) => {
        this.reports = res.results;
        this.sortedReports.data = res.results;
        this.tablePagination = res.pagination;
        this.setPaginationSizes(this.tablePagination?.found);
        this.isLoading = false;
        this.cdRef.markForCheck();
    });
  }

  public getCategories(
    pagination: Pagination = null,
  ) {
    this.reportService
    .searchCategory(pagination)
    .subscribe((res: any) => {
      this.overlayCategoryList = res.results.map(type => {
        const { name } = type;
        const { _id } = type;
        return { value: _id, label: name } as OverlayListInputModel
      });
    });
  }

  public getTypes(
    pagination: Pagination = null,
  ) {
    this.reportService
    .searchType(pagination)
    .subscribe((res: any) => {
      this.overlayTypeList = res.results.map(type => {
        const { name } = type;
        const { _id } = type;
        return { value: _id, label: name } as OverlayListInputModel
      });
    });
  }

  getPageEvent(event: PageEvent) {
    this.tablePagination.page = event.pageIndex + 1;
    this.tablePagination.perPage = event.pageSize;
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
  }

  public setPaginationSizes(total: number) {
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
    this.cdRef.markForCheck();
  }

  enableSearch(event) {
    this.isSearchBarActive = true;
    this.isCategoryFilterOpen = false;
    this.isTypeFilterOpen = false;
    event.stopPropagation();
  }

  public closeSearchFilter() {
    const searchValue = this.reportNameFC.value;
    this.isSearchBarActive = false;
    if (searchValue?.length > 0) {
      this.isSearchBarActive = true;
    }
  }

  sortChange(sort: Sort) {
    this.sort = sort;
    this.tablePagination.page = 1;
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  scenariosTractByFn(i: number, scenario) {
    return scenario._id;
  }

  filterReportBySearch() {
    this.reportNameFC.valueChanges
      .pipe(
        takeUntil(this.unSubscribe),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((searchStr) => {
        this.tablePagination.page = 1;
        if (searchStr?.length) {
          this.getReports(this.sort, this.tablePagination, searchStr);
        } else {
          this.getReports(this.sort, this.tablePagination);
        }
      });
  }

  onHoverRow(index) {
    if (!this.menuOpened) {
      this.hoveredIndex = index;
    }
  }

  onHoverOut() {
    if (!this.menuOpened) {
      this.hoveredIndex = null;
    }
  }

  onMenuOpen() {
    this.menuOpened = true;
  }

  onMenuClosed() {
    this.menuOpened = false;
  }

  public trackFilters(index, item) {
    return item.id;
  }

  public compareFilters(c1, c2) {
    return c1 && c2 && c1['id'] === c2['id'];
  }

  onFocusSearchBox() {
    this.disableSort = true;
  }

  onBlurSearchBox() {
    this.disableSort = false;
  }

  disableSearch(event, key: string) {
    this.reportNameFC.patchValue('');
    this.isSearchBarActive = false;
    event.stopPropagation();
  }

  public customizeColumn() {
    this.customizeColumnService.customizeColumn(() => {
      this.customizeColumnService.displayedColumns.splice(0, 0, 'name'); // sticky column
      this.customizeColumnService.displayedColumns.splice(1, 0, 'action'); // sticky column
      this.cdRef.detectChanges();
    });
  }

  public openReportDialog() {
    this.dialog
      .open(ReportsListComponent, {
        disableClose: true,
        data: {
          dialogOpenened: true,
          selectedCategories: this.selectedCategories,
          selectedTypes: this.selectedTypes,
          searchKey: this.reportNameFC.value,
          viewOption: this.selectedSelection,
          timeline: this.selectedTimeline,
          sort: this.sort,
        },
        width: '90vw',
        maxWidth: '90vw',
        closeOnNavigation: true,
        panelClass: 'report-list-dialog-fullscreen'
      })
      .afterClosed()
      .subscribe((data) => {
        if(data?.searchKey?.length){
          this.isSearchBarActive = true;
          this.reportNameFC.setValue(data.searchKey);
        }
        this.selectedSelection = data?.viewOption;
        this.selectedTimeline = data?.timeline;
        this.sort = data?.sort;
        this.isDialogOpenend = data?.isDialogOpenend;
        this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
      });
  }

  resetReportPagination(isDialog = false) {
    this.tablePagination = { page: 1, perPage: isDialog ? 50 : 10 };
  }

  public closeDialogBox(skipSetup = false) {
    const data = {
      selectedCategories: this.selectedCategories,
      selectedTypes: this.selectedTypes,
      searchKey: this.reportNameFC.value,
      viewOption: this.selectedSelection,
      timeline: this.selectedTimeline,
      sort: this.sort
    }
    this.dialogRef.close(data);
  }

  public timelineSelection(timeline) {
    this.selectedTimeline = timeline;
    this.tablePagination.page = 1;
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
  }

  public viewAllAndMine(selection) {
    this.tablePagination.page = 1;
    this.selectedSelection = selection;
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value)
  }

  public clearTimelineSelection() {
    this.selectedTimeline = null;
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
  }

  public saveReport(report, filename = '') {
    let reportFileName = report?.link?.label;
    if (filename) {
      reportFileName = filename;
    }
    saveAs(report.link.url, reportFileName);
  }

  public downloadReport(report, isForDownload = false) {
    if (isForDownload) {
      this.saveReport(report);
    } else {
      this.dialog
        .open(SaveAsFileComponent, {
          panelClass: 'imx-mat-dialog',
          width: '500px',
          disableClose: true
        })
        .afterClosed()
        .subscribe((filename) => {
          if (filename) {
            this.saveReport(report, filename);
          }
        });
    }
  }
  ngAfterViewInit() {
    // this.sortedReports.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public handleOpenReport(report: ReportItem) {
    this.openReport.emit(report);
  }

  public handleDuplicateReport(report: ReportItem) {
    this.duplicateReportEmitter.emit(report);
  }

  public onApplyCategory(data: ApplyFilterModel) {
    this.tablePagination.page = 1;
    const { selectedItem } = data || {};
    this.selectedCategories = selectedItem.map(item => item.value);
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
  }

  public onApplyType(data: ApplyFilterModel) {
    this.tablePagination.page = 1;
    const { selectedItem } = data || {};
    this.selectedTypes = selectedItem.map(item => item.value);
    this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
  }

  /**
   * @description
   *  Listener to close the category and report type filter panel.
   *  if clause logics are written to handle if panel only opened.
   */
  public listenForReportContainerScroll(): void {
    this.reportService
      .listenForContainerScroll()
      .pipe(
        takeUntil(this.unSubscribe),
        debounceTime(100),
      )
      .subscribe(() => {
        if (this.isCategoryFilterOpen && this.isTypeFilterOpen){
          this.isCategoryFilterOpen = false;
          this.isTypeFilterOpen = false;
          this.cdRef.markForCheck();
        } else {
          if (this.isCategoryFilterOpen) {
            this.isCategoryFilterOpen = false;
            this.cdRef.markForCheck();
          }
          if (this.isTypeFilterOpen) {
            this.isTypeFilterOpen = false;
            this.cdRef.markForCheck();
          }
        }
    });
  }

  public deleteReport(element) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((res) => res && res['action']),
        switchMap(() =>
          this.reportService.deleteReport(element?._id)
        ),
        filter((res: any) => res?.status === 'success')
      )
      .subscribe((res) => {
        this.reportService.showSnackBar(
          'Report deleted successfully'
        );
        this.getReports(this.sort, this.tablePagination, this.reportNameFC.value);
      });
  }
}
