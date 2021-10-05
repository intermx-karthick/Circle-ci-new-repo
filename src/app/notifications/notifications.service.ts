import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, Subject, timer, zip} from 'rxjs';
import {AppConfig} from '../app-config.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {
  catchError,
  filter,
  map,
  pairwise,
  publishReplay,
  refCount,
  skip,
  skipLast,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import {
  Notification,
  NotificationTypeGenericForm,
  NotificationCategoryResponse, NotificationCreateRequest,
  NotificationsListResponse, NotificationsState,
  NotificationType,
  NotificationTypesResponse, Site, SitesList, UnreadNotificationsCount, SiteNotification
} from '@interTypes/Notifications';
import {ThemeService} from '@shared/services';
import {UserData, UserDataFromAPI} from '@interTypes/User';
import {Helper} from '../classes';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private notificationCategories$: Observable<NotificationTypeGenericForm[]>;
  private notifications$: BehaviorSubject<NotificationsState> = new BehaviorSubject<NotificationsState>(null);
  private markedRead: Subject<void> = new Subject<void>();
  private notificationTypes$: Observable<NotificationTypeGenericForm[]>;
  private sites$: Observable<SiteNotification[]>;
  private lastAndLatestModified$: Subject<UnreadNotificationsCount[]> = new Subject<UnreadNotificationsCount[]>();
  // 10 seconds
  private refreshSeconds = 10;
  private refreshInterval: number = this.refreshSeconds * 1000;
  private notificationPerPage = 10;

  constructor(private config: AppConfig,
              private http: HttpClient,
              private themeService: ThemeService) {
  }

  public getNotificationCategories$(): Observable<NotificationTypeGenericForm[]> {
    if (!this.notificationCategories$) {
      const reqUrl = this.config.envSettings['API_ENDPOINT'] + 'notifications/types';
      const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
      this.notificationCategories$ = this.http
        .get(reqUrl, {headers: headers})
        .pipe(
          map((response: NotificationCategoryResponse) => response.notificationTypes),
          publishReplay(1),
          refCount(),
          catchError(error => {
            this.notificationCategories$ = null;
            return of([]);
          }));
    }
    return this.notificationCategories$;
  }

  public getNotificationTypes$(): Observable<NotificationTypeGenericForm[]> {
    if (!this.notificationTypes$) {
      const reqUrl = this.config.envSettings['API_ENDPOINT'] + 'notifications/alert/types';
      const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
      this.notificationTypes$ = this.http
        .get(reqUrl, {headers: headers})
        .pipe(
          map((res: NotificationTypesResponse) => res.alertTypes),
          publishReplay(1),
          refCount(),
          catchError(error => {
            this.notificationTypes$ = null;
            return of([]);
          }));
    }
    return this.notificationTypes$;
  }

  public getNotifications$(): Observable<NotificationsState> {
    return this.notifications$.asObservable();
  }

  public markNotificationAsRead(notificationId: string): Observable<any> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}notifications/${notificationId}`;
    const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http.patch(reqUrl, '', {headers: headers});
  }

  public markNotificationAsDismissed(notificationId: string): Observable<any> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}notifications/${notificationId}/dismiss`;
    const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    return this.http.patch(reqUrl, '',{headers: headers});
  }

  public getUnreadNotificationsCount(): Observable<any> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}notifications/count`;
    const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    const apiCall$ = this.http.get(reqUrl, {headers: headers})
      .pipe(
        catchError(error => of(null)));
    return timer(0, this.refreshInterval)
      .pipe(
        switchMap(() => apiCall$),
        startWith(null),
        pairwise(),
        filter(([oldValue, newValue]: [UnreadNotificationsCount | null, UnreadNotificationsCount| null]) => oldValue?.lastModified !== newValue?.lastModified),
        tap((response) => {
          this.lastAndLatestModified$.next(response);
        }),
        map(([oldCount, newCount]) => newCount?.count),
        tap((response) => {
          this.refreshNotifications();
        }));
  }

  public getLastAndLatestModified(): Observable<any> {
    return this.lastAndLatestModified$;
  }
  public getMoreNotifications(notificationTypeId: string, page: number, status = ''): void {
    let reqUrl2 = `${this.config.envSettings['API_ENDPOINT']}notifications?perPage=${this.notificationPerPage}&type=${notificationTypeId}&page=${page}`;
    if (status !== '' ) {
      reqUrl2 += `&jobStatus=${status}`;
    }
    const headers2 = new HttpHeaders().set('hide-loader', 'hide-loader');
    this.http
      .get(reqUrl2, {headers: headers2})
      .pipe(
        map((res: NotificationsListResponse) => res.types),
        filter((res: NotificationType[]) => res.length > 0),
        catchError(error => of([])))
      .subscribe((res: NotificationType[]) => {
        // get a fresh copy of existing notifications without references for unidirectional data flow
        const notificationData: NotificationsState = Helper.deepClone(
          this.notifications$.getValue()
        );

        // Getting notification data that is already available
        const existingNotifications = notificationData['notifications'].find(
          (notification) => (
            notification._id === res[0]['_id'] &&
            (status === '' || notification.jobStatus === status)
          )
        );
        // Updating new notifications with already available ones
        existingNotifications.notifications.push(...res[0].notifications);
        notificationData.initial = false;
        this.notifications$.next(notificationData);
      });
  }

  public refreshNotifications(): void {
    const reqUrl2 = `${this.config.envSettings['API_ENDPOINT']}notifications?perPage=${this.notificationPerPage}`;
    const headers2 = new HttpHeaders().set('hide-loader', 'hide-loader');
    this.http
      .get(reqUrl2, {headers: headers2})
      .pipe(
        map((res: NotificationsListResponse) => res.types),
        catchError(error => of([])))
      .subscribe((res: NotificationType[]) => {
        const notificationState: NotificationsState = {
          initial: true,
          reset: true,
          notifications: res
        };
        this.notifications$.next(notificationState);
      });
  }

  public getSitesList(): Observable<SiteNotification[]> {
    if (!this.sites$) {
      const theme = this.themeService.getThemeSettings();
      const reqUrl = `${this.config.envSettings['API_ENDPOINT']}admin/sites/access?environment=${theme['environment']}`;
      const headers = new HttpHeaders().set('hide-loader', 'hide-loader');
      this.sites$ = this.http.get(reqUrl, {headers: headers})
        .pipe(map((res: SitesList) => {
            return res.accessControls;
          }),
          publishReplay(1),
          refCount(),
          catchError(() => {
            this.sites$ = null;
            return of([]);
          }));
  }
  return this.sites$;
}

  public createNotification(notification: NotificationCreateRequest): Observable<any> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}notifications`;
    return this.http.post(reqUrl, notification);
  }

  public getNotificationsListFromAPI(
    page: number = 1,
    perPage: number = 50,
    sortBy = 'createdAt',
    order = 'asc',
    noLoader = true
  ): Observable<any> {
    const reqBody = {};
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}admin/notifications?perPage=${perPage}&page=${page}&sortBy=${sortBy}&order=${order}`;
    return this.http.post(reqUrl, reqBody, {headers: reqHeaders});

  }

  public deleteNotification(notificationId: string): Observable<any> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}admin/notifications/${notificationId}`;
    return this.http.delete(reqUrl);
  }

  public getNotificationDetails(notificationId: string): Observable<Notification> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}notifications/${notificationId}`;
    return this.http.get<Notification>(reqUrl);
  }

  public updateNotification(notificationId: string, notification: Notification): Observable<any> {
    const reqUrl = `${this.config.envSettings['API_ENDPOINT']}admin/notifications/${notificationId}`;
    return this.http.put(reqUrl, notification);
  }
  public getUsersFromAPI(pagination = { page: 1, perPage: 10}, searchText = '') {
    let url = `${this.config.envSettings['API_ENDPOINT_V2']}user/search?sortBy=name&order=asc&page=${pagination.page}&perPage=${pagination.perPage}`;
    const filters = {};
    if (searchText) {
      filters['search'] = searchText;
    }
    return this.http.post<any>(url, filters)
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(() => {
          return of([]);
        })
      );
  }
  public getUserDisplayName(user: UserData): string {
    let name = '';
    if (!user.user_metadata) {
      name = user.email.split('@')[0];
    } else {
      if (user.user_metadata['given-name']) {
        name = user.user_metadata['given-name'];
      }
      // Becayse sometimes family name is also undefined
      if (user.user_metadata['family-name']) {
        name += ' ' + user.user_metadata['family-name'];
      }
    }
    return name;
  }
  public getMarkAsReadEvent(): Observable<void> {
    return this.markedRead.asObservable();
  }
  public setMarkAsReadEvent() {
    this.markedRead.next();
  }

  public refreshViewOnNottificationUpdate(): Observable<any> {
    return this.notifications$.pipe(
      skip(1),
      filter((res: NotificationsState) => res !== null),
      map((res: NotificationsState) => {
        return res.notifications
          .filter((notification: NotificationType) => {
            return (
              notification.name === 'job' &&
              notification.jobStatus === 'completed' &&
              notification.notifications?.length <= 10
            );
          })
      }),
      map((notificationTypes: NotificationType[]) => {
        return notificationTypes[0]?.notifications ?? [];
      })
    )
  }

  public clearNotifications(
    reqBody: { type: string; jobStatus: string },
    noLoader = false
  ): Observable<any> {
    let headers;
    if (noLoader) {
      headers = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    const URL = `${this.config.envSettings['API_ENDPOINT']}/notifications/clear`;
    return this.http.post(URL, reqBody, { headers });
  }

  /**
   * @descriptionclear
   *   To remove the completed job notifications by making the count
   */
  public clearCompletedJobNotification() {
    const notifications = this.notifications$
      .getValue()?.notifications ?? [];

    notifications.map((category) => {
      if (category.name === 'job' && category.jobStatus === 'completed') {
        category.count = 0;
      }
      return category;
    });

    this.notifications$.next({
      initial: true,
      reset: true,
      notifications
    });
  }
}
