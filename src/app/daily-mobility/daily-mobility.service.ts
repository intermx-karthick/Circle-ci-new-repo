import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { AppConfig } from '../app-config.service';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DailyMobilityService {
  public tableauMenu = new BehaviorSubject('CBSAExplore');
  constructor(
    private httpClient: HttpClient,
    private config: AppConfig
  ) { }
  getTableauVisualURl(noLoader = false) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient
               .get(this.config.envSettings['API_ENDPOINT'] + 'visualization/view', {headers: reqHeaders});
  }
  // openThresholds panel
  public getTableauMenu(): Observable<any> {
    return this.tableauMenu.asObservable();
  }
  public setTableauMenu(state) {
    this.tableauMenu.next(state);
  }
}

