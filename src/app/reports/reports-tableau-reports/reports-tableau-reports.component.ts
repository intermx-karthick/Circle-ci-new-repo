import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-reports-tableau-reports',
    templateUrl: './reports-tableau-reports.component.html',
    styleUrls: ['./reports-tableau-reports.component.less']
})
export class ReportsTableauReportsComponent implements OnInit, OnDestroy {
    id: any;
    vizUrls: any;
    vizObj = null;
    selectData: any;
    constructor(private route: ActivatedRoute) {}
    ngOnInit() {
        const routeData = this.route.snapshot.data;
        this.vizUrls = routeData.visualiserURLs;
        this.route.params.subscribe((params) => {
            const slug = params['id']
                .split('_')
                .map((val, i) => {
                    if (i > 0) {
                        return val.charAt(0).toUpperCase() + val.slice(1);
                    } else {
                        return val;
                    }
                })
                .join('');
            this.id = slug;
            this.selectData = this.vizUrls[this.id];
            this.selectData['width'] = Number(this.selectData['width']);
            this.selectData['height'] = Number(this.selectData['height']);
            this.loadTableau(this.vizUrls[this.id]['url']);
        });
    }
    loadTableau(url) {
        const vizUrl = url;
        if (this.vizObj !== null) {
            this.vizObj.dispose();
        }
        // 'https://public.tableau.com/views/DailyMobility_CBSA/DailyMobility';
        const containerDiv = document.getElementById('vizContainer');
        const options = {
            width: this.selectData['width'],
            height: this.selectData['height'],
            hideTabs: true,
            onFirstInteractive: function () {
                console.log('Run this code when the viz has finished loading.');
            }
        };
        this.vizObj = new tableau.Viz(containerDiv, vizUrl, options);
    }
    ngOnDestroy(): void {
        if (this.vizObj !== null) {
            this.vizObj.dispose();
        }
    }
}
