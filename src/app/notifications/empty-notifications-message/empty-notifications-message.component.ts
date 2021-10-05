import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-notifications-message',
  templateUrl: './empty-notifications-message.component.html',
  styleUrls: ['./empty-notifications-message.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyNotificationsMessageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
