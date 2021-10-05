import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AuthenticationService} from './authentication.service';
import {throwError as observableThrowError, Observable, of, throwError} from 'rxjs';
import {map, publishReplay, refCount, tap} from 'rxjs/operators';
import {catchError, share} from 'rxjs/operators';
import {AppConfig} from '../../app-config.service';
import {LoaderService} from './loader.service';

@Injectable()
export class TargetAudienceService {
  public defaultAudience: any;
  private audience: Observable<any>;
  private savedAudience$: Observable<any> = null;
  private formattedSavedAudience$: Observable<any> = null;
  public getAudiences$: Observable<any> = null;

  constructor(
    private httpClient: HttpClient,
    private auth: AuthenticationService,
    private config: AppConfig,
    public loader: LoaderService) {
  }

  private buildQueryString(data) {
    const params = [];
    Object.keys(data)
      .map(item => {
        if (data[item] && data[item] !== '') {
          params.push(item + '=' + encodeURIComponent(data[item]));
        }
      });
    return params.join('&');
  }
  public getAudienceWithYear(year: number, data = {}, noLoader = true): Observable<any> {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    let requestUrl = `${this.config.envSettings['API_ENDPOINT']}audiences/${year}`;
    const queryString = this.buildQueryString(data);
    if (queryString !== '') {
      requestUrl = `${requestUrl}?${queryString}`;
    }
    return this.httpClient.get(requestUrl, {headers: reqHeaders})
      .pipe(catchError(this.handleError));
  }
  public searchAudiencesWithYear(year: number, data): Observable<any> {
    const requestUrl = `${this.config.envSettings['API_ENDPOINT']}audiences/${year}/autocomplete`;
    const queryString = this.buildQueryString(data);
    return this.httpClient
      .get(requestUrl + '?' + queryString)
      .pipe(catchError(this.handleError));
  }

  public handleError = (error: Response) => {
    if (error.status === 401) {
      this.auth.logout();
    }
    return observableThrowError(error);
  }

  public getSavedAudiences(): Observable<any> {
    if (!this.savedAudience$) {
      const requestUrl = this.config.envSettings['API_ENDPOINT'] + 'audiences/collections';
      this.savedAudience$ = this.httpClient.get(requestUrl)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((err, caught) => {
            this.savedAudience$ = null;
            return throwError(err);
          })
        );
    }
    return this.savedAudience$;
  }

  public getFormattedSavedAudiences(): Observable<any> {
    if (!this.formattedSavedAudience$) {
      this.formattedSavedAudience$ = this.getSavedAudiences()
        .pipe(map(response => {
            return response.audienceList.map(item => {
              const normalized = this.normalizeSavedAudienceData(item);
              item.displayLabel = normalized.displayLabel;
              item.selectedAudiences = normalized.selectedAudiences;
              return item;
            });
          }),
          publishReplay(1),
          refCount(),
          catchError((err, caught) => {
            this.formattedSavedAudience$ = null;
            return throwError(err);
          })
        );
    }
    return this.formattedSavedAudience$;
  }

  private normalizeSavedAudienceData(savedAudienceItem) {
    if (savedAudienceItem.audiencesInfo.length <= 0) {
      return {};
    }
    let final = '';
    const selected = [];
    savedAudienceItem.audiencesInfo.forEach(character => {
      Object.keys(character).forEach(item1 => {
        character[item1].forEach(item2 => {
          final += item2.catalog.split('.').pop() + ':' + item2.description + ' / ';
          selected.push({
            category: item2.catalog.split('.').pop(),
            description: item2.description,
          });
        });
      });
    });
    return {
      displayLabel: final.replace(/ \/ $/, ''),
      selectedAudiences: selected,
    };
  }

  public deleteAudience(id) {
    return this.httpClient.delete(this.config.envSettings['API_ENDPOINT'] + 'audiences/collections/' + id)
      .pipe(tap(res => {
        this.savedAudience$ = null;
        this.formattedSavedAudience$ = null;
      }));
  }

  public updateAudience(audience, audienceId): Observable<any> {
    return this.httpClient
      .patch(this.config.envSettings['API_ENDPOINT'] + 'audiences/collections/' + audienceId, audience)
      .pipe(tap(x => {
        this.savedAudience$ = null;
        this.formattedSavedAudience$ = null;
      }));
  }

  public saveAudience(audience): Observable<any> {
    return this.httpClient
      .post(this.config.envSettings['API_ENDPOINT'] + 'audiences/collections', audience)
      .pipe(tap(x => {
        this.savedAudience$ = null;
        this.formattedSavedAudience$ = null;
      }));
  }

  public getExploreSession() {
    return JSON.parse(localStorage.getItem('exploreSession'));
  }

  public findSavedAudienceById(id, audiences) {
    return audiences.filter((option) => option._id === id)[0];
  }

  public getDefaultAudience(noLoader = false, measuresRelease = '2020') {
    const localStorageAudience = JSON.parse(localStorage.getItem('defaultAudience'));
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    if (this.defaultAudience && this.defaultAudience[measuresRelease]) {
      const defaultAudience = this.defaultAudience[measuresRelease];
      defaultAudience['measuresRelease'] = measuresRelease;
      return of(defaultAudience);
    } else if (this.audience) {
      return this.audience;
    } else if (localStorageAudience && localStorageAudience[measuresRelease] && Object.keys(localStorageAudience).length > 0) {
      const defaultAudience = localStorageAudience[measuresRelease];
      defaultAudience['measuresRelease'] = measuresRelease;
      return of(defaultAudience);
    } else {
      // 
      this.audience = this.httpClient
        .get(this.config.envSettings['API_ENDPOINT'] + 'audiences/default?measuresRelease=all', {headers: reqHeaders})
        .pipe(
          map(response => {
            this.audience = null;
            this.defaultAudience = response;
            localStorage.setItem('defaultAudience', JSON.stringify(response));
            const defaultAudience = this.defaultAudience[measuresRelease];
            defaultAudience['measuresRelease'] = measuresRelease;
            return defaultAudience;
          }, err => {
            throwError('default audience data can\'t be loaded');
          }),
          share());
      return this.audience;
    }
  }
  clearFiltersCache(){
    this.getAudiences$ = null;
  }

  clearCaches(){
    this.clearFiltersCache();
  }
}
