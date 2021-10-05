import { Component, OnInit, OnDestroy
 } from '@angular/core';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'breadcrumbs',
  templateUrl: './bread-crumbs.component.html',
  styleUrls: ['./bread-crumbs.component.less']
})
export class BreadCrumbsComponent implements OnInit, OnDestroy {

  constructor( private commonService: CommonService) { }
  breadcrumbs = [];
  ngOnInit() {
    this.commonService.getBreadcrumbs().subscribe(data => {
      this.breadcrumbs = data;
    });
  }
  ngOnDestroy() {
    this.commonService.setBreadcrumbs([]);
  }
}
