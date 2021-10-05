import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, OnDestroy } from '@angular/core';
import {Router} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-workspace-base',
  templateUrl: './workspace-base.component.html',
  styleUrls: ['./workspace-base.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceBaseComponent implements OnInit , AfterViewInit , OnDestroy{
  site: any;
  constructor(private router: Router, public dialog: MatDialog) { }

  ngOnInit(): void {
    const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));
    if (themeSettings && themeSettings['siteName']) {
      this.site = themeSettings['site'];
    }
  }

  redirectToOldWs(url) {
    if (this.site === 'geopath') {
      const dialogueData = {
        title: 'Confirmation',
        description: 'Workspace Classic will no longer be available after April 22, 2021',
        confirmBtnText: 'OK',
        displayCancelBtn: true
      };
      return this.dialog.open(NewConfirmationDialogComponent, {
        data: dialogueData,
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      }).afterClosed().pipe(
        map(res => res?.action)
      ).subscribe((flag) => {
        if (flag !== undefined && flag) {
          this.router.navigateByUrl(url);
        }
      });
    } else {
      this.router.navigateByUrl(url);
    }
    
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
