import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { TimeStamp } from '@interTypes/time-stamp';

@Component({
  selector: 'app-time-stamp',
  templateUrl: './time-stamp.component.html',
  styleUrls: ['./time-stamp.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeStampComponent implements OnInit {
  @Input() timeStampData = {} as TimeStamp;
  constructor() {}
  ngOnInit(): void {
  }
}
