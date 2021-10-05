import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReportsAPIService } from './services/reports-api.service';
@Component({
    selector: 'app-reports',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less']
})
export class ReportsComponent implements OnInit {
    isClosedNavBar = false;
    vizUrls: any;
    constructor(private route: ActivatedRoute, public reportAPIService: ReportsAPIService) { }
    ngOnInit() {
        const routeData = this.route.snapshot.data;
    }
    toggleNavBar() {
        this.isClosedNavBar = !this.isClosedNavBar;
        this.reportAPIService.setOpenCloseNaviBarStatus(this.isClosedNavBar);
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
}
