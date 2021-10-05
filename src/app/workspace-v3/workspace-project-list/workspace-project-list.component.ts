import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  ElementRef,
  NgZone
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent
} from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { IMXMatPaginator } from '@shared/common-function';
import { MatDialog } from '@angular/material/dialog';
import { WorkspaceProjectAddComponent } from '../workspace-project-add/workspace-project-add.component';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import {
  ProjectListQueryParams,
  ConfirmationDialog,
  DuplicateProjectReq,
  WorkflowLables
} from '@interTypes/workspaceV2';
import { ActivatedRoute, Router } from '@angular/router';
import { MoveScenarioORProjectComponent } from '../move-scenario-or-project/move-scenario-or-project.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject } from 'rxjs';
import { Helper } from 'app/classes';
import {AuthenticationService, TitleService} from '@shared/services';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { NotificationsService } from '../../notifications/notifications.service';
import { Notification } from '@interTypes/Notifications';
import { InventoryPlanJobStatus } from '@interTypes/enums';

@Component({
  selector: 'app-workspace-project-list',
  templateUrl: './workspace-project-list.component.html',
  styleUrls: ['./workspace-project-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatPaginatorIntl, useClass: IMXMatPaginator }]
})
export class WorkspaceProjectListComponent implements OnInit, OnDestroy , AfterViewInit{

  public displayedColumns: string[] = [
    'name',
    'action',
    'scenarios',
    'description',
    'ownerName',
    'createdAt',
    'updatedBy',
    'updatedAt',
  ];
  public dataSource: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;
  public onOpenTab$: Subject<any> = new Subject();
  public pagination = {
    page: 1,
    pageSize: 0,
    perPage: 10,
    total: 0
  };
  public projectQueryParams: ProjectListQueryParams = {
    page: 1,
    perPage: 10,
    sortField: 'updatedAt',
    sortOrder: 'desc',
    fieldSet: '_id,name,description,ownerName,ownerEmail,updatedBy,isDraft,owner,createdAt,updatedAt,scenarios'
  };
  private initialCall = true;
  public perPage = 10;
  public currentPage = 1;
  public isDataLoading = true;
  public hoveredIndex = null;
  menuOpened: boolean;
  public sandboxProject;
  public projectPermission: any;
  public userEmail: any;
  public labels = this.workspaceApi.workSpaceLabels;
  public columns = {
    name: `${this.labels.project[0]} Name`,
    scenarios: `${this.labels.scenario[1]}`,
    description: 'Description',
    ownerName: 'Created by',
    createdAt: 'Created date',
    updatedBy: 'Last Update by',
    updatedAt: 'Last Update date',
    shared_with: 'Shared with',
    action: 'Action'
  };
  public sortName = 'updatedAt';
  public sortDirection = 'desc';
  public paginationSizes = [10,25, 50];
  public selectedTab: number = 1;
  public sandboxId;
  private unSubscribe$: Subject<void> = new Subject<void>();
  ownerId: string;
  @ViewChild('tableScrollRef', {read: ElementRef, static:false}) tableScrollRef: ElementRef;
  public hasHorizontalScrollbar = false;
  constructor(
    private workspaceApi: WorkspaceV3Service,
    private matDialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private auth: AuthenticationService,
    private titleService: TitleService,
    private cdRef: ChangeDetectorRef,
    private activeRoute: ActivatedRoute,
    private notifications: NotificationsService,
    private ngZone: NgZone
  ) {
    this.dataSource = new MatTableDataSource([]);
  }
  ngOnInit(): void {
    this.checkForNotificationUpdate();
    this.reSize();
    const queryParams = this.activeRoute.snapshot.queryParams;
    if (queryParams.type === this.labels['project'][1]) {
      this.selectedTab = 1;
    } else if (queryParams.type === 'sandbox') {
      this.selectedTab = 0;
    }
    this.projectPermission = this.auth.getModuleAccess('v3workspace');
    const userData = this.auth.getUserData();
    this.userEmail = userData['email'] ? userData['email'] : '';
    this.ownerId = userData['id'] ? userData['id'] : '';
    this.workspaceApi
      .getDraftProject()
      .pipe(
        switchMap((draftProject) => {
          if (draftProject?.['_id']) {
            return of(draftProject);
          } else {
            const projectData = { name: 'Sandbox', isDraft: true };
            return this.workspaceApi.createDraftProject(projectData).pipe(
              switchMap((project) => {
                return this.workspaceApi.getDraftProject();
              })
            );
          }
        })
      )
      .subscribe((draftProject) => {
        this.sandboxProject = draftProject;
        if (this.sandboxProject?.['_id']) {
          this.sandboxId = this.sandboxProject['_id']
          this.cdRef.markForCheck();
          
        }
        this.initialProjects();
      });
      // this.labels = this.workspaceApi.getWorkFlowLabels();
      // this.titleService.updateTitle(this.labels['project'][1]);
  }

  ngAfterViewInit(){
    this.reSize();
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
  }
  public reSize(){    
    if(window.innerWidth<1450){
      this.hasHorizontalScrollbar = true;
    }else{
      this.hasHorizontalScrollbar = this.tableScrollRef?.nativeElement.scrollWidth > this.tableScrollRef?.nativeElement.clientWidth;
    }
    this.ngZone?.onMicrotaskEmpty.pipe(take(3)).subscribe(() => this.table?.updateStickyColumnStyles());
  }
  private checkForNotificationUpdate() {
    this.notifications.refreshViewOnNottificationUpdate()
      .pipe(map((notifications: Notification[]) => {
        return notifications.map((notification: Notification) => notification?.moduleData);
      }), takeUntil(this.unSubscribe$)).subscribe((notificationsData) => {
        const projectIds = Helper.removeDuplicate(notificationsData.map(data => data.projectId));
        const scenarioIds = Helper.removeDuplicate(notificationsData.map(data => data.scenarioId));
        if (projectIds?.length && this.dataSource.data?.length) {
          // Looping projects
          for (const project of this.dataSource.data) {
            // Checking notifications are related to loaded projects or not
            if (projectIds.includes(project['_id'])) {
              // Looping psrojects cenario to check any inprogress scenario presense and it is in completed list or not
              for (const scenario of project['scenarios']) {
                if (scenarioIds.includes(scenario['_id']) && scenario.job?.status &&
                  scenario.job.status === InventoryPlanJobStatus.IN_PROGRESS) {
                    this.getProjects();
                    break;
                }
              }
            }
          }
        }
      });
  }
  openAddProjectDialog(row = null) {
    this.matDialog
      .open(WorkspaceProjectAddComponent, {
        panelClass: 'imx-mat-dialog',
        width: '500px',
        data: {
          project: row
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe((data) => {
        if (!data) return;
        this.router.navigateByUrl(
          `/workspace-v3/projects/${data['response']['data']['id']}`
        );
      });
  }
  openMoveProjectDialog(row) {
    this.matDialog
      .open(MoveScenarioORProjectComponent, {
        panelClass: 'imx-mat-dialog',
        width: '500px',
        data: {
          type: 'projects',
          id: row['_id']
        }
      })
      .afterClosed()
      .pipe(filter((data) => data?.status === 'success'))
      .subscribe((data) => {
        this.snackBar.open(`${this.labels.project[0]} moved successfully`, 'Dismiss', {
          duration: 5000
        });
      });
  }
  getProjects() {
    this.isDataLoading = true;
    this.workspaceApi.getProjects(this.projectQueryParams).subscribe((data) => {
      this.isDataLoading = false;
      const projects = data?.['projects'] ?? [];
      if (this.initialCall) {
        this.initialCall = false;
        // if (this.sandboxProject?.['_id']) {
        //    projects.unshift(this.sandboxProject);
        // }
        this.pagination = data?.['pagination'] ?? {
          page: 1,
          pageSize: 0,
          perPage: 10,
          total: 0
        };
        this.setPaginationSize();
      }
      this.dataSource.data = projects;
      this.reSize();
    });
  }
  private setPaginationSize(){
    const total = this.pagination?.total;
    if (total > 25) {
      this.paginationSizes = [10, 25, 50];
    } else if (total > 10) {
      this.paginationSizes = [10, 25];
    } else {
      this.paginationSizes = [10];
    }
  }
  deleteProject(row) {
    this.matDialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((result) => result && result.action),
        switchMap((response) =>
          this.workspaceApi.deleteProject({ _id: row['_id'] })
        )
      )
      .subscribe((res) => {
        this.snackBar.open(`${this.labels.project[0]} deleted successfully`, 'Dismiss', {
          duration: 5000
        });
        this.initialProjects();
      });
  }
  getPageEvent(event: PageEvent) {
    this.initialCall = true;
    this.projectQueryParams.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this.projectQueryParams.perPage = event.pageSize;
    this.getProjects();
  }
  onSortData(event) {
    this.initialCall = true;
    this.projectQueryParams.page = this.currentPage;
    this.projectQueryParams.perPage = this.perPage;
    this.projectQueryParams.sortField = event.active !== 'scenarios' ? event.active : 'scenarioCount';
    this.projectQueryParams.sortOrder = event.direction;
    this.getProjects();
    return false;
  }
  onHoverRow(index) {
    if (!this.menuOpened) {
      this.hoveredIndex = index;
      this.cdRef.markForCheck();
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
  initialProjects() {
    this.initialCall = true;
    this.projectQueryParams.page = 1;
    this.projectQueryParams.perPage = this.perPage;
    this.getProjects();
  }

  onSelectedTabChange(event) {
    this.selectedTab = event.index;
    this.onOpenTab$.next({ openTab: true });
    this.reSize();
  }

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }
}
