import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-reports-preview-header',
  templateUrl: './reports-preview-header.component.html',
  styleUrls: ['./reports-preview-header.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsPreviewHeaderComponent implements OnInit {
  @Output() triggerAction = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
  }
  onTriggerAction(action, value = '') {
    this.triggerAction.emit({
      action: action,
      value: value
    });
  }
}
