import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-jobs-organization-view',
  templateUrl: './jobs-organization-view.component.html',
  styleUrls: ['./jobs-organization-view.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsOrganizationViewComponent implements OnInit {

  @Input() companyDetails: any = {};

  constructor() { }

  ngOnInit(): void {
  }

}
