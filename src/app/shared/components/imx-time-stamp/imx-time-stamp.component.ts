import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { TimeStamp } from '@interTypes/time-stamp';

@Component({
  selector: 'app-imx-time-stamp',
  templateUrl: './imx-time-stamp.component.html',
  styleUrls: ['./imx-time-stamp.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImxTimeStampComponent implements OnInit {

  @Input() timeStampData: any = {} as TimeStamp;

  constructor() { }

  ngOnInit(): void {
  }

}
