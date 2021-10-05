import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Company } from '@interTypes/inventory-management';
@Component({
  selector: 'app-organiazation-view',
  templateUrl: './organiazation-view.component.html',
  styleUrls: ['./organiazation-view.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganiazationViewComponent {
  public companyDetails: any;
  @Input() set company(value: any) {
      this.companyDetails = value;
  }
  get company(): any {
      return this.companyDetails;
  }
  constructor() { }

}
