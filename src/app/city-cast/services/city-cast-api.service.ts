import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from '../../app-config.service';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class CityCastApiService {
    private geoScope = new Subject();
    private scenario = new Subject();
    private baseUrl = `${this.config.envSettings['API_ENDPOINT']}citycast`;
    private version = 2;
    private scenarioTitle = new Subject();
    constructor(private http: HttpClient, private config: AppConfig) {}

    setGeoScope(geoScope) {
        localStorage.setItem('scopeId', geoScope['id']);
        this.geoScope.next(geoScope);
    }
    getGeoScopeFromLocal() {
        return localStorage.getItem('scopeId'); 
    }
    getGeoScope(): Observable<any> {
        return this.scenario.asObservable();
    }
    setScenario(scenario) {
        localStorage.setItem('scenarioId', scenario['id']);
        this.scenario.next(scenario);
    }
    getScenarioTitle(): Observable<any> {
        return this.scenarioTitle.asObservable();
    }
    setScenarioTitle(scenarioTitle) {
        this.scenarioTitle.next(scenarioTitle);
    }
    getScenarioFromLocal() {
        return localStorage.getItem('scenarioId'); 
    }
    getScenario(): Observable<any> {
        return this.scenario.asObservable();
    }

    getTFGeoScopeList(page = 1, size = 50, noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/geoscopes?page=${page}&size=${size}`;
        return this.http.get(url, { headers: reqHeaders });
    }

    getTFGeoScope(scopeId = '', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/geoscopes/${scopeId}?version=${this.version}`;
        return this.http.get(url, { headers: reqHeaders });
    }

    getTFScenariosList(geoscopeID,  page = 0, size = 50, noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        let url = `${this.baseUrl}/geoscopes/${geoscopeID}/scenarios?version=${this.version}&size=${size}`;
        if (page > 0) {
            url += `&page=${page}`;
        }
        return this.http.get(url, { headers: reqHeaders });
    }

    getTFScenario(scenarioeId = '', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/scenarios/${scenarioeId}?version=${this.version}`;
        return this.http.get(url, { headers: reqHeaders });
    }
    saveTFScenario(
        data,
        scopeId,
        noLoader = true
    ): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/geoscopes/${scopeId}/scenarios`;
        return this.http.post(url, data, { headers: reqHeaders });
    }
    updateScenario(
        data,
        scenarioId,
        noLoader = true
    ): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/scenarios/${scenarioId}`;
        return this.http.post(url, data, { headers: reqHeaders });
    }
    cloneCast(
        data,
        scopeId,
        parentCastID = '',
        noLoader = true
    ): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/geoscopes/${scopeId}/scenarios/${parentCastID}/clone?version=${this.version}`;
        return this.http.post(url, data, { headers: reqHeaders });
    }
    getDataFromS3(baseURL, file, noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${baseURL}/${file}`;
        return this.http.get(url, { headers: reqHeaders });
    }
    getDataFromS3URL(s3Url, noLoader = true, type = ''): Observable<any> {
        let reqHeaders;
        let options = {};
        reqHeaders = new HttpHeaders();
        if (noLoader) {
            reqHeaders = reqHeaders.set('hide-loader', 'hide-loader');
        }
        // reqHeaders = reqHeaders.set('Content-Type', 'text/csv');
        if (type !== '') {
            reqHeaders = reqHeaders.set('Accept', type);
            options = {observe: 'response', responseType: 'arraybuffer'};
        }
        options['headers'] = reqHeaders;
        const url = `${s3Url}`;
        return this.http.get(url, options);
    }
    createAssets(data, noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/assets`;
        return this.http.post(url, data, { headers: reqHeaders });
    }
    addInputAssetToScenario(scenarioId, assetId, assetType, noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/scenarios/${scenarioId}/input-assets/${assetId}/${assetType}`;
        return this.http.post(url, {}, { headers: reqHeaders });
    }
    addOrUpdateAssetDelta(assetId, data, deltaId = '', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        delete data['id'];
        let url = `${this.baseUrl}/assets/${assetId}/deltas`;
        if (deltaId !== '') {
            url = url + '/' + deltaId;
        }
        return this.http.post(url, data, { headers: reqHeaders });
    }
    deleteAssetDelta(assetId, deltaId = '', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        let url = `${this.baseUrl}/assets/${assetId}/deltas`;
        if (deltaId !== '') {
            url = url + '/' + deltaId;
        }
        return this.http.delete(url, { headers: reqHeaders });
    }
    getScenarioInputAsset(scenarioeId = '', assetType = '', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        let url = `${this.baseUrl}/scenarios/${scenarioeId}/input-assets`;
        if (assetType !== '') {
            url = `${url}?assetType=${assetType}`;
        }
        return this.http.get(url, { headers: reqHeaders });
    }
    runDraftScenarioChanges(scenarioeId = '', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/scenarios/${scenarioeId}/run?version=${this.version}`;
        return this.http.post(url, {}, { headers: reqHeaders });
    }
    getConfigurations(scenarioeId = '', assetType = 'track', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/configurations`;
        return this.http.get(url, { headers: reqHeaders });
    }
    getScenarioOutputAsset(scenarioeId = '', assetType = 'track', noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/scenarios/${scenarioeId}/output-assets?assetType=${assetType}&version=${this.version}`;
        return this.http.get(url, { headers: reqHeaders });
    }
    getPublishedScenarios(geoscopeID, search = '', page = 0, size = 50, noLoader = true): Observable<any> {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        let url = `${this.baseUrl}/geoscopes/${geoscopeID}/scenarios?version=${this.version}&size=${size}`;
        url += `&filters[status]=published`;
        if (search !== '') {
            url += `&search=${search}`;
        }
        if (page > 0) {
            url += `&page=${page}`;
        }
        return this.http.get(url, { headers: reqHeaders });
    }

    /** This method is used to send a request to compute the data */
    sendRequestForCompute(scenarioId, data, noLoader = true) {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/scenarios/${scenarioId}/request`;
        return this.http.patch(url, data, { headers: reqHeaders });
    }
    /** This method is used to validate a request is already sent or not */
    getRequestForCompute(scenarioId, data, noLoader = true) {
        let reqHeaders;
        if (noLoader) {
            reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
        }
        const url = `${this.baseUrl}/scenarios/${scenarioId}/request`;
        return this.http.post(url, data, { headers: reqHeaders });
    }
}
