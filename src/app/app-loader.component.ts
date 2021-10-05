import {Component} from '@angular/core';

@Component({
  selector: 'app-loader',
  template: `<mat-progress-spinner
    mode="indeterminate"
    [diameter]="80"
    [strokeWidth]="10"
  ></mat-progress-spinner>`,
  styles: [
    '.mat-progress-spinner::ng-deep circle { stroke: #000000; }']
})
export class AppLoaderComponent {
}
