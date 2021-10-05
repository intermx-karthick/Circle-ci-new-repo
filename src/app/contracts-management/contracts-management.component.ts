import { AfterViewInit, Component, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    selector: 'app-contracts-management',
    templateUrl: './contracts-management.component.html',
    styleUrls: ['./contracts-management.component.less']
})
export class ContractsManagementComponent   {

    public archivedUrl = '/contracts-management/archived-exports';

    constructor(public router: Router
    ) {

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
    
      toggleNavBar() {
        //this.isClosedNavBar = !this.isClosedNavBar;
      }

      public openArchivedTab() {
        const tabURL = `${location.origin}${this.archivedUrl}`;
        if (location.href !== tabURL)
          window.open(tabURL, '_blank');
      }
}