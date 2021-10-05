import { Injectable } from '@angular/core'
import {HttpClient, HttpHeaders} from '@angular/common/http';
import * as mapboxgl from 'mapbox-gl'
import { DatasetOption, DmaOption, FeederMarketData, GeographyData, ProductOption, RecordGeographyData, TimeframeData } from '@interTypes/population-intelligence-types';
import { Observable } from 'rxjs';
import {AppConfig} from '../../../app-config.service';

@Injectable()
export class MapHttpService {
  private baseUrl: string;
  // For now token is localised, need to figure out if environmentalizing the token and base URL and whether they'll be different from IMXAPI.
  private headers = new HttpHeaders({
    'X-Intermx-API-Key': 'S2SQXRV7APjg6Zt1OPkEWexDRi4r5hjc',
  });
  constructor (
    private http: HttpClient,
  ) {
    this.baseUrl = ' https://intermx-test.apigee.net/v1/';
  }

  loadZipSource(): Observable<mapboxgl.VectorSource> {
    return this.http.get<mapboxgl.VectorSource>('https://maps-api-v2.us.carto.com/user/matthew/bigquery/tileset?source=standard-data-mapping.places.zipcode_dma_tiles&format=tilejson&api_key=af7975a810090ff3cde0d0f90bc9473b6d3abc17')
  }

  loadNeighborhoodSource(): Observable<mapboxgl.VectorSource> {
    return this.http.get<mapboxgl.VectorSource>('https://maps-api-v2.us.carto.com/user/matthew/bigquery/tileset?source=standard-data-mapping.lmr.anypop_resident_places_all_ranked_tiles&format=tilejson&api_key=af7975a810090ff3cde0d0f90bc9473b6d3abc17');
  }

  loadDmaSource(): Observable<mapboxgl.VectorSource> {
    return this.http.get<mapboxgl.VectorSource>('https://maps-api-v2.us.carto.com/user/matthew/bigquery/tileset?source=standard-data-mapping.places.dma_tiles&format=tilejson&api_key=af7975a810090ff3cde0d0f90bc9473b6d3abc17');
  }

  loadH3ResidentsData (selectedGeographyType: string, dmaID: number | string, dateRange: string, selectedGeography: number | string, weekdays: string): Observable<TimeframeData> {
    return this.http.get<TimeframeData>(`/${selectedGeographyType}/anytimepop/data/dma${dmaID}/resident/dates${dateRange}/pl${selectedGeography}_wd${weekdays}_hrs.json`);
  }

  loadTradeAreasData (selectedGeographyType: string, dmaID: number | string, dateRange: string, selectedGeography: number | string, weekdays: string): Observable<TimeframeData> {
    return this.http.get<TimeframeData>(`/${selectedGeographyType}/anytimepop/data/dma${dmaID}/tradearea/dates${dateRange}/pl${selectedGeography}_wd${weekdays}_hrs.json`);
  }

  loadDmaOptions(): Observable<Record<string, DmaOption>[]> {
    return this.http.get<Record<string, DmaOption>[]>(`${this.baseUrl}data/anytimepop/dma_config.json`, {headers: this.headers});
  }

  loadProductDatasets(): Observable<DatasetOption[]> {
    return this.http.get<DatasetOption[]>('/anytimepop/global/datasets.json');
  }

  loadGeographyType(type: string, dmaID: number | string): Observable<GeographyData[] | RecordGeographyData> {
    const url = `${this.baseUrl}data/${type}/anytimepop/data/dma${dmaID}/places.json`;
    return this.http.get<GeographyData[] | RecordGeographyData>(url, {headers: this.headers});
  }

  loadNonlocalTradeAreasData (dmaID: number | string, demographic: string, weekdays: string): Observable<FeederMarketData> {
    return this.http.get<FeederMarketData>(`/anytimepop/dma/dma${dmaID}/nonlocal/tradearea/historical/dma/${demographic}/wd${weekdays}_wks.json`);
  }
}
