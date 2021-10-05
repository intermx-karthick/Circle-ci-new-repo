import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';

declare var zE: any;

@Component({
  selector: 'app-page-not-found-404',
  templateUrl: './page-not-found-404.component.html',
  styleUrls: ['./page-not-found-404.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageNotFound404Component implements OnInit, AfterViewInit {

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      (zE as any)?.hide?.();
    }, 2000);
  }

  openFeedback() {
    const res = zdObject.open();
    if (!res) {
      // disabling error messaging...
      console.log(`blocked access by zdObject`);
    }
  }

}
