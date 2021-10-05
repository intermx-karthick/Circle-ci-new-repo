import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  Input,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  OnDestroy,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';

import { IMXMatPaginator } from '@shared/common-function';
import { RecordsPagination } from '@interTypes/pagination';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserActionPermission, UserRole } from '@interTypes/user-permission';
import { AuthenticationService } from '@shared/services/authentication.service';


@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.less'],
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsListComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(MatPaginator) public paginator: MatPaginator;

  @Output() public doSort = new EventEmitter();
  @Output() public doPaginate = new EventEmitter();
  @Output() public doSelectClient = new EventEmitter();
  @Output() public doCustomiseColumn = new EventEmitter();
  @Output() public onClientDelete = new EventEmitter();
  @Output() public openClientListDialog = new EventEmitter();
  @Output() public closeClientListDialog = new EventEmitter();

  @Input() public displayedColumns: string[] = [];
  @Input() public dataSource = new MatTableDataSource([]);
  @Input() public clientsPagination: RecordsPagination = { page: 1, perPage: 10 };
  @Input() public isLoadingClients = false;
  @Input() public sortName: any = 'updatedAt';
  @Input() public sortDirection = 'desc';
  @Input() public paginationSizes = [10];
  @Input() public isDialogOpenend$ = new Subject<boolean>();
  @Input() public searchFilterApplied = false;
  public scrollContent: number;
  public panelContainer: string;
  public noClientMessage: string;
  public menuOpened = false;
  public hoveredIndex = -1;
  public isDialogOpenend = false;
  private unsubscribe$: Subject<void> = new Subject<void>();
  @ViewChild('tableScrollRef', {read: ElementRef, static:false}) tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  userPermission: UserActionPermission;
  @Input() isSearchInValid = false;
  @Output() refresh = new EventEmitter();

  constructor(
    public cdRef: ChangeDetectorRef,
    private router: Router,
    private auth: AuthenticationService
    ) {
  }

  public ngOnInit(): void {
    this.userPermission = this.auth.getUserPermission(UserRole.CLIENT_GENERAL);
    this.reSize();
    this.isDialogOpenend$.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
      this.isDialogOpenend = value;
      this.cdRef.markForCheck();
    })
  }
  ngAfterViewInit(){
    this.reSize();
  }

  public reSize() {
    this.scrollContent = window.innerHeight - 460;
    this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
    this.cdRef.detectChanges();
  }

  public onSorting(sort: Sort) {
    this.doSort.emit(sort)
  }

  public getPageEvent(event: PageEvent) {
    this.doPaginate.emit(event);
  }

  public customizeColumn() {
    this.doCustomiseColumn.emit();
    this.reSize();
  }

  public openAddClient() {
  }

  public openClientDetails(element: any) {
    if (this.isDialogOpenend) {
      this.closeDialogBox(true);
    }
    this.doSelectClient.emit(element);
  }

  public onMenuOpen() {
    this.menuOpened = true;
  }

  public onMenuClosed() {
    this.menuOpened = false;
  }

  public refreshLineItems(){
    this.refresh.emit();
  }

  /*public onHoverRow(index, row) {
    if (this.isDialogOpenend) {
      const parentDiv = document.getElementById('client-fullscreen-scroll');
      const actionElement = document.getElementById('action-btn-main-dialog' + row['_id']);
      const ele = document.getElementById('client-hoverid-dialog-' + index);
      if (parentDiv && actionElement && ele) {
        actionElement.style.top = (ele.offsetHeight / 2) - 12 + 'px';
        actionElement.style.left = ((parentDiv.offsetWidth - 130) + parentDiv.scrollLeft) + 'px';
        ele.appendChild(actionElement);
      }
    } else {
      const parentDiv = document.getElementById('client-table-scroll');
      const actionElement = document.getElementById('action-btn-main' + row['_id']);
      const ele = document.getElementById('client-hoverid-' + index);
      if (parentDiv && actionElement && ele) {
        actionElement.style.top = (ele.offsetHeight / 2) - 12 + 'px';
        actionElement.style.left = ((parentDiv.offsetWidth - 130) + parentDiv.scrollLeft) + 'px';
        ele.appendChild(actionElement);
      }
    }
    if (!this.menuOpened) {
      this.hoveredIndex = index;
    }
   this.cdRef.markForCheck();
  }

  onHoverOut() {
    if (!this.menuOpened) {
      this.hoveredIndex = null;
    }
    this.cdRef.markForCheck();
  }*/

  public deleteClient(row) {
    this.onClientDelete.emit(row);
  }

  public duplicateClient(element) {
    if (this.isDialogOpenend) {
      this.closeDialogBox(true);
    }
    this.router.navigateByUrl(
      `/records-management-v2/clients/add?clientId=${element._id}`
    );
  }


  public openClientDialog() {
    this.openClientListDialog.emit();
  }

  public closeDialogBox(skipSetup = false) {
    this.closeClientListDialog.emit(skipSetup);
  }

  public ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
