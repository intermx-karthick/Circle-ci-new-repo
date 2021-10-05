import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-header-footer',
  templateUrl: './header-footer.component.html',
  styleUrls: ['./header-footer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderFooterComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
