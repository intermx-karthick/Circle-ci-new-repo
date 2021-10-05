import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';
import { ToastrService } from 'ngx-toastr';

import { AppConfig } from 'app/app-config.service';
import { Group } from 'app/user-management/models/group.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User, Role } from '../models';
import {
  AddUpdateGroupApiModel,
  AddUpdateGroupApiResponseModel
} from '../models/add-update-group-api.model';

@Injectable()
export class GroupsService {
  public handleError;

  private baseUrl: string = this.config.envSettings['API_ENDPOINT_V2'];

  private siteName: string;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService,
    private toast: ToastrService
  ) {
    const themeSettings = this.theme.getThemeSettings();
    this.siteName = themeSettings && themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError('Group Service');
  }

  public getAllGroups(noLoader = false): Observable<Group[] | []> {
    const url = `${this.baseUrl}admin/groups`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<Group[]>(url).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of([]);
      })
    );
  }

  public createGroup(
    noLoader = false,
    group: AddUpdateGroupApiModel
  ): Observable<Group | null> {
    const url = `${this.baseUrl}admin/groups`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<Group>(url, group).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of(null);
      }),
      map((res: Group) => {
        if (!res) {
          return;
        }

        this.toast.success(`${res.name} group created`);
        return res;
      })
    );
  }

  public updateGroup(
    noLoader = false,
    group: AddUpdateGroupApiModel
  ): Observable<AddUpdateGroupApiResponseModel | {}> {
    const url = `${this.baseUrl}admin/groups/${group._id}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const body = {
      name: group.name,
      description: group.description
    };

    return this.http.put<AddUpdateGroupApiResponseModel>(url, body).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of({});
      })
    );
  }

  public deleteGroup(noLoader = false, groupId: string): Observable<any> {
    const url = `${this.baseUrl}admin/groups/${groupId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete(url).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of({});
      })
    );
  }

  public getGroupMembers(
    groupId: string,
    noLoader = false
  ): Observable<Group[] | []> {
    const url = `${this.baseUrl}admin/groups/${groupId}/members`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<Group[]>(url, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }

  public addGroupMembers(
    noLoader = false,
    users: User[],
    groupId: string
  ): Observable<any> {
    if (!users) {
      return of();
    }

    const url = `${this.baseUrl}admin/groups/${groupId}/members`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const body = users.map((user) => user.user_id);

    return this.http.patch<any>(url, body).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of({});
      })
    );
  }

  public deleteGroupMembers(
    groupId: string,
    users: User[],
    noLoader = false
  ): Observable<any> {
    if (!users) {
      return of();
    }

    const url = `${this.baseUrl}admin/groups/${groupId}/members`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const body = users.map((user) => user.user_id);

    return this.http
      .request<any>('delete', url, { body })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of({});
        })
      );
  }

  public getGroupRoles(groupId: string, noLoader = false): Observable<Role[]> {
    const url = `${this.baseUrl}admin/groups/${groupId}/roles`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http
      .get<Role[]>(url, { headers })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of([]);
        })
      );
  }

  public addGroupRoles(
    noLoader = false,
    roles: Role[],
    groupId: string
  ): Observable<any> {
    if (!roles) {
      return of();
    }

    const url = `${this.baseUrl}admin/groups/${groupId}/roles`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const body = roles.map((role) => role._id);

    return this.http.patch<any>(url, body).pipe(
      catchError((err) => {
        this.toast.error(err.message);

        return of({});
      })
    );
  }

  public deleteGroupRoles(
    noLoader = false,
    roles: Role[],
    groupId: string
  ): Observable<any> {
    if (!roles) {
      return of();
    }

    const url = `${this.baseUrl}admin/groups/${groupId}/roles`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const body = roles.map((role) => role._id);

    return this.http
      .request<any>('DELETE', url, { body })
      .pipe(
        catchError((err) => {
          this.toast.error(err.message);

          return of({});
        })
      );
  }
}
