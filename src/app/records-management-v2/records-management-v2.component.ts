import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit , OnDestroy } from '@angular/core';

@Component({
  selector: 'app-records-management-v2',
  templateUrl: './records-management-v2.component.html',
  styleUrls: ['./records-management-v2.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordsManagementV2Component implements OnInit, AfterViewInit , OnDestroy  {
  isClosedNavBar = false;

  constructor(
    private cdRef: ChangeDetectorRef,
    ) {}

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const body = document.body;
    if (!body.classList.contains('intermx-theme-new')) {
      body.classList.add('intermx-theme-new');
    }
  }

  ngOnDestroy(): void {
    const body = document.body;
    if (body.classList.contains('intermx-theme-new')) {
      body.classList.remove('intermx-theme-new');
    }
  }

  toggleNavBar() {
    this.isClosedNavBar = !this.isClosedNavBar;
  }
}
