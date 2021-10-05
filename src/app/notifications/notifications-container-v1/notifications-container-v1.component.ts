import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter, OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { filter, map, takeUntil, tap, take, switchMap, catchError } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';

import { NotificationsService } from '../notifications.service';
import {
  IconState,
  Notification,
  NotificationsState,
  NotificationType
} from '@interTypes/Notifications';
import { AuthenticationService } from '@shared/services';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Component({
  selector: 'app-notifications-container-v1',
  templateUrl: './notifications-container-v1.component.html',
  styleUrls: ['./notifications-container-v1.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsContainerV1Component implements OnInit, OnDestroy {
  @Output() close = new EventEmitter();
  @Output() iconStateChange: EventEmitter<IconState> = new EventEmitter<IconState>();

  public notificationData$: Observable<FormattedNotificationType[]>;
  public isLoading = true;
  public pageNumbers = {};
  public user = {};
  public overAllNotificationCount = 0;
  modifiedTimestamp;
  private notificationSound = null;

  private unsubscribe$ = new Subject();

  constructor(
    private notification: NotificationsService,
    private auth: AuthenticationService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef
  ) {
    this.notificationSound = document.createElement('audio');
    if (this.notificationSound.canPlayType('audio/mpeg')) {
      this.notificationSound.setAttribute('src', 'assets/sounds/chime.mp3');
    } else if (this.notificationSound.canPlayType('audio/ogg')) {
      this.notificationSound.setAttribute('src', 'assets/sounds/chime.ogg');
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.user = this.auth.getUserData();
    this.notification.getLastAndLatestModified().subscribe((res) => {
      this.modifiedTimestamp = res;
    })
    this.notificationData$ = this.notification.getNotifications$().pipe(
      filter((res: NotificationsState) => res !== null),
      tap((data: NotificationsState) => {
        // If Initial set pages to 0 for all sections
        if (data.initial) {
          data.notifications.forEach((notification: NotificationType) => {
            if(notification.name === 'job'){
              this.pageNumbers[
                '' + notification._id + '-' + notification.jobStatus + ''
              ] = 1;
            } else {
              this.pageNumbers[notification._id] = 1;
            }
          });
        }
        // Set overall loading to false
        this.isLoading = false;
      }),
      tap((res: NotificationsState) => {
        // This is to change the notification bell icon state based on the
        const inProgress = res.notifications.find(element => {
          return element.jobStatus === 'inProgress';
        });
        const completed = res.notifications.find(element => {
          return element.jobStatus === 'completed';
        });
        const completedNotifications = completed?.notifications.filter(item => !item.isRead);
        const iconState: IconState = {
          isCompleted: completedNotifications?.length > 0,
          isInProgress: inProgress?.notifications?.length > 0,
          isEmpty: res.notifications.every((element) => {
            return element.notifications.length <= 0;
          })
        };
        this.iconStateChange.emit(iconState);
      }),
      tap((res: NotificationsState) => {
        if (this.modifiedTimestamp && this.modifiedTimestamp.length > 0) {
          const lastModifiedTimestamp = this.modifiedTimestamp[0]?.lastModified ? this.modifiedTimestamp[0]?.lastModified : this.modifiedTimestamp[1]?.lastModified;
          const completedNotification = res.notifications.find(element => {
            return element.jobStatus === 'completed';
          });
          completedNotification.notifications.map((notification) => {
            if (lastModifiedTimestamp && (new Date(lastModifiedTimestamp) < new Date(notification.updatedAt))) {
              this.notificationSound.play();
            }
          })
        }
      }),
      map((res: NotificationsState) => {
          setTimeout(() => {
            this.cdRef.markForCheck();
          }, 500);
          return this.formatNotifications(res.notifications);
        }
      )
    );
  }

  /**
   * @description
   *  Formatting notifications as per jobStatus.
   *
   * @param notifications
   */
  formatNotifications(notifications: NotificationType[]) {
    const tmpNotifications: NotificationType[] = [];
    let inProgressJobsNotifications;
    let completedJobsNotifications;
    let jobsNotifications: NotificationType;
    this.overAllNotificationCount = 0;
    notifications.forEach((notificationType: NotificationType) => {
      this.overAllNotificationCount += notificationType?.count || 0;
      if (notificationType.name === 'job') {
        if (!jobsNotifications) {
          jobsNotifications = notificationType;
        }
        switch (notificationType?.jobStatus) {
          case 'inProgress':
            inProgressJobsNotifications = notificationType;
            break;
          case 'completed':
            completedJobsNotifications = notificationType;
            break;
        }
        return;
      }
      tmpNotifications.push(notificationType);
    });
    if (jobsNotifications) {
      return [
        {
          ...jobsNotifications,
          inProgress: {
            notifications: inProgressJobsNotifications?.notifications,
            count: inProgressJobsNotifications?.count
          },
          completed: {
            notifications: completedJobsNotifications?.notifications,
            count: completedJobsNotifications?.count
          }
        } as any
      ].concat(tmpNotifications);
    } else {
      return tmpNotifications;
    }
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notification
        .markNotificationAsRead(notification._id)
        .subscribe((res) => {
          notification.isRead = true;
          this.notification.setMarkAsReadEvent();
        });
    }
  }

  loadMoreNotifications(notificationType, jobStatus = '') {
    let pageNumberId = notificationType;

    if(jobStatus) {
      pageNumberId = '' + notificationType + '-' + jobStatus + '';
    }

    this.pageNumbers[pageNumberId] += 1;
    this.notification.getMoreNotifications(
      notificationType,
      this.pageNumbers[pageNumberId],
      jobStatus
    );
  }

  trackCategories(index, item: NotificationType) {
    return item._id;
  }

  trackNotifications(index, item: Notification) {
    return item._id;
  }

  closeNotification() {
    this.close.emit();
  }

  isNewNotificationAvailable(notifications: Notification[]) {
    return !!notifications.find((notification) => {
      return !notification.isRead;
    });
  }

  selectNotification(notification: Notification) {
    if (!notification?.moduleData?.scenarioId || notification?.moduleData?.entityType !== 'ScenarioInventoryPlans') {
      return;
    }
    if (!notification.isRead) {
      this.notification
        .markNotificationAsRead(notification._id)
        .subscribe((res) => {
          notification.isRead = true;
          this.notification.setMarkAsReadEvent();
          this.closeNotification();
          this.cdRef.markForCheck();
        });
    }

    this.navigateToScenario(notification?.moduleData?.scenarioId, notification?.moduleData?.projectId);
  }

  viewAll(status: string) {
    this.router.navigateByUrl('workspace-v3/projects/list');
  }

  handleDismiss(notification: Notification) {

    if (!notification?.moduleData?.scenarioId || notification?.moduleData?.entityType !== 'ScenarioInventoryPlans') {
      return;
    }

    if (!notification.isRead) {
      this.notification
        .markNotificationAsDismissed(notification._id)
        .subscribe((res) => {
          notification.isRead = true;
          this.notification.setMarkAsReadEvent();
          this.notification.refreshNotifications();
          this.cdRef.markForCheck();
        });
    }

    if(notification['isForModify']) {
      this.closeNotification();

      this.navigateToScenario(
        notification?.moduleData?.scenarioId,
        notification?.moduleData?.projectId,
        true
      );
    }
  }
  public handleClear(completed: string, categoryId: string) {
    this.notification
      .clearNotifications({
        jobStatus: completed,
        type: categoryId
      })
      .pipe(
        filter(res => res.status === 'success'),
      )
      .subscribe(
        (res) => {
          this.showsAlertMessage(res.message);
          this.notification.clearCompletedJobNotification();
        },
        (errorResponse) => {
          if (errorResponse.error?.message) {
            this.showsAlertMessage(errorResponse.error?.message);
          } else if (errorResponse.error?.error) {
            this.showsAlertMessage(errorResponse.error?.error);
          } else {
            this.showsAlertMessage(
              'Something went wrong, Please try again later'
            );
          }
        }
      );
  }

  private navigateToScenario(scenarioId: string, projectId: string, isForModify = false) {
    const url = `workspace-v3/scenario/${scenarioId}?projectId=${projectId}&planType=inventory&modify=${isForModify ? 'yes': 'no'}`;

    // may use it for future for notification on same page
    // if (/workspace-v3\/scenario/.test(location.href)) {
    //   const scenarioPath = location.href.split('/workspace-v3/scenario/')?.[1]?.split?.('?');
    //   const routerParamsScenarioId = scenarioPath?.[0] ?? '';
    //   const routerQueryParamsProjectID = scenarioPath?.[1]?.split('&')?.[0]?.split('=')?.[1] ?? '';
    //
    //   if (scenarioId == routerParamsScenarioId) {
    //
    //     if(routerQueryParamsProjectID && projectId == routerQueryParamsProjectID){
    //       this.router.navigateByUrl(url);
    //       return;
    //     }
    //
    //     // when projectId not in query params but matched scenario for edge cases
    //     this.router.navigateByUrl(url);
    //     return;
    //   }
    // }

    this.router.navigateByUrl(url);
  }

  public showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.snackBar.open(msg, '', config);
  }
}

interface JobsNotification {
  notifications: Notification[];
}

interface FormattedNotificationType extends NotificationType {
  inProgress?: JobsNotification; // only for job type notifications
  completed?: JobsNotification; // only for job type notifications
}
