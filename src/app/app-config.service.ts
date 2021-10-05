import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environment';

@Injectable()
export class AppConfig {
  envSettings: any;

  constructor(private http: HttpClient) {}

  public load() {
    return new Promise((resolve, reject) => {
        this.http.get(window.location.origin + '/endpoint').subscribe(
          data => {
            this.envSettings = data;
            resolve(true);
          },
          error => {
            if (environment.production) {
              this.envSettings = {
                API_ENDPOINT: 'https://intermx-prod.apigee.net/v1/',
                'API_ENDPOINT_V2.1': 'https://intermx-prod.apigee.net/v2.1/',
                'API_ENDPOINT_V2':'https://intermx-test.apigee.net/v2/'

              };
            } else {
              this.envSettings = {
                API_ENDPOINT: 'https://intermx-test.apigee.net/int/v1/',
                'API_ENDPOINT_V2.1': 'https://intermx-test.apigee.net/int/v2.1/',
                'API_ENDPOINT_V2':'https://intermx-test.apigee.net/int/v2/'
              };
            }
            resolve(true);
          }
        );
    });
  }
}
