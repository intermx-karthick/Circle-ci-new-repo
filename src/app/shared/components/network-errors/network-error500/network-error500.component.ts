import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  AfterViewInit,
  AfterContentInit,
  AfterContentChecked
} from '@angular/core';
import { Router } from '@angular/router';

declare var zE: any;

@Component({
  selector: 'app-network-error500',
  templateUrl: './network-error500.component.html',
  styleUrls: ['./network-error500.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkError500Component implements OnInit, AfterViewInit {

  constructor(
    private router: Router
  ) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      (zE as any)?.hide?.();
    }, 2000);
  }

  openFeedback() {
    window.location.replace('/');
  }

}
