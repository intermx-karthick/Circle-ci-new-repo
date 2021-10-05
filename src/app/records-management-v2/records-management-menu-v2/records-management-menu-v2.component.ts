import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-records-management-menu-v2',
  templateUrl: './records-management-menu-v2.component.html',
  styleUrls: ['./records-management-menu-v2.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordsManagementMenuV2Component implements OnInit {

  constructor(
    private router: Router,
  ) {
  }

  ngOnInit(): void {
  }

}
