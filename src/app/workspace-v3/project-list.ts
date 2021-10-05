import {ChangeDetectorRef, Component, OnDestroy, ViewChild} from '@angular/core';
import { ProjectPagination } from '@interTypes/pagination';
import { Subject, of, forkJoin } from 'rxjs';
import { WorkspaceV3Service } from './workspace-v3.service';
import {
  ProjectListQueryParams,
  ProjectsList,
  Project
} from '@interTypes/workspaceV2';
import {
  tap,
  filter,
  catchError,
  debounceTime,
  switchMap, map
} from 'rxjs/operators';
import { Helper } from 'app/classes';

@Component({
  template: '',
  selector: 'base-project-list'
})
export class ProjectListAbstract implements OnDestroy {
  public pagination: ProjectPagination = {
    page: 1,
    pageSize: 0,
    perPage: 10,
    total: 0
  };
  private free$ = new Subject();
  public projectListLoading = false;
  public projectQueryParams: ProjectListQueryParams = {
    page: 1,
    perPage: 10,
    sortField: 'createdAt',
    sortOrder: 'asc',
    fieldSet: '_id,name'
  };
  public projects: Project[] = [];
  public filteredProjects: Project[] = [];
  public searchText = '';
  public disableProjectPagination = false;
  public draftProject: Project;
  public setDefaultProject$ = new Subject();
  constructor(
    public workspaceApi: WorkspaceV3Service,
    public cdRef: ChangeDetectorRef
  ) {}

  /**
   * This function used to initial project list loading
   */

  public loadProjects() {
    this.projectListLoading = true;
    forkJoin([
      this.workspaceApi.getDraftProject().pipe(
        map((res) => {
          this.draftProject = res;
          this.setDefaultProject$.next(this.draftProject);
          this.cdRef.markForCheck();
          if (
            this.projectQueryParams.q === '' ||
            res.name
              .toLowerCase()
              .includes((this.projectQueryParams.q || '').toLowerCase())
          ) {

            return res;
          } else {
            return null;
          }
        }),
        catchError((error) => {
          this.projectListLoading = false;
          this.cdRef.markForCheck();
          return of(null);
        })
      ),
      this.workspaceApi.getProjects(this.projectQueryParams).pipe(
        tap(() => (this.projectListLoading = true)),
        map((response: ProjectsList) => {
          if (response?.projects?.length > 0) {
            return response;
          } else {
            return { projects: [], pagination: {} };
          }
        }),
        catchError((error) => {
          this.projectListLoading = false;
          this.cdRef.markForCheck();
          return of({ projects: [], pagination: {} });
        })
      )
    ]).subscribe((response) => {
      const projects = Helper.deepClone(response[1]?.projects);
      if (response[0]) {
        projects.unshift(response[0]);
      }
      this.projectListLoading = false;
      this.pagination = response[1]?.['pagination'];
      this.projects = projects ?? [];
      this.filteredProjects = Helper.deepClone(projects);
      this.cdRef.markForCheck();
    });
  }

  /**
   * This function used to load more pagination with search text
   */
  public loadMoreWithSearch() {
    // Checking total page
    if (
      this.pagination.page * this.pagination.perPage >=
      this.pagination.total
    ) {
      this.projectListLoading = false;
      this.disableProjectPagination = true;
      this.cdRef.markForCheck();
      return;
    }
    this.projectQueryParams.page += 1;
    this.projectListLoading = true;
    this.cdRef.markForCheck();
    this.workspaceApi
      .getProjects(this.projectQueryParams)
      .pipe(
        filter((res) => !!res?.projects),
        catchError((error) => {
          this.projectListLoading = false;
          this.cdRef.markForCheck();
          return of({ projects: [], pagination: {} });
        })
      )
      .subscribe((response) => {
        this.projectListLoading = false;
        this.pagination = response?.['pagination'];
        this.projects = this.projects.concat(response?.projects ?? []);
        this.filteredProjects = Helper.deepClone(this.projects);
        this.cdRef.markForCheck();
      });
  }

  /**
   * This function used to search with pagination for project list
   * @param form set the search form
   * @param field set the search field from the search form
   */
  public setFilterProjectFormSearch(form, field) {
    form
      .get(field)
      .valueChanges.pipe(
        debounceTime(500),
        filter((value) => typeof value === 'string'),
        switchMap((searchStr) => {
          this.projects = [];
          this.filteredProjects = [];
          this.disableProjectPagination = false;
          this.projectQueryParams.page = 1;
          this.searchText = searchStr.toString();
          this.projectQueryParams.q = searchStr.toString();
          return forkJoin([
            this.workspaceApi.getDraftProject().pipe(
              map((res) => {
                if (
                  this.projectQueryParams.q === '' ||
                  res.name.toLowerCase().includes(this.projectQueryParams.q.toLowerCase())
                ) {
                  return [res];
                } else {
                  return [];
                }
              }),
              catchError((error) => {
                return of([]);
              })
            ),
            this.workspaceApi.getProjects(this.projectQueryParams).pipe(
              map((res) => {
                if (res?.projects) {
                  return res;
                } else {
                  return { projects: [], pagination: {} }
                }
              }),
              catchError((error) => {
                this.projectListLoading = false;
                this.cdRef.markForCheck();
                return of({ projects: [], pagination: {} });
              })
            )
          ]);
        }),
        tap(() => (this.projectListLoading = false))
      )
      .subscribe(([draft, projects]) => {
        this.projectListLoading = false
        this.pagination = projects?.['pagination'];
        this.projects = [...draft, ...projects.projects];
        this.filteredProjects = Helper.deepClone(this.projects);
        this.cdRef.markForCheck();
      });
  }

  ngOnDestroy() {
    this.free$.next();
    this.free$.complete();
  }
}
