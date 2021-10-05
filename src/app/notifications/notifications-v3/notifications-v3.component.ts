import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Notification } from '@interTypes/Notifications';
import { AppRegularExp } from '@interTypes/enums';

@Component({
  selector: 'app-notifications-v3',
  templateUrl: './notifications-v3.component.html',
  styleUrls: ['./notifications-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsV3Component implements OnInit {
  @Input() notifications: Notification[] = [];
  @Input() notificationTypeId = '';
  @Input() listHeight = '80vh';
  @Input() jobType = null;
  @Output() markAsRead = new EventEmitter<Notification>();
  @Output() loadMore = new EventEmitter();
  @Output() select = new EventEmitter<Notification>();
  @Output() dismiss = new EventEmitter<Notification>();
  public AppRegularExp = AppRegularExp;

  constructor() {}

  ngOnInit(): void {
  }

  get isNotificationsAvailable() {
    return this.notifications?.length > 0;
  }

  trackNotifications(index, item: Notification) {
    return item._id;
  }

  markNotificationAsRead(notification: any) {
    this.markAsRead.emit(notification);
  }

  loadMoreNotifications(_id: string) {
    this.loadMore.emit(_id);
  }

  selectNotification(notification: Notification) {
    this.select.emit(notification);
  }


  handleModify(notification: Notification) {
   this.handleDismiss({...notification, isForModify: true} as any);
  }

  handleDismiss(notification: Notification) {
    this.dismiss.emit(notification);

    const index = this.notifications.findIndex(
      (_notify) => _notify._id === notification._id
    );
    if(index < 0) return;
    this.notifications.splice(index, 1);
  }
}
