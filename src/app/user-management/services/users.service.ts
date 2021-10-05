import { HttpClient, HttpHeaders, HttpBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpErrorHandlerService, ThemeService } from '@shared/services';

import { AppConfig } from 'app/app-config.service';
import { Group } from 'app/user-management/models/group.model';
import { Observable, of, Subject } from 'rxjs';
import { Role, User } from '../models';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';
@Injectable()
export class UsersService {
  public handleError;
  public scrolling$ = new Subject();

  private baseUrl: string = this.config.envSettings['API_ENDPOINT_V2'];

  private siteName: string;

  public themeSettings: any;

  public httpClientToAvoidInterceptor: HttpClient;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private httpErrorHandler: HttpErrorHandlerService,
    private theme: ThemeService,
    private handler: HttpBackend
  ) {
    this.themeSettings = this.theme.getThemeSettings();
    this.siteName = this.themeSettings && this.themeSettings.site;
    this.handleError = this.httpErrorHandler.createHandleError('User Service');
    this.httpClientToAvoidInterceptor = new HttpClient(handler);
  }

  public getAllUsers(connection: string, noLoader = false): Observable<any[]> {
    const url = `${this.baseUrl}admin/users`;

    let headers: HttpHeaders;

    if (noLoader) {
      Object.assign(headers, { 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any[]>(url, {
      headers,
      params: {
        q: `identities.connection:"${connection}"`
      }
    });
  }

  public dispatchScrollEvent(): void{
    this.scrolling$.next();
  }

  public listenScrollEvent() {
    return this.scrolling$;
  }
  public createUser(body: any, noLoader = false): Observable<User> {
    const url = `${this.baseUrl}admin/users`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post<User>(url, body, { headers });
  }

  public getUser(userId: string, noLoader = false): Observable<User> {
    const url = `${this.baseUrl}admin/users/${userId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<User>(url, { headers });
  }

  public updateUser(
    userId: string,
    body: User,
    noLoader = false
  ): Observable<User> {
    const url = `${this.baseUrl}admin/users/${userId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.patch<User>(url, body, { headers });
  }

  public deleteUser(userId: string, noLoader = false): Observable<User> {
    const url = `${this.baseUrl}admin/users/${userId}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.delete<User>(url, { headers });
  }

  public getUserRoles(userId: string, noLoader = false): Observable<Role[]> {
    const url = `${this.baseUrl}admin/users/${userId}/roles`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<Role[]>(url, { headers });
  }

  public addUserRoles(userId: string, roles: Role[], noLoader = false) {
    if (!roles || !roles.length) {
      return of();
    }

    const url = `${this.baseUrl}admin/users/${userId}/roles`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const roleIds: string[] = roles.map((role) => role._id);

    return this.http.patch(url, roleIds, { headers });
  }

  public deleteUserRoles(userId: string, roles: Role[], noLoader = false) {
    if (!roles || !roles.length) {
      return of();
    }

    const url = `${this.baseUrl}admin/users/${userId}/roles`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const roleIds: string[] = roles.map((role) => role._id);

    return this.http.request('delete', url, {
      headers,
      body: roleIds
    });
  }

  public getUserGroups(userId: string, noLoader = false): Observable<Group[]> {
    const url = `${this.baseUrl}admin/users/${userId}/groups`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<Group[]>(url, { headers });
  }

  public addUserGroups(userId: string, groups: Group[], noLoader = false) {
    if (!groups || !groups.length) {
      return of();
    }

    const url = `${this.baseUrl}admin/users/${userId}/groups`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    const groupIds: string[] = groups.map((group) => group._id);

    return this.http.patch(url, groupIds, { headers });
  }

  public getUserContact(
    userId: string,
    connection,
    noLoader = false
  ): Observable<any> {
    const url = `${this.baseUrl}user/${userId}/contacts?connection=${connection}`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get(url, { params: connection });
  }

  public resetPassword(
    connection: string,
    body: { email: string }
  ): Observable<any> {
    const url = `${this.baseUrl}user/reset?connection=${connection}`;

    const headers = new HttpHeaders({
      'X-Intermx-Reset-Origin': this.themeSettings.domain
    }).set(InterceptorSkipHeader, '');

    return this.http.post(url, body, {
      headers
    });
  }

  public getUserPermissions(
    userId: string,
    noLoader = false
  ): Observable<any[]> {
    const url = `${this.baseUrl}admin/users/${userId}/permissions`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.get<any[]>(url, { headers });
  }

  public removeUserPermissions(
    userId: string,
    permissions: any[],
    noLoader = false
  ) {
    const url = `${this.baseUrl}admin/users/${userId}/permissions`;
    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.request('delete', url, {
      headers,
      body: permissions
    });
  }

  public usersSearch(body: any, noLoader = false): Observable<any> {
    const url = `${this.baseUrl}user/search`;

    let headers: HttpHeaders;
    if (noLoader) {
      headers = new HttpHeaders({ 'hide-loader': 'hide-loader' });
    }

    return this.http.post(url, body, {
      headers
    });
  }
}
