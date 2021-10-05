import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config.service';

@Injectable()
/**
 * @deprecated This is a legacy service and will be removed. Use the WorkspaceV3Service instead if you want to access project and scenario data or methods.
 */
export class NewWorkspaceService {
  constructor(private http: HttpClient, private config: AppConfig) {
  }

  public updateSpotSchedule(scenarioId, fileInfo, noLoader = false) {
    const requestUrl =  this.config.envSettings['API_ENDPOINT'] + `workflows/scenarios/${scenarioId}/spot_schedule`;
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.http.patch(requestUrl, fileInfo, {headers: reqHeaders});
  }
}
