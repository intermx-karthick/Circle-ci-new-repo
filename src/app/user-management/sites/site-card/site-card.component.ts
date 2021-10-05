import { Component, Input, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { ThemeService } from '@shared/services';
import { Site } from 'app/user-management/models';
import { SiteStatuses } from '../../enums';
import { isExpireInWeek } from '../../helpers';

@Component({
  selector: 'user-management-site-card',
  templateUrl: './site-card.component.html',
  styleUrls: ['./site-card.component.less']
})
export class SitesCardComponent implements OnInit {
  public themeSettings: any;
  public model: Site;
  public pathToStatusImage: string;
  public siteStatuses = SiteStatuses;

  @Input() public siteUrl: string;
  @Input() set site(value: Site) {
    if (!value) {
      return;
    }

    this.model = value;
  }

  constructor(
    private theme: ThemeService,
    @Inject(DOCUMENT) private readonly document: any
  ) {}

  public ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    this.theme.themeSettings.subscribe((res) => {
      this.themeSettings = this.theme.getThemeSettings();
    });

    if (this.model.status !== this.siteStatuses.creating) {
      this.pathToStatusImage = this.getPathToStatusImage();
    }
  }

  public getPathToStatusImage(): string {
    let icon = '';

    switch (true) {
      case this.model.status === SiteStatuses.active:
        icon = 'site-status-active.svg';
        break;
      case this.model.retiredDate && isExpireInWeek(this.model.retiredDate):
        icon = 'site-status-retired.svg';
        break;
      case this.model.status === SiteStatuses.disabled ||
        this.model.status === SiteStatuses.retired:
        icon = 'site-status-disabled.svg';
    }

    return `${this.document.location.origin}/assets/custom-icons/${icon}`;
  }
}
