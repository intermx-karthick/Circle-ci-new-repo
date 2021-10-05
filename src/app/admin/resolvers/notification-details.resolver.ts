import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { combineLatest, EMPTY } from 'rxjs';
import { NotificationsService } from '../../notifications/notifications.service';
import { catchError, map } from 'rxjs/operators';
import { UserData } from '@interTypes/User';

@Injectable()
export class NotificationDetailsResolver implements Resolve<any> {
  constructor(
    private notificationService: NotificationsService,
    private router: Router
  ) {}
  resolve(route: ActivatedRouteSnapshot) {
    const details$ = this.notificationService
      .getNotificationDetails(route.params['id'])
      .pipe(
        catchError(() => {
          this.router.navigate(['admin/alerts/list']);
          return EMPTY;
        })
      );
    return combineLatest([details$]).pipe(
      map(([notification]) => {
        return notification;
      })
    );
  }
}
