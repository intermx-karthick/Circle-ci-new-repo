import { Injectable } from '@angular/core';
import { AppConfig } from '../app-config.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import {
    PopulationFilterState,
    PopulationDetailsResponse,
    GeographyType,
    PopulationSortable,
    PopulationResultItem,
    GeoSetCreateRequest,
    PopulationDetailsRequest,
    MapLayers,
    MapLayerDetails
} from '@interTypes/Population';
import { map } from 'rxjs/operators';
import {Helper} from '../classes';

@Injectable()
export class PopulationService {
    private defaultAudience = {
        audience: 2032,
        name: 'Total Population (0+ Years)'
    };
    private filters$: BehaviorSubject<
        Partial<PopulationFilterState>
    > = new BehaviorSubject<Partial<PopulationFilterState>>({
        geographyType: 'dma',
        audience: this.defaultAudience
    });
    private mapLayers: MapLayers;
    private selectedPlacesCtrlValue = new Subject();
    private radiusCtrlValue = new Subject();
    public counties: any = [];
    constructor(private config: AppConfig, private http: HttpClient) {
        const userData = JSON.parse(localStorage.getItem('user_data'));
        if (
            typeof userData['layers'] !== 'undefined' &&
            typeof userData['layers']['populationLibrary'] !== 'undefined'
        ) {
            this.mapLayers = userData['layers']['populationLibrary'];
        }
    }

    private filterReset = new Subject<
        keyof PopulationFilterState | 'All' | 'population'
    >();

    public getPopulationDetails(
        filterData: PopulationDetailsRequest,
        sort: PopulationSortable,
        page = 1
    ): Observable<PopulationDetailsResponse> {
        let url = `${this.config.envSettings.API_ENDPOINT}audiences/populations?sortBy=${sort.sortKey}&order=${sort.order}&page=${page}&perPage=100`;
        if (page === 1) {
            url = url + '&fieldSet=ids';
        }
        return this.http.post<PopulationDetailsResponse>(url, filterData).pipe(
            map((response: PopulationDetailsResponse) => {
                const returnValue = response;
                // modifying the API results formatting and calculations
                returnValue.results = this.formatGeographies(response.results);
                return returnValue;
            })
        );
    }

    /**
     * This method is used as a temporary method for refreshing the summary as user select/deselect,
     * This API returns all the data in this endpoint which adds additional overhead but the API
     * team said they will optimize it later as per the below conversation
     * https://agiraintermx.slack.com/archives/CB70726QN/p1586339645027900
     *
     * This method should not be used in any other use cases or should not be modified for reuse.
     * This is strictly intended to be used only to get summary refreshed after selection.
     * See the perPage is sent as 1, that is to reduce the amount of data being returned from the API
     * This is the best available optimization that can be done from the UI as of now.
     *
     * The return value also not optimized or formatted according to population library standards.
     * @param summaryReq
     * @param sort
     * @param page
     */
    public getSummaryWithIDs(
        summaryReq: PopulationDetailsRequest,
        sort: PopulationSortable,
        page = 1
    ): Observable<PopulationDetailsResponse> {
        const url = `${this.config.envSettings.API_ENDPOINT}audiences/populations?sortBy=${sort.sortKey}&order=${sort.order}&page=${page}&perPage=1`;
        return this.http.post<PopulationDetailsResponse>(url, summaryReq);
    }
    private formatGeographies(
        geographies: PopulationResultItem[]
    ): PopulationResultItem[] {
        if (geographies.length <= 0) {
            return [];
        }
        const value = geographies.map((geography) => {
            try {
                geography.comp = Number.parseFloat(
                    (geography.comp * 100).toFixed(2)
                );
                geography.formattedIndex = (geography.index * 100).toFixed(0);
                if (geography.geoName) {
                    const geo = geography.geoName.split(',');
                    if (geo.length === 2) {
                        geography.state = geo[1].trim();
                        geography.geoName = geo[0];
                    } else {
                        geography.state = geography.geoName;
                        geography.geoName = 'N/A';
                    }
                } else {
                    geography.state = 'N/A';
                }
                // setting default selection to false, actual value has to be handled in the component level.
                geography.selected = false;
                return geography;
            } catch (e) {
                console.log(e, geography);
            }
        });
        return value;
    }
    public getPopulationFilters$(): Observable<Partial<PopulationFilterState>> {
        return this.filters$.asObservable();
    }
    public setPopulationFilter(type, value: any): void {
        let currentFilters: Partial<PopulationFilterState> = this.filters$.getValue();
        if (!currentFilters) {
            currentFilters = {};
        }
        currentFilters[type] = value;
        // to work better with onPush Change detection strategy, we need to keep the state immutable
        const clone = Helper.deepClone(currentFilters);
        this.filters$.next(clone);
        const filterSelection = {};
        let clickAudience = false;
        if (clone['audience'] && clone['audience']['audience'] !== 2032) {
            filterSelection['audience'] = true;
            clickAudience = true;
        }
        if (clone['market'] && clone['market']['selectedMarkets'].length > 0) {
            filterSelection['market'] = true;
        }
        if (clone['location']) {
            filterSelection['location'] = true;
        }
        if (clone['geographySet']) {
            filterSelection['geographySet'] = true;
        }
        const filterData = { selection: filterSelection, data: clone };
        this.setPopulationFilterSession(filterData);
    }

    public getMapLayer(geoType: keyof GeographyType): MapLayerDetails {
        return this.mapLayers[geoType];
    }

    /**
     * type - clear filter name
     * clearData - if true means we have to clear the selecetd type filters
     */
    public clearFilters(type: keyof PopulationFilterState) {
        const currentFilters: Partial<PopulationFilterState> = this.filters$.getValue();
        if (currentFilters[type]) {
            if (type === 'audience') {
                currentFilters[type] = this.defaultAudience;
            } else {
                delete currentFilters[type];
            }
            const clone: Partial<PopulationFilterState> = JSON.parse(
                JSON.stringify(currentFilters)
            );
            this.filters$.next(clone);
            // Now audience only available so that we are clear all filters
            // this.resetAll();
        }
    }

    public onReset(): Observable<any> {
        return this.filterReset.asObservable();
    }
    public resetAll(): void {
        this.filterReset.next('All');
    }
    public createGeoSet(geoSet: GeoSetCreateRequest): Observable<any> {
        return this.http.post(
            `${this.config.envSettings.API_ENDPOINT}markets/collections`,
            geoSet
        );
    }

    public resetPopulationFilter() {
        this.filterReset.next('population');
    }

    /**
     * @description
     *
     *   Maintaining the placesCtrl state of location filter
     *
     * @param value
     */
    public setSelectedPlacesCtrlValue(value) {
        this.selectedPlacesCtrlValue.next(value);
    }

    public getSelectedPlacesCtrlValue() {
        return this.selectedPlacesCtrlValue.asObservable();
    }

    /**
     * @description
     *
     *  Maintaining the radiusctrl state of location filter
     *
     * @param value
     */
    public setRadiusCtrlValue(value) {
        this.radiusCtrlValue.next(value);
    }

    public getRadiusCtrlValue() {
        return this.radiusCtrlValue.asObservable();
    }

    /**
     * @description
     *   Resetting the filters values. currently using this method on
     * logout.
     *
     */
    public resetFilters() {
        this.filters$.complete();
        this.filters$ = new BehaviorSubject<Partial<PopulationFilterState>>({
            geographyType: 'dma',
            audience: this.defaultAudience
        });
    }

    /**
     * This function is to set the filter in session
     * @public
     * @param {*} filters
     * @memberof PopulationService
     */
    public setPopulationFilterSession(filters, flag = false) {
        localStorage.setItem('populationFilter', JSON.stringify(filters));
        if (flag) {
            Object.entries(filters['data']).forEach(([key, value]) => {
                // const keyType: keyof PopulationFilterState = key;
                this.setPopulationFilter(key, value);
            });
        }
    }

    /**
     * This function will return obeject of filters from session
     * @returns
     * @memberof PopulationService
     */
    public getPopulationFilterSession() {
        return JSON.parse(localStorage.getItem('populationFilter'));
    }
}
