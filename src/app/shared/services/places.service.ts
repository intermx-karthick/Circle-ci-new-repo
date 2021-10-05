import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AppConfig} from '../../app-config.service';


@Injectable()
export class PlacesService {
  public headers = new Headers({'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*, *'});

  constructor(
    private httpClient: HttpClient,
    private config: AppConfig
  ) {
  }

  /* getPlacesSet() {
    return this.httpClient.get(this.config.envSettings['API_ENDPOINT'] + 'locations/places');
  } */
  /**
   * This funcation used to get places set and based on place id to get places set detils
   * @param placeId
   */
  getPlacesSet(placeId = null, pagination= null, searchStr='') {

    let requestUrl =  this.config.envSettings['API_ENDPOINT'] + `locations/place/collections`;
    let reqHeaders;

    if (placeId) {
      requestUrl += `/${placeId}?details=true`;
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }

    if(pagination && !placeId){
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
      requestUrl = `${requestUrl}?page=${pagination.page}&page_size=${pagination.size}`;
      if (typeof searchStr === 'string' && (searchStr.toString().trim()).length > 0) {
        requestUrl = `${requestUrl}&q=${searchStr}`;
      }
    }

    return this.httpClient.get(requestUrl, { headers: reqHeaders });
  }
  /**
   * This used to get the places data from API
   * @param params api body will pass.
   */
  getPlaceSetsSummary(params, group: boolean = false, noLoader = false) {
    let reqHeaders = null;
    const url = this.config.envSettings['API_ENDPOINT'] + 'locations/place/collections/summary?group=' + group;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient.post(url, params);
  }

  /**
   * This function is to disassociate the places from client
   * @param {*} place_id
   * @param {*} udp_place_id
   * @param {boolean} [noLoader=false]
   * @returns {observables}
   * @memberof PlacesService
   */
  disAssociatePlace(place_id, udp_place_id, noLoader = false) {
    let reqHeaders = null;
    const url = this.config.envSettings['API_ENDPOINT'] + 'locations/places/' + place_id + '/user-defined/' + udp_place_id;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient.delete(url);
  }

  /**
   * This function is to the list of customers who are all associated with the place
   * @param {*} place_id
   * @param {boolean} [noLoader=true]
   * @returns observables
   * @memberof PlacesService
   */
  getCustomersAssociatedPlace(place_id , noLoader = true) {
    let reqHeaders = null;
    const url = this.config.envSettings['API_ENDPOINT'] + 'locations/places/' + place_id + '/customers';
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient.get(url);
  }

  /**
   *This function is used to remove and add places from 
   *PLace set
   * @param {*} params
   * @param {*} placeSetId
   * @param {boolean} [noLoader=false]
   * @returns observable
   * @memberof PlacesService
   */
  updatePlaceSet(params, placeSetId, noLoader = false) {
    let reqHeaders = null;
    const url = this.config.envSettings['API_ENDPOINT'] + 'locations/place/collections/' + placeSetId;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient.put(url, params);
  }
  
/**
 * This function is used to create user defined place
 * @param params place value
 * @param clientId login user client id
 * @param noLoader 
 */
  createNewPlace(params, clientId, noLoader = false) {
    let reqHeaders = null;
    const url = `${this.config.envSettings['API_ENDPOINT']}locations/accounts/${clientId}/places`;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient.post(url, params);
}

  /**
   *This function is used to delete the user define place 
   * @param {number} udPlaceId
   * @param {number} clientId
   */
  deleteUserDefinePlaceByID(udPlaceId, clientId, noLoader = false) {
    let reqHeaders = null;
    const url = `${this.config.envSettings['API_ENDPOINT']}locations/accounts/${clientId}/places/${udPlaceId}`;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient.delete(url);
  }
}
