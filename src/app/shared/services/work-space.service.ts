import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {CommonService} from './common.service';
import {AppConfig} from '../../app-config.service';
import {Observable} from 'rxjs';
import {FormGroup} from '@angular/forms';
import { AudienceNamePipe } from '@shared/pipes/audience-name.pipe';
import { MarketNamePipe } from '@shared/pipes/market-name.pipe';

@Injectable()
export class WorkSpaceService {

  constructor (
    private cService: CommonService,
    private httpClient: HttpClient,
    private config: AppConfig,
    private audienceNamePipe: AudienceNamePipe,
    private marketNamePipe: MarketNamePipe
  ) { }
  getExplorePackages(noLoader = false) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient
               .get(this.config.envSettings['API_ENDPOINT'] + 'inventory/collections', {headers: reqHeaders});
  }

  getExplorePackagesById(noLoader = false, inventorySetId) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient
      .get(this.config.envSettings['API_ENDPOINT'] + 'inventory/collections/' + inventorySetId, { headers: reqHeaders });
  }
  saveExplorePackage(inputs, data = []): Observable<any> {
    const pack = {name: inputs.name, description: inputs.description};
    if (pack['description'] === '') {
      pack['description'] = null;
    }
    pack['inventory'] = data;
    if (inputs.client_id) {
      pack['client_id'] = Number(inputs.client_id);
    }
    if (inputs && inputs['isScenarioInventorySet']) {
      pack['isScenarioInventorySet'] = true;
    }
    const body = {package: pack};
    if (inputs.name_key !== '' && inputs.name_key != null) {
      return this.httpClient
               .patch(this.config.envSettings['API_ENDPOINT'] + 'inventory/collections/' + inputs.id,
                     body);
    } else {
      return this.httpClient
               .post(this.config.envSettings['API_ENDPOINT'] + 'inventory/collections',
                     body);
    }
  }
  
  deletePackage(id) {
    return this.httpClient
               .delete(this.config.envSettings['API_ENDPOINT'] + 'inventory/collections/' + id);
  }


  /** Project Related APIs **/
  getProject(pid) {
    return this.httpClient.get(this.config.envSettings['API_ENDPOINT'] + 'workflows/projects/' + pid);
  }
  getProjects(noLoader = false) {
    let reqHeaders;
    if (noLoader) {
      reqHeaders = new HttpHeaders().set('hide-loader', 'hide-loader');
    }
    return this.httpClient.get(this.config.envSettings['API_ENDPOINT'] + 'workflows/projects', {headers: reqHeaders});
  }


  /** Scenarios Related APIs **/
  formattingScenarios(data, audiences = [], markets = [], places = [], cbsaMarkets = [], clientId = null, counties = [], defaultAudience =  {},  project = {}) {
    const formattedData = [];
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const fData = {
          '_id': '',
          'name': '',
          'labels': '',
          'description': '',
          'units': 0,
          'audience': '',
          'audienceKey': '',
          'market': '',
          'start': '',
          'end': '',
          'impressions': '',
          'trp': '',
          'reach': '',
          'createdAt': '',
          'frequency': '',
          'ownerName' : '',
          'ownerEmail' : ''
        };

        fData['_id'] = data[i]['_id'];
        fData['name'] = data[i]['name'];
        fData['labels'] = data[i]['labels'];
        fData['description'] = data[i]['description'];

        /** add to inventory count */
        fData['units'] = 0;
        if (data[i]['spotCount'] && data[i]['spotCount']['inventory']) {
          fData['units'] = data[i]['spotCount']['inventory'];
        }


        if (typeof data[i]['audience'] !== 'undefined' && audiences.length > 0) {
          if (typeof data[i]['audience']['audience_id']  !== 'undefined' && data[i]['audience']['audience_id'] !== '') {
            const foundAudience = audiences.find(option => option._id === data[i]['audience']['audience_id']);
            if (foundAudience !== undefined) {
              fData['audience'] = foundAudience['title'];
              fData['audienceKey'] = foundAudience['audiences'][0]['key'];
            }

          }
          fData['marketNames'] = [];
          if (data[i]['markets'] && data[i]['markets']['data'] &&  data[i]['markets']['data'].length) {
            fData['marketIds'] = data[i]['markets']['data'].map(market => market['id']);
            switch (data[i]['markets']['data'][0]['type']) {
              case 'CBSA':
                fData['marketIds'].forEach(id => {
                  const market = cbsaMarkets.find(marketObj => marketObj['id'] === id);
                  if (market) {
                    fData['marketNames'].push(market['name']);
                  }
                });
                break;
              case 'County':
                fData['marketIds'].forEach(id => {
                  const market = counties.find(marketObj => marketObj['id'] === id);
                  if (market) {
                    fData['marketNames'].push(market['name']);
                  }
                });
                break;
              default:
                fData['marketIds'].forEach(id => {
                  const market = markets.find(marketObj => marketObj['id'] === id);
                  if (market) {
                    fData['marketNames'].push(market['name']);
                  }
                });
                break;
            }
          }
        }

        /** Formatted audience pipe value include here because sorting the same in MAT table  */
        if (data[i]['audiences'].length) {
          fData['audience'] = this.audienceNamePipe.transform(data[i]['audiences']);
        } else {
          fData['audience'] = defaultAudience && defaultAudience['description'] || '' ;
        }

         /** Formatted market pipe value include here because sorting the same in MAT table  */
        if (data[i]['market'].length) {
          fData['marketNames'] = this.marketNamePipe.transform(data[i]['market']);
        } else {
          fData['marketNames'] = 'United States';
        }


        if (typeof data[i]['when'] !== 'undefined') {
          fData['start'] = data[i]['when']['start'];
          fData['end'] = data[i]['when']['end'];
        }
        if (data[i]['createdAt']) {
          fData['createdAt'] = data[i]['createdAt'];
        }
        if (typeof data[i]['goals'] !== 'undefined') {
          fData['impressions'] = data[i]['goals']['impressions'];
          fData['trp'] = data[i]['goals']['trp'];
          fData['reach'] = data[i]['goals']['reach'];
          fData['frequency'] = data[i]['goals']['frequency'];
        }
        /** Places count update */
        fData['places'] = '';
        if (data[i]['places']) {
          const PlasesSet = places.filter(place => data[i]['places'].indexOf(place._id) !== -1);
          if (PlasesSet.length > 0) {
            let placesIds = [];
            PlasesSet.forEach(place => {
              placesIds = placesIds.concat(place.pois);
            });
            fData['places'] = placesIds.length;
          }
        }
        if (project['ownerName']) {
          fData['ownerName'] = project['ownerName'];
          fData['ownerEmail'] = project['ownerEmail'];
        }
        formattedData.push(fData);
      }
      return formattedData;
    }
  }

  deleteScenarios(sid) {
    return this.httpClient.delete(this.config.envSettings['API_ENDPOINT'] + 'workflows/scenarios/' + sid);
  }
  createScenario(projectId, scenario): Observable<any> {
    return this.httpClient.post(this.config.envSettings['API_ENDPOINT'] + 'workflows/projects/' + projectId + '/scenarios', scenario);
  }

  getScenariobyId(scenarioId) {
    return this.httpClient.get(this.config.envSettings['API_ENDPOINT'] + 'workflows/scenarios/' + scenarioId);
  }

  formatScenarioData(formGroup: FormGroup, commonFilter) {
    // Raw value function is used to get value from the disabled field as well
    const data = formGroup.getRawValue();
    const operaters = commonFilter.operators.map(s => s.id);
    let formatted = {
      'name': data.name,
      'audience': {
        'audience_id': this.returnNullIfEmpty(data.default_audience)
        // 'when': this.returnNullIfEmpty(data.daypart)
      },
      'markets': data.markets && data.markets['data'] &&  data.markets['data'].length && data.markets || null,
      // 'geography': data.geography && data.geography.length && data.geography || null,
      'when': {
        'start': this.returnNullIfEmpty(data.when.start),
        'end': data.when.end && this.addEndHours(data.when.end) || null,
      },
     /* 'goals': [{
        'impressions': 0,
        'trp': 0,
        'reach': 0,
        'frequency': 0
      }],*/
      'goals': [{
        'impressions': data.goals.impressions ? Number(data.goals.impressions) : null,
        'trp': data.goals.trp ? Number(data.goals.trp) : null,
        'reach': data.goals.reach ? Number(data.goals.reach) : null,
        'frequency': data.goals.frequency ? Number(data.goals.frequency) : null,
      }],
      'package': this.returnNullIfEmptyArr(data.inventory_set),
      'places': this.returnNullIfEmptyArr(data.places),
      'description': this.returnNullIfEmpty(data.description),
      'notes': this.returnNullIfEmpty(data.notes),
      'labels': this.returnNullIfEmptyArr(data.scenario_tags),
      'spot_schedule': {
        'start': this.returnNullIfEmpty(data.spot_schedule.start), //this.formatDate(),
        'end': data.spot_schedule.end //this.formatDate(data.spot_schedule.end && this.addEndHours(data.spot_schedule.end) || null)
      },
      operators: {
        'enabled': true,
        'data': operaters.length > 0 ? (operaters.includes('All') && [] || operaters) : []
      },
      mediaTypeFilters: {
        'enabled': true,
        'data': commonFilter.mediaType.length > 0 ? commonFilter.mediaType : []
      },
      market: commonFilter.markets,
      audiences: commonFilter.audiences,
      mediaAttributes: {
        'enabled': commonFilter['filters'] && commonFilter['filters']['mediaAttribute'] || false,
        'data': this.formatMediaattribute(commonFilter.mediaAttributes)
      },
      locationFilters: commonFilter['locationFilters']
    };

    if (commonFilter.threshold && commonFilter['filters']['threshold']) {
      const thresholdFilers = [
        {
          type: 'index_comp_target',
          min: commonFilter['threshold']['inMarketCompIndex'][0],
          max: commonFilter['threshold']['inMarketCompIndex'][1]
        },
        {
          type: 'imp_target',
          min: commonFilter['threshold']['targetImp'][0],
          max: commonFilter['threshold']['targetImp'][1]
        }
      ];
      formatted['measureRangeFilters'] = {
        'enabled': true,
        'data': thresholdFilers
      };
    } else {
      formatted['measureRangeFilters'] = {
        'enabled': false,
        'data': []
      };
    }
    /*if (data.scenario_tags && data.scenario_tags.length > 0) {
      formatted.labels = data.scenario_tags.map(item => item.value);
    }*/
    return formatted;
  }


  formatMediaattribute(mediaAttribute) {
    if (mediaAttribute) {
      let data = {};
      const media = mediaAttribute;
      if (media['orientationList']) {
        data['orientation'] = media['orientationList'];
      }
      // We are multiplying with 12 to convert feets to inches as API expecting inches
      if (media['panelSizeWidthRange']) {
        data['frame_width'] = {
          min: media['panelSizeWidthRange'][0],
          max: media['panelSizeWidthRange'][1] ,
        };
      }

      if (media['spotLength']) {
        data['spot_length'] = {
          min: media['spotLength']['min'],
          max: media['spotLength']['max']
        };
      }

      if (media['panelSizeHeightRange']) {
        data['frame_height'] = {
          min: media['panelSizeHeightRange'][0],
          max: media['panelSizeHeightRange'][1],
        };
      }
      if (
        media['rotating'] !== undefined &&
        media['rotating'] !== null &&
        media['rotating'] !== ''
      ) {
        data['rotating'] = media['rotating'];
      }
      if (media['illuminationHrsRange']) {
        data['illumination_start_time'] = media['illuminationHrsRange'][0];
        data['illumination_end_time'] = media['illuminationHrsRange'][1];
      }
      if (media['auditStatusList'] && media['auditStatusList'].length) {
        data['status_type_name_list'] =  media['auditStatusList'];
      }
      if (
        media['spotAudio'] !== undefined &&
        media['spotAudio'] !== null &&
        media['spotAudio'] !== ''
      ) {
        data['spot_audio'] = media['spotAudio'];
      }
      if (
        media['spotFullMotion'] !== undefined &&
        media['spotFullMotion'] !== null &&
        media['spotFullMotion'] !== ''
      ) {
        data['spot_full_motion'] = media['spotFullMotion'];
      }
      if (
        media['spotPartialMotion'] !== undefined &&
        media['spotPartialMotion'] !== null &&
        media['spotPartialMotion'] !== ''
      ) {
        data['spot_partial_motion'] = media['spotPartialMotion'];
      }
      if (
        media['spotInteractive'] !== undefined &&
        media['spotInteractive'] !== null &&
        media['spotInteractive'] !== ''
      ) {
        data['spot_interactive'] = media['spotInteractive'];
      }
      return data;
    }
  }

  newFormatScenarioData(formGroup: FormGroup) {
    // Raw value function is used to get value from the disabled field as well

    const data = formGroup.getRawValue();
    const formatted = {
      'name': data.name,
      'package': this.returnNullIfEmptyArr(data.inventory_set),
      'places': this.returnNullIfEmptyArr(data.places),
      'description': this.returnNullIfEmpty(data.description),
      'notes': this.returnNullIfEmpty(data.notes),
      'labels': this.returnNullIfEmptyArr(data.scenario_tags),
    };
    return formatted;
  }
  private returnNullIfEmpty(str) {
    const strVariable = this.formatCommandline(str);
    if (strVariable === '' || strVariable === 'us') {
      return null;
    }
    return str;
  }
  private returnNullIfEmptyArr(arr) {
    const arrVariable = arr;
    if (typeof arrVariable !== 'undefined' && arrVariable  != null && arrVariable.length > 0) {
      return arr;
    }
    return null;
  }
  formatCommandline(c: string|string[]) {
    if (typeof c === 'string') {
        return c.trim();
    }
  }
  addEndHours(date: Date): Date {
    if (date) {
      date.setHours(23);
      date.setMinutes(59);
      date.setSeconds(59);
      return date;
    }
  }

  public getFilterOptPos() {
    return JSON.parse(localStorage.getItem('scenarioFilterPosition'));
  }

}
