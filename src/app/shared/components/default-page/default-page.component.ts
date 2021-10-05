import { Component, OnInit } from '@angular/core';
import { environment } from './../../../../environments/environment';
import { TitleService } from '@shared/services';

@Component({
  selector: 'app-default-page',
  templateUrl: './default-page.component.html',
  styleUrls: ['./default-page.component.less']
})
export class DefaultPageComponent implements OnInit {
  public themeSettings: any;

  constructor(public titleService: TitleService) { }

  ngOnInit() {
    this.titleService.setTitle('');
    const sitesData = environment.sitesData;
    sitesData.forEach((data) => {
      const isSiteMatched = data.domains.find((site) => window.location.origin === site);
      if (isSiteMatched) {
        this.themeSettings = data;
        return;
      }
    });
    if (!this.themeSettings) {
      this.themeSettings = {
        logo: '/assets/images/theme2/logo.png',
        baseColor: '#0D96D4',
        site: 'intermx',
        siteName: 'INTERMX',
      };
    }
  }

}
