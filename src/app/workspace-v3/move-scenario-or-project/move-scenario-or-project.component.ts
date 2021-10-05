import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Project,
  ProjectListQueryParams, ProjectsList
} from '@interTypes/workspaceV2';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomValidators } from '../../validators/custom-validators.validator';

@Component({
  selector: 'app-move-scenario-v3',
  templateUrl: './move-scenario-or-project.component.html',
  styleUrls: ['./move-scenario-or-project.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveScenarioORProjectComponent implements OnInit {
  public scenarioForm: FormGroup;
  public projects = [];
  public projectQueryParams: ProjectListQueryParams = {
    page: 1,
    perPage: 10,
    sortField: 'createdAt',
    sortOrder: 'asc',
    fieldSet: '_id,name'
  };
  public pagination = {
    page: 1,
    pageSize: 0,
    perPage: 10,
    total: 0
  };
  panelContainer = '';
  private initialLoad = true;
  private totalPage = 0;
  private unsubscribe: Subject<void> = new Subject();
  searchQuery: any;
  public dataLoading = true;
  public projectId = '';
  public labels = this.workspaceApi.workSpaceLabels;
  public nameValidError: String = `${this.labels.project[0]} can't be blank`;
  public pageTitle = this.labels.scenario[0];
  constructor(
    public dialogRef: MatDialogRef<MoveScenarioORProjectComponent>,
    private fb: FormBuilder,
    private workspaceApi: WorkspaceV3Service,
    @Inject(MAT_DIALOG_DATA) public data,
    private cdRef: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}
  trackByProjectID(index: number, row: any) {
    return row.id;
  }
  ngOnInit(): void {
    this.scenarioForm = this.fb.group(
      {
        project: ['', [Validators.required]]
      },
      {
        validator: CustomValidators.validSelectProject('project')
      }
    );
    if (this.data.type === 'projects') {
      this.pageTitle = this.labels.project[0];
    }
    if (this.data.projectId) {
      this.projectId = this.data.projectId;
    }

    this.loadProjects();
    this.scenarioForm.controls.project.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((data) => !(data instanceof Object)),
        tap((data) => {
          this.dataLoading = true;
          this.searchQuery = data;
          this.initialLoad = true;
          this.projectQueryParams['page'] = 1;
          this.projectQueryParams['q'] = data;
          this.projects = [];
          this.cdRef.detectChanges();
        }),
        switchMap((data) => {
          return this.getProjectsStream$();
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
          this.projects = data;
          this.dataLoading = false;
          this.cdRef.markForCheck();
        },
        (error) => {
          this.projects = [];
          this.dataLoading = false;
          this.cdRef.markForCheck();
        }
      );
  }
  onSubmit(scenarioForm) {
    if (this.scenarioForm.valid) {
      this.workspaceApi
        .moveScenarioOrProject(
          this.data['type'],
          this.data['id'],
          scenarioForm.value['project']['id']
        )
        .subscribe(
          (response) => {
            this.dialogRef.close(response);
          },
          (error) => {
            let message = `Something went wrong. ${this.pageTitle} not moved.`;
            if (error?.code === 7164 && error?.['api-message']) {
              message = error['api-message'];
            }
            this.snackBar.open(message, 'DISMISS', {
                duration: 2000
              }
            );
          }
        );
    }
  }
  public updateContainer() {
    this.panelContainer = '.cast-list-dd';
  }
  public displayTitle(project) {
    return project?.name ?? '';
  }

  loadProjects() {
    this.dataLoading = true;
    this.getProjectsStream$().subscribe(
      (projects) => {
        this.projects = [...this.projects, ...projects];
        this.cdRef.detectChanges();
        this.dataLoading = false;
      },
      (error) => {
        this.projects = [];
        this.dataLoading = false;
        this.cdRef.markForCheck();
      }
    );
  }
  loadMorePublishedScenario() {
    if (this.projectQueryParams['page'] < this.totalPage) {
      this.projectQueryParams['page'] = this.projectQueryParams['page'] + 1;
      this.loadProjects();
    }
  }
  private getProjectsStream$(): Observable<any> {
    const projects$ = this.workspaceApi
      .getProjects(this.projectQueryParams)
      .pipe(
        map((response: ProjectsList) => {
          if (response?.projects?.length > 0) {
            return response;
          } else {
            return { projects: [], pagination: {} };
          }
        }),
        tap((response: ProjectsList) => {
          if (this.initialLoad) {
            this.projects = [];
            this.pagination = response['pagination'];
            this.initialLoad = false;
            this.totalPage = Math.ceil(
              response['pagination']['total'] /
              response['pagination']['pageSize']
            );
          }
        }),
        map((response: ProjectsList) => {
          const projects = response.projects.filter(
            (p) => p['_id'] !== this.projectId
          );
          return this.formatProjectResult(projects);
        }),
        catchError((err) => {
          return of(err);
        })
      );
    const apiCalls = [projects$];
    if (this.initialLoad) {
      const draft$ = this.workspaceApi.getDraftProject().pipe(map((response: Project) => {
          const result = this.formatProjectResult([response]);
          return result.filter((item) => {
            return (
              ((this.projectQueryParams.q === '' ||
              item.name
                .toLowerCase()
                  .includes(
                    (this.projectQueryParams?.q || '').toLowerCase()
                  )) &&
              item['id'] !== this.projectId)
            );
          });
        }),
        catchError((err) => {
          return of(err);
        })
      );
      apiCalls.push(draft$);
    }
    return forkJoin(apiCalls).pipe(map(([projects, draft]) => {
        if (draft?.length > 0) {
          projects.unshift(draft[0]);
        }
        return projects;
      }));
  }
  private formatProjectResult(projectsResponse) {
    return projectsResponse
      .filter((data: Project[]) => this.data.id !== data['_id'])
      .map((data) => {
        return {
          id: data['_id'],
          name: data['name']
        };
      });
  }
}
