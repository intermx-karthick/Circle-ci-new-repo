import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {NotificationsService} from '../../notifications/notifications.service';
import {combineLatest, forkJoin, Observable, Subject, throwError} from 'rxjs';
import {catchError, filter, map, mergeMap, takeUntil, tap} from 'rxjs/operators';
import {Notification, NotificationResults, Site, SiteNotification} from '@interTypes/Notifications';
import { MatDialog } from '@angular/material/dialog';
import {ConfirmationDialog} from '@interTypes/workspaceV2';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {UserData, UserDataFromAPI} from '@interTypes/User';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-alert-history',
  templateUrl: './alert-history.component.html',
  styleUrls: ['./alert-history.component.less'],
})
export class AlertHistoryComponent implements OnInit, OnDestroy {
  sortBy = 'createdAt';
  order = 'desc';
  constructor(private notificationsService: NotificationsService,
              private dialog: MatDialog) { }
  public displayedColumns: string[] = [
    'date',
    'alertCategory',
    'alertType',
    'message',
    'link',
    'target',
    'status',
    'action'];
  public currentPage = 1;
  public totalPages: number;
  public sites: Site[] = [];
  public users: UserData[] = [];
  private perPage = 25;
  private notifications: Notification[] = [];
  public isLoading = true;
  public dataSource = new MatTableDataSource([]);
  private unsubscribe: Subject<void> = new Subject<void>();
  @ViewChild(MatSort) sort: MatSort;
  public defaultSortDir;
  ngOnInit() {
    // Observable to get notiication data and to update total records
    const getNotifications$: Observable<Notification[]> = this.notificationsService.getNotificationsListFromAPI(this.currentPage, this.perPage, this.sortBy, this.order)
      .pipe(tap((response: NotificationResults) => {
          this.totalPages = Math.ceil(response.pagination.total / this.perPage);
        }),
        map((response: NotificationResults) => response.results));
    // Send the observable to the function which updates the results
    this.getNotificationsList(getNotifications$, false);
  }

  /**
   * Method to get formatted notifications assigned to the current component based on their recipient type
   * Intermx API doesn't store audience name or site name, so we have to call different APIs to get them
   * This uses heavily cached obseravables with combineLatest to assign the audience data
   * If already the sites/users are cached, this doesn't make any additional calls
   *
   * @param getNotifications$ Observable which gives array of Notifications[]
   * @param isUpdate whether to overwrite the current notifications or just append data for pagination
   */
  private getNotificationsList(getNotifications$: Observable<Notification[]>, isUpdate: boolean): void {
    forkJoin([
      this.notificationsService.getSitesList(),
      getNotifications$
    ]).pipe(takeUntil(this.unsubscribe))
    .subscribe(([sites, notifications]: [SiteNotification[], Notification[]]) => {
        this.isLoading = false;
        const formatNotifications = this.formatNotifications(notifications, sites);
        if (!isUpdate) {
          this.notifications = formatNotifications;
        } else {
          this.notifications.push(...formatNotifications);
        }
        this.currentPage += 1;
        this.dataSource.data = this.notifications;
      }, error => {
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /**
   * Method to load more on infinite scrolling
   */
  loadMore() {
      this.isLoading = true;
      // Create observable as required for the notifications
      const getNotifications$ = this.notificationsService.getNotificationsListFromAPI(this.currentPage, this.perPage)
        .pipe(map((response: NotificationResults) => response.results));
      // Pass the observable into the function which formats it using sites and users data
      this.getNotificationsList(getNotifications$, true);
  }


  /**
   * method to loop over notifications and append user and site data on them using ID
   * @param notifications
   * @param sites
   * @param users
   * @returns an array of Notifications[] which includes site and user data
   */
  private formatNotifications(notifications, sites) {
    return notifications
      .map((notification: Notification) => {
        // If site is not empty, it is targeted for a site
        if ((!notification.recipient || notification.recipient === '') &&
          (notification.siteId && notification.siteId !== '')) {
          const targetSite: Site = sites.find((site: SiteNotification) => site.siteId === notification.siteId);
          if (targetSite) {
            notification.siteId = targetSite.siteName;
          }
        } else if (notification.recipient && notification.recipient !== '') {
          // // If recipient is not empty, then it is targeted towards a specific user
            notification.recipientObj = notification.recipientObj;
            notification.siteId = null;
        }
        return notification;
      });
  }

  public deleteNotification(notificationId: string) {
    // Data for confirmation dialogue
    const data: ConfirmationDialog = {
      notifyMessage: false,
      confirmDesc: '<h4 class="confirm-text-icon">Are you sure you want to delete this notification?</h4>',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      headerCloseIcon: false
    };
    // Observable for API call with error handling included
    const apiCall$: Observable<any> = this.notificationsService.deleteNotification(notificationId)
      .pipe(catchError((err, caught) => {
        // Handle any error in the delete API, for now a generic message
        this.showDeleteError();
        return throwError(err);
      }));

    this.dialog.open(ConfirmationDialogComponent, {
      data: data,
      width: '586px'}).afterClosed()
      .pipe(
        // Filter only let the component emit the value if the user clicked yes.
        filter(result => result && result.action),
        // Merge map will only call if the user clicks Yes on the popup
        mergeMap(() => apiCall$))
      .subscribe(res => {
        // Handle successful deletion in local state.
        const deletedIndex = this.notifications.findIndex(item => item._id === notificationId);
        this.notifications.splice(deletedIndex, 1);
        this.dataSource.data = this.notifications;
        const dialog: ConfirmationDialog = {
          notifyMessage: true,
          confirmTitle: 'Success',
          messageText: 'Notification Deleted Successfully',
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: dialog,
          width: '586px'});
      });
  }
  private showDeleteError() {
    const dialog: ConfirmationDialog = {
      notifyMessage: true,
      confirmTitle: 'Error',
      messageText: 'Something went wrong, Notification is not deleted.',
    };
    this.dialog.open(ConfirmationDialogComponent, {
      data: dialog,
      width: '586px'});
  }

  public sortColumn(event) {
    this.sortBy = event.active;
    this.order = event.direction;
    const getNotifications$: Observable<
      Notification[]
    > = this.notificationsService
      .getNotificationsListFromAPI(1, 25, this.sortBy, this.order,false)
      .pipe(
        tap((response: NotificationResults) => {
          this.totalPages = Math.ceil(response.pagination.total / this.perPage);
        }),
        map((response: NotificationResults) => response.results));
    this.getNotificationsList(getNotifications$, false);
  }
}
