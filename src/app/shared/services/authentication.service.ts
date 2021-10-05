
import { throwError as observableThrowError, Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from '../../app-config.service';
import {catchError, filter, tap} from 'rxjs/operators';
import swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import {fromPromise} from 'rxjs/internal-compatibility';
import { V2UserDetailsRepsonse } from '@interTypes/user/v2-user-details.repsonse';
import { V2UserResponse } from '@interTypes/user/v2-user.response';
import { LocalStorageKeys, UserRoleTypes } from '@interTypes/enums';
// import { AuthService } from 'app/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  public userDataUpdate: Subject<boolean> = new Subject();
  public userData: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private userDataArray: any;
  private clearCache: Subject<void> = new Subject<void>();
  public token: string;
  public nonce: string;

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private config: AppConfig,
  ) {
  }

  public static checkUserRoleExistsOrNot(role: string) {
    const userData = JSON.parse(
      localStorage.getItem(LocalStorageKeys.USER_DATA)
    );
    const userRoleData = userData?.[LocalStorageKeys.USER_ROLE]
      ? userData?.[LocalStorageKeys.USER_ROLE]
      : [];

    return userRoleData && Array.isArray(userRoleData)
      ? userRoleData.includes(role)
      : false;
  }

  public static isUserContractEditor(): boolean {
    return AuthenticationService.checkUserRoleExistsOrNot(
      UserRoleTypes.CONTRACT_EDIT_ROLE
    );
  }

  public static isUserContractViewer(): boolean {
    return AuthenticationService.checkUserRoleExistsOrNot(
      UserRoleTypes.CONTRACT_VIEWER_ROLE
    );
  }

  public static isUserContractManager(): boolean {
    return AuthenticationService.checkUserRoleExistsOrNot(
      UserRoleTypes.CONTRACT_MANAGER_ROLE
    );
  }

  public clearCache$(): Observable<void> {
    return this.clearCache.asObservable();
  }
  login(data): Observable<any> {
    return this.httpClient.post(window.location.origin + '/login', data).pipe(catchError(this.handleError));
  }

  logout() {
    /**
     * The promise returend from router navigate is converted into an observable.
     * It'll retun true if the navigation is success, if logout is success, clear cache.
     * In cases where a save prompt appears, the prompt uses canExit routeGuard.
     *
     * For the issue reported in IMXUIPRD-2345(JIRA), the logout was a function call instead of a route.
     * the route guard canExit was never triggered before logout. This change fixes that.
     * This change fixes a class of similar issues with logout instead of just the one in reported in 2345.
     */
    const canLogOut$ = fromPromise(this.router.navigate(['/user/logout']));
    canLogOut$.pipe(filter((res: boolean) => res)).subscribe((res: boolean) => {
      this.clearCache.next();
      this.clearCache.complete();
    });
  }

  validateToken(): Observable<any> {
    return this.httpClient.get(this.config.envSettings['API_ENDPOINT'] + 'users');
  }
  getUserData() {
    this.userDataArray = JSON.parse(localStorage.getItem('user_data'));
    const userData = {
      'id': '',
      'name': '',
      'family_name': '',
      'email': '',
      'company': '',
      'title': '',
      'picture': '',
      'userId' : '',
      'gpLoginStatus': true,
    };
    if (this.userDataArray) {
      userData.id = this.userDataArray['id'];
      userData.name = this.userDataArray['name'];
      userData.family_name = this.userDataArray['family-name'];
      userData.email = this.userDataArray['email'];
      userData.company = this.userDataArray['company'];
      userData.title = this.userDataArray['title'];
      userData.picture = this.userDataArray['picture'];
      userData.userId = this.userDataArray['userId'];
      userData.gpLoginStatus = true;
      // userData.gpLoginStatus = this.userDataArray.token['gpLoginStatus'];
    }
    return userData;
  }
  resetPassword(data: any): Observable<any> {
    return this.httpClient.post(window.location.origin + '/reset', data);
    // return this.httpClient.post(this.config.envSettings['API_ENDPOINT'] + 'users/reset', data);
  }
  createIdentify() {
    if (localStorage.getItem('user_data')) {
      const applicationVersion = environment.devops?.image_version + '-' + environment.devops?.image_rc;
      const data = JSON.parse(localStorage.getItem('user_data'));
      const email = data['email'];
      const subdomain = window.location.hostname;
      const fsdetails = {
        'subdomain_str': subdomain,
        'placesDemoEnd_date': data['places_demoEnd'],
        'placesSubscriptionEnd_date': data['places_subscriptionEnd'],
        'placesSubscription_str': data['places_subscription'],
        'familyName_str': data['family-name'],
        'givenName_str': data['given-name'],
        'displayName': data['given-name'] + ' '
          + data['family-name'] !== ' ' ? data['given-name'] + ' ' + data['family-name'] : data['email'],
        'displayName_str': data['given-name'] + ' ' + data['family-name'],
        'email': data['email'],
        'version': applicationVersion
      };
      fsObject.createIdentify(email, fsdetails);
      zdObject.createIdentify(email, fsdetails);
    }
  }
  setModuleAccess(module_access) {
    localStorage.setItem('module_access', JSON.stringify(module_access));
  }
  setUserPermission(user_permission) {
    localStorage.setItem('user_permission', JSON.stringify(user_permission));
  }
  getUserPermission(mod) {
    let user_permission = {};
    const modules = localStorage.getItem('user_permission');
    if (modules != null) {
      user_permission = JSON.parse(modules);
      return user_permission[mod];
    } else {
      return user_permission;
    }
  }
  getModuleAccess(mod) {
    let module_access = {};
    const modules = localStorage.getItem('module_access');
    if (modules != null) {
      module_access = JSON.parse(modules);
      return module_access[mod];
    } else {
      return module_access;
    }
  }
  getUserFeaturePermissions(module) {
    const userFeatures = localStorage.getItem('user_data');
    if (userFeatures) {
      const data = JSON.parse(userFeatures);
      if (data.user_module_access) {
        return data['user_module_access'][module];
      }
    }
    return;
  }
  updateProfile(data) {
    return this.httpClient.patch(this.config.envSettings['API_ENDPOINT'] + 'users', data).pipe(catchError(this.handleError));
  }
  setUserData(data, layers = {}, preferances = {}) {
    try {
      const self = this;
      const module_access = data.user_module_access;
      const userPermissions = data.permissions;
      data['places_subscription'] = '';
      data['places_subscriptionEnd'] = '';
      data['places_demoEnd'] = '';
      data['family-name'] = this.checkAndReturn(data, 'family-name');
      data['given-name'] = this.checkAndReturn(data, 'given-name');
      data['company'] = this.checkAndReturn(data, 'company');
      data['title'] = this.checkAndReturn(data, 'title');
      data['picture'] = this.checkAndReturn(data, 'picture');
      data['markets_requested'] = [];
      data['layers'] = layers;
      data['markets_demo'] = [];
      data['markets_subscribed'] = [];
      data['markets_requested'] = [];
      data['places_requested'] = [];
      data['places_demo'] = [];
      localStorage.setItem('user_data', JSON.stringify(data));
      this.setModuleAccess(module_access);
      this.setUserPermission(userPermissions);
      this.createIdentify();
      self.userDataUpdate.next(true);
      return true;
    } catch (e) {
      return false;
    }
  }

  updateAgreeAccept() {
    return this.httpClient.post(this.config.envSettings['API_ENDPOINT'] + 'users/accept', []).pipe(catchError(this.handleError));
  }
  public handleError = (error: Response) => {
    const err = JSON.parse(error['_body']);
    if (err['statusCode'] === '401') {
      swal('Sorry', 'Authentication fail');
      this.logout();
    }
    return observableThrowError(error);
  }
  public checkAndReturn(data, key) {
    if (data[key]) {
      return data[key];
    }
    return '';
  }


  /**
   *Function to send email on submit of public Login
   *sample data={username:'xxx@domain.com'}
   * @param {object} data
   * @returns {Observable<any>}
   * @memberof AuthenticationService
   */
  publicLoginEmail(data): Observable<any> {
    return this.httpClient.post(window.location.origin + '/login/getcode', data).pipe(catchError(this.handleError));
  }

  /**
   *function is to login for Public site
   *sample data data={username:'xxx.domain.com,password:'.....'}
   * @param {object} data
   * @returns {Observable<any>}
   * @memberof AuthenticationService
   */
  publicLogin(data): Observable<any> {
    return this.httpClient.post(window.location.origin + '/login/passwordless', data).pipe(catchError(this.handleError));
  }

  getUserDetailsUsingAuth0Token(): Observable<V2UserDetailsRepsonse>{
    return this.httpClient.get<V2UserDetailsRepsonse>(this.config.envSettings['API_ENDPOINT_V2'] + 'user/details');

  }

  validateAuth0TokenFromApigee(): Observable<V2UserResponse>{
    return this.httpClient.post<V2UserResponse>(this.config.envSettings['API_ENDPOINT_V2']  + 'user', null);

  }

  getLayersInfo(siteId): Observable<any> {
    return this.httpClient.get(
      this.config.envSettings['API_ENDPOINT'] + 'sites/' + siteId
    );
  }
  updateNewProfile(data, userId) {
    return this.httpClient.patch(`${this.config.envSettings['API_ENDPOINT_V2']}user/${userId}`, data).pipe(catchError(this.handleError));
  }
  getCurrentUserContacts(userId) {
    return this.httpClient.get(`${this.config.envSettings['API_ENDPOINT_V2']}user/${userId}/contacts?connection=Loci`).pipe(catchError(this.handleError));
  }
  getUserPreference(): Observable<any> {
    return this.httpClient.get(
      this.config.envSettings['API_ENDPOINT_V2'] + 'user/preferences'
    );
  }
  updateUserPreference(data): Observable<any> {
    return this.httpClient
      .post(this.config.envSettings['API_ENDPOINT_V2'] + 'user/preferences', data)
      .pipe(catchError(this.handleError));
  }

}
