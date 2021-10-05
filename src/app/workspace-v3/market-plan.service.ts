import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Filter } from '@interTypes/filter';
import {
  GeopathInventoryPlan,
  Goals,
  MarketPlan,
  MarketPlanTargets,
  Plan,
  Query,
  GeopathSummaryQuery,
  MarketTotalInventory,
  Duration
} from '@interTypes/workspaceV2';
import { BehaviorSubject, concat, Observable, EMPTY, Subject, timer } from 'rxjs';
import {
  filter,
  map,
  retry,
  catchError,
  publishReplay,
  refCount,
  retryWhen,
  delay,
  tap,
  mergeMap
} from 'rxjs/operators';
import { AppConfig } from 'app/app-config.service';
import PlanQuery = GeopathInventoryPlan.PlanQuery;
import PlanGoals = GeopathInventoryPlan.Goal;
import { Helper } from 'app/classes';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable()
export class MarketPlanService {
  constructor(private http: HttpClient, private config: AppConfig, private matSnackBar: MatSnackBar) {}

  private marketPlan: BehaviorSubject<MarketPlan> = new BehaviorSubject<
    MarketPlan
  >(null);
  private plans: BehaviorSubject<Plan[]> = new BehaviorSubject<Plan[]>(null);
  private reqHeaders: HttpHeaders = new HttpHeaders().set(
    'hide-loader',
    'hide-loader'
  );
  private updatedMediaType = [];
  private duration$: Observable<any> = null;
  public latestUpdatedPlanId: Subject<any> = new Subject<any>();
  static getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000
    };
  }

  public getMarketPlanData(): Observable<MarketPlan> {
    return this.marketPlan.asObservable();
  }
  public setMarketPlanData(data: MarketPlan): void {
    if (data) {
      this.marketPlan.next(data);
    }
  }
  public setPlanData(planData: Plan[]): void {
    if (planData) {
      this.plans.next(planData);
    }
  }
  public getPlans(): Observable<Plan[]> {
    return this.plans.asObservable();
  }
  public getTargetData(): Observable<MarketPlanTargets> {
    return this.getMarketPlanData().pipe(
      // Checking if data is coming and emitting only when the data is there
      filter((marketPlan: MarketPlan) => {
        if (!marketPlan) {
          return false;
        }
        if (!marketPlan.targets) {
          return false;
        }
        const target = marketPlan.targets;
        return (
          target.mediaTypeFilters.length > 0 ||
          target.markets.length > 0 ||
          target.audiences.length > 0
        );
      }),
      map((marketPlan: MarketPlan) => {
        marketPlan.targets.operatorsArray = this.formatOperatorsArray(
          marketPlan
        );
        return marketPlan.targets;
      })
    );
  }

  private formatOperatorsArray(marketPlan: MarketPlan): Filter[] {
    let operators: Filter[];
    if (
      marketPlan.targets.operators &&
      marketPlan.targets.operators.length > 0
    ) {
      operators = marketPlan.targets.operators.map((item) => {
        return {
          id: item,
          name: item
        };
      });
    }
    return operators;
  }

  public cleanMediaTypeData(mediaTypes) {
    if (mediaTypes) {
      return mediaTypes.map((item) => {
        return {
          data: item.data,
          ids: item.ids,
          selection: item.selection || {}
        };
      });
    } else {
      return [];
    }

  }
  public prepareMediaType(operators, medias, locks = [], measuresRaange) {
    const mediaTypes = Helper.deepClone(medias);
    const mediaGroups = [];
    if (!operators || (operators && operators.length === 0)) {
      mediaTypes.filter((m) => {
        const mediaType = Helper.deepClone(m);
        const mediaIds = [];
        const materialMedias =
          (mediaType?.ids?.material_medias &&
            Helper.deepClone(mediaType.ids.material_medias)) ||
          [];
        let lockFlag = true;
        const groupList = {
          frame_media_name_list: [],
          media_type_list: [],
          classification_type_list: [],
          construction_type_list: [],
          measures_range_list: measuresRaange
        };
        if (mediaType.ids.medias) {
          mediaIds.push(...mediaType['ids']['medias']);
          if (mediaIds.length > 0) {
            groupList['frame_media_name_list'].push(...mediaIds);
          }
        }

        if (mediaType.ids.environments.length > 0) {
          groupList['classification_type_list'] = mediaType.ids.environments;
        }
        if (
          mediaType.ids.construction &&
          mediaType.ids.construction.length > 0
        ) {
          groupList['construction_type_list'] = mediaType.ids.construction;
        }
        if (mediaType.ids.mediaTypes && mediaType.ids.mediaTypes.length > 0) {
          groupList['media_type_list'] = mediaType.ids.mediaTypes;
        }
        if (mediaType.ids.material && mediaType.ids.material !== '') {
          groupList['frame_media_name_list'].push(...materialMedias);
          if (mediaType.ids.material !== 'both') {
            groupList['digital'] = mediaType.ids.material === 'true';
          }
        }

        if (locks.length > 0) {
          locks.map((lock) => {
            if (
              this.compare(
                groupList['frame_media_name_list'],
                lock['frame_media_name_list']
              ) &&
              this.compare(
                groupList['media_type_list'],
                lock['media_type_list']
              ) &&
              this.compare(
                groupList['classification_type_list'],
                lock['classification_type_list']
              ) &&
              this.compare(
                groupList['construction_type_list'],
                lock['construction_type_list']
              )
            ) {
              if (lock['value'] !== '') {
                groupList['lock'] = {
                  measure: lock['field'],
                  value: Number(lock['value'])
                };
                if (Number(lock['value']) <= 0) {
                  lockFlag = false;
                }
              }
            }
          });
        }
        if (lockFlag) {
          mediaGroups.push(groupList);
        }
      });
    } else {
      operators.filter((operator) => {
        mediaTypes.filter((m) => {
          const mediaType = Helper.deepClone(m);
          let lockFlag = true;
          const mediaIds = [];
          if (mediaType.ids.medias) {
            mediaIds.push(...mediaType['ids']['medias']);
          }
          const groupList = {
            operator_name_list: [operator],
            frame_media_name_list: mediaIds,
            media_type_list: [],
            classification_type_list: [],
            construction_type_list: [],
            measures_range_list: measuresRaange
          };
          const materialMedias =
            (mediaType.ids.material_medias &&
              Helper.deepClone(mediaType.ids.material_medias)) ||
            [];
          if (mediaType.ids.environments.length > 0) {
            groupList['classification_type_list'] = mediaType.ids.environments;
          }
          if (
            mediaType.ids.construction &&
            mediaType.ids.construction.length > 0
          ) {
            groupList['construction_type_list'] = mediaType.ids.construction;
          }
          if (mediaType.ids.mediaTypes && mediaType.ids.mediaTypes.length > 0) {
            groupList['media_type_list'] = mediaType.ids.mediaTypes;
          }
          if (mediaType.ids.material && mediaType.ids.material !== '') {
            groupList['frame_media_name_list'].push(...materialMedias);
            if (mediaType.ids.material !== 'both') {
              groupList['digital'] = mediaType.ids.material === 'true';
            }
          }
          if (locks.length > 0) {
            locks.map((lock) => {
              if (
                this.compare(
                  groupList['frame_media_name_list'],
                  lock['frame_media_name_list']
                ) &&
                this.compare(
                  groupList['operator_name_list'],
                  lock['operator_name_list']
                ) &&
                this.compare(
                  groupList['media_type_list'],
                  lock['media_type_list']
                ) &&
                this.compare(
                  groupList['classification_type_list'],
                  lock['classification_type_list']
                ) &&
                this.compare(
                  groupList['construction_type_list'],
                  lock['construction_type_list']
                )
              ) {
                if (lock['value'] !== '') {
                  groupList['lock'] = {
                    measure: lock['field'],
                    value: Number(lock['value'])
                  };
                  // if (lock['value'] === '' || Number(lock['value']) <= 0)
                  // Based on Matthew feedback the when user set lock to empty we should reset that media type values.
                  if (lock['value'] !== '' && Number(lock['value']) <= 0) {
                    lockFlag = false;
                  }
                }
              }
            });
          }
          if (lockFlag) {
            mediaGroups.push(groupList);
          }
        });
      });
    }
    return mediaGroups;
  }
  public prepareGoals(goalFormData): Goals {
    return {
      trp: Number(goalFormData.trp),
      reach: Number(goalFormData.reach),
      frequency: Number(goalFormData.frequency),
      imp: Number(goalFormData.imp),
      type: goalFormData.type || 'trp',
      duration: Number(goalFormData.duration) || 4,
      effectiveReach: Number(goalFormData.effectiveReach),
      allocationMethod: goalFormData.allocationMethod
    };
  }

  compare(arr1, arr2) {
    if (arr1 && arr2) {
      return arr1.sort().toString() === arr2.sort().toString();
    } else if (arr1 === null && arr2 === null) {
      return;
    }
    return false;
  }

  public generatePlans(
    scenarioId: string,
    planData: MarketPlan,
    update: boolean = false
  ): Observable<any> {
    const url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/marketPlans`;
    if (update) {
      return this.http.put(url, planData, { headers: this.reqHeaders });
    } else {
      return this.http.post(url, planData, { headers: this.reqHeaders });
    }
  }
  public autoSavePlanTargets(
    scenarioId: string,
    planData: MarketPlan
  ): Observable<any> {
    /**
     * fixed empty array validation for mediaTypeFilters from the below API call
     *  */
    const updatePlanData = { ...planData };
    if (
      updatePlanData['targets']['mediaTypeFilters'] &&
      updatePlanData['targets']['mediaTypeFilters'].length === 0
    ) {
      delete updatePlanData['targets']['mediaTypeFilters'];
    }
    if (
      updatePlanData['targets']['markets'] &&
      updatePlanData['targets']['markets'].length === 0
    ) {
      delete updatePlanData['targets']['markets'];
    }
    const url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/marketPlans`;
    return this.http.post(url, planData, { headers: this.reqHeaders });
  }
  public getMarketPlans(scenarioId: string): Observable<MarketPlan> {
    const url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}`;
    return this.http.get(url, { headers: this.reqHeaders }).pipe(
      filter((data) => data['scenario'] && data['scenario']['marketPlans']),
      map((res) => res['scenario']['marketPlans'])
    );
  }
  public generatePlansFromGP(plans: Plan[], scenarioId: string): void {
    // Creating array of observables using the data selected by the user
    const queries: Observable<any>[] = plans
      .filter(
        (plan: Plan) =>
          Object.keys(plan.plan).length <= 0 ||
          !plan.plan.totalMarketInventoryInfo
      )
      .map((plan: Plan) => {
        const query = { ...plan.query };
        query['plan_id'] = plan._id;
        return this.getPlanMarketCount(this.prepareMarketCountQuery(query));
      });
    // Using concat to wait for one request to complete before another one fires up
    const data = Helper.deepClone(this.plans.getValue());
    concat(...queries).subscribe((marketInventoryInfo) => {
      // Getting current marketPlan Value
      const plan = plans.find(
        (marketPlan) => marketPlan._id === marketInventoryInfo['plan_id']
      );
      // This is to get plans info from Geopath Plans API
      this.getInventoryPlans(plan.query, marketInventoryInfo).subscribe(
        (responseData) => {
          const index = data.findIndex(
            (marketPlan) => marketPlan._id === marketInventoryInfo['plan_id']
          );
          if (data[index] && data[index]['plan']) {
            data[index].plan = responseData;
           /*  if (
              data[index].query.operators &&
              data[index].query.operators.length > 0
            ) {
              data[index].query.operators = this.getOperators(
                marketInventoryInfo
              );
            } */
            data[index]['plan'].totalMarketInventoryInfo =
              marketInventoryInfo['marketData'];
          }
          // ReAssigning the marketPlan value again to be fired for the listeners
          this.setPlanData(data);
          this.updateSinglePlan(
            scenarioId,
            data[index]['_id'],
            data[index]
          ).subscribe();
        },
        (error) => {
          const config = MarketPlanService.getSnackBarConfig();
          // TODO - Have to change this static message based on API error message.
          const message = 'There are some unsupported data in the plan you’re trying to generate.'
          this.matSnackBar.open(message, 'DISMISS', {
            ...config
          });
        }
      );
    });
  }

  public updatePlansFromGP(
    plan: Plan,
    scenarioId: string,
    planId: string,
    callback = () => {}
  ): void {
    this.getPlanMarketCount(this.prepareMarketCountQuery(plan.query)).subscribe(
      (marketInventoryInfo) => {
        const allPlans = Helper.deepClone(this.plans.getValue());
        const index = allPlans.findIndex(
          (marketPlan) => marketPlan['_id'] === planId
        );
        this.getInventoryPlans(plan.query, marketInventoryInfo).subscribe(
          (responseData) => {
            if (index >= 0) {
              allPlans[index].query = plan.query;
              // Get the locks index if value is zero
              plan.query.locks.map((lock) => {
                if (lock.value !== '' && Number(lock.value) === 0) {
                  if (lock['mediaTypeIndex'] >= 0) {
                    /** Finding  mediaTypeIndex based on mediType*/
                    let mediaTypeIndex = '';
                    allPlans[index].plan['allocation_list'].map(
                      (aList, aIndex) => {
                        if (
                          aList.media_type_group['frame_media_name_list']
                            .sort()
                            .join(',') ===
                          lock.frame_media_name_list.sort().join(',')
                        ) {
                          if (
                            lock.classification_type_list &&
                            lock.classification_type_list !== null &&
                            aList.media_type_group['classification_type_list']
                              .sort()
                              .join(',') ===
                              lock.classification_type_list.sort().join(',')
                          ) {
                            mediaTypeIndex = aIndex;
                          } else {
                            mediaTypeIndex = aIndex;
                          }
                        }
                      }
                    );

                    if (
                      allPlans[index].plan['allocation_list'][mediaTypeIndex]
                    ) {
                      responseData['allocation_list'].splice(
                        mediaTypeIndex,
                        0,
                        allPlans[index].plan['allocation_list'][mediaTypeIndex]
                      );
                    }

                    /** find summary index and added to summary list */
                    let summaryIndex = '';
                    allPlans[index].plan['summaries'][
                      'by_media_type_group'
                    ].map((sList, sIndex) => {
                      if (
                        sList.media_type_group['frame_media_name_list']
                          .sort()
                          .join(',') ===
                        lock.frame_media_name_list.sort().join(',')
                      ) {
                        if (
                          lock.classification_type_list &&
                          lock.classification_type_list !== null &&
                          sList.media_type_group['classification_type_list']
                            .sort()
                            .join(',') ===
                            lock.classification_type_list.sort().join(',')
                        ) {
                          summaryIndex = sIndex;
                        } else {
                          summaryIndex = sIndex;
                        }
                      }
                    });
                    /** updaing  summary based on mediType*/
                    if (
                      allPlans[index].plan['summaries']['by_media_type_group'][
                        summaryIndex
                      ]
                    ) {
                      responseData['summaries']['by_media_type_group'].splice(
                        mediaTypeIndex,
                        0,
                        allPlans[index].plan['summaries'][
                          'by_media_type_group'
                        ][summaryIndex]
                      );
                    }
                  } else {
                    if (
                      allPlans[index].plan['allocation_list'][
                        lock.allocationIndex
                      ]
                    ) {
                      responseData['allocation_list'].splice(
                        lock.allocationIndex,
                        0,
                        allPlans[index].plan['allocation_list'][
                          lock.allocationIndex
                        ]
                      );
                    }
                  }
                }
              });
              allPlans[index].plan = responseData;
              if (
                allPlans[index].query.operators &&
                allPlans[index].query.operators.length > 0
              ) {
                allPlans[index].query.operators = this.getOperators(
                  marketInventoryInfo
                );
              }
              // allPlans[index].query.operators = this.getOperators(marketInventoryInfo);
              allPlans[index].plan.totalMarketInventoryInfo =
                marketInventoryInfo['marketData'];
            }

            // ReAssigning the marketPlan value again to be fired for the listeners
            this.latestUpdatedPlanId.next(planId);
            this.setPlanData(allPlans);
            if (callback) {
              callback();
            }
            this.updateSinglePlan(
              scenarioId,
              planId,
              allPlans[index]
            ).subscribe();
          },
          (error) => {
            this.setPlanData(this.plans.getValue());
          }
        );
      }
    );
  }
  public updateSinglePlan(
    scenarioId: string,
    planId: string,
    plan: Plan
  ): Observable<any> {
    /**
     * fixed empty array validation for operators and locks from the below API call
     *  */
    const updatePlan = { ...plan };

    if (
      updatePlan['query']['operators'] &&
      updatePlan['query']['operators'].length === 0
    ) {
      delete updatePlan['query']['operators'];
    }
    if (
      updatePlan['query']['locks'] &&
      updatePlan['query']['locks'].length === 0
    ) {
      delete updatePlan['query']['locks'];
    }

    const url = `${this.config.envSettings['API_ENDPOINT_V2']}workflows/scenarios/${scenarioId}/marketPlans/${planId}`;
    return this.http
      .patch(url, updatePlan, { headers: this.reqHeaders })
      .pipe(retry(3));
  }
  public resetData(): void {
    this.marketPlan.next(null);
    this.plans.next(null);
  }

  /**
   * This function is to get inventory plan info from Geopath API
   * @param filterQuery
   * @param marketInventoryData
   */
  private getInventoryPlans(
    filterQuery,
    marketInventoryData: MarketTotalInventory[] = []
  ) {
    const query: Query = { ...filterQuery };
    if (filterQuery.operators && filterQuery.operators.length > 0) {
      query.operators = filterQuery.operators; //this.getOperators(marketInventoryData);
    } else {
      delete query.operators;
    }
    let marketIds = [];
    if (query.market['marketsGroup'] && query.market.marketsGroup.length) {
      marketIds = query.market.marketsGroup.map((option) => option.id);
    } else {
      marketIds.push(query.market.id);
    }

    marketIds = marketIds.filter((id) => id);
    const planGoal: PlanGoals = this.formatPlanGoal(query.goals);

    const measures_range_list = this.formatMeasuresRangeList(
      query.measureRangeFilters
    );
    const planQuery: PlanQuery = {
      target_geography_list: marketIds,
      target_segment: query.audience.id,
      measures_release: query.audience['measuresRelease'] ? query.audience['measuresRelease'] : 2020,
      media_type_group_list: this.prepareMediaType(
        query.operators,
        query.mediaTypeFilters,
        query.locks,
        measures_range_list
      ),
      allocation_method: query.goals.allocationMethod,
      goal: planGoal
    };
    if (planQuery['media_type_group_list'].length <= 0) {
      delete planQuery['media_type_group_list'];
    }
    return this.http
      .post(
        this.config.envSettings['API_ENDPOINT_V2.1'] + 'inventory/plans',
        planQuery,
        { headers: this.reqHeaders }
      )
      // .pipe(retry(3));
      .pipe(    
        retryWhen(errors =>
          errors.pipe(
            mergeMap((err, i) => {
              if (err?.status == 504) {
                if ((i+1) >= 4) {  // After Retry 4 times error msg will been show.
                  this.matSnackBar.open('Our servers are unavailable at the moment, please try again later.', '', MarketPlanService.getSnackBarConfig());
                  throw err;
                }
                return timer(1000);
              } else {
                this.matSnackBar.open(err?.error?.message ? err?.error?.message : 'Something went wrong', '', MarketPlanService.getSnackBarConfig())
                throw err;
              }      
            })
          )
        )
      );
  }

  private formatMeasuresRangeList(thresholdMeasure) {
    const measures_range_list = [];
    if (thresholdMeasure.length > 0) {
      /** As API team requested we have conventing the percentage value in to float here (value / 100) eg: 1%/100 = 0.01 **/
      if (typeof thresholdMeasure[0]['inMarketCompIndex'] !== 'undefined') {
        /** Here converting logarithmic scale value to original value
         * 0 - 74: 15 stops
         * 75 - 149: 75 stops
         * 150 - 499: 70 stops
         * 500 - 1000: 50 stops
         **/
        const inMarketCompIndex = {
          type: 'index_comp_target',
          min: this.targetAudienceMinMax(
            thresholdMeasure[0]['inMarketCompIndex'][0]
          ),
          max: this.targetAudienceMinMax(
            thresholdMeasure[0]['inMarketCompIndex'][1]
          )
        };
        measures_range_list.push(inMarketCompIndex);
      }
      if (typeof thresholdMeasure[0]['targetImp'] !== 'undefined') {
        /**
         * Refer card IMXMAINT-184, the measure In-market Target impressions should be mapped to imp_target_inmkt, but it was mapped to imp_target. It is incorrect.
         * To spare the data migration for old plans, I'm leaving the rest of hte places as is and just changing the GP API calls to handle the mapping
         */
        const targetImp = {
          type: 'imp_target_inmkt',
          min: thresholdMeasure[0]['targetImp'][0],
          max: thresholdMeasure[0]['targetImp'][1]
        };
        if (targetImp['max'] >= 150000) {
          delete targetImp['max'];
        }
        measures_range_list.push(targetImp);
      }
    } else {
      /** Adding default threshold filter values for existing market plan */
      const threshold = [
        {
          type: 'index_comp_target',
          min: 50,
          max: 1000
        },
        {
          type: 'imp_target_inmkt',
          min: 0
        }
      ];
      measures_range_list.push(...threshold);
    }
    return measures_range_list;
  }

  private targetAudienceMinMax(value) {
    let original = value;
    if (value <= 15) {
      original = value * 5;
    } else if (value <= 90) {
      original = value - 15 + 75;
    } else if (value <= 160) {
      original = (value - 90) * (350 / 70) + 150;
    } else if (value <= 210) {
      original = (value - 160) * (500 / 50) + 500;
    }
    return original;
  }

  // This function will format the plan goals based on plan goal type
  private formatPlanGoal(goals): PlanGoals {
    let goalType = 'trp';
    let value = goals['trp'];
    switch (goals['type'] || 'trp') {
      case 'trp':
        goalType = 'trp';
        value = goals['trp'];
        break;
      case 'reach':
        goalType = 'reach_pct';
        value = goals['reach'];
        break;
      case 'imp':
        goalType = 'imp_target_inmkt';
        value = goals['imp'];
        break;
      default:
        break;
    }
    return {
      // because geopath API expects in no of days
      period_days: goals.duration * 7,
      measure: goalType,
      value: value
    };
  }
  private getOperators(marketInventoryData) {
    return marketInventoryData['marketData']
      .map((info) => info.operator)
      .filter(this.getUniqueValues);
  }
  /**
   * This method is to get inventory Info from Geopath for a given plan.
   * @param filterData
   */
  private getPlanMarketCount(filterData: GeopathSummaryQuery): Observable<any> {
    const filters = { ...filterData };
    delete filters['plan_id'];
    return this.http
      .post(
        this.config.envSettings['API_ENDPOINT_V2.1'] +
          'inventory/summary/search',
        filters,
        { headers: this.reqHeaders }
      )
      .pipe(
        map((response) => {
          return response['summaries'].filter((summary) => summary.spots > 0);
        }),
        map((summaries) => {
          const data = {};
          data['plan_id'] = filterData['plan_id'];
          data['marketData'] = summaries.map((summary) => {
            if (
              summary['summarizes'] &&
              summary['summarizes']['summarizes_id_list']
            ) {
              return {
                spots: summary['spots'],
                mediaType:
                  summary['summarizes']['summarizes_id_list'][0]['name'],
                media: summary['summarizes']['summarizes_id_list'][1]['name'],
                operator:
                  summary['summarizes']['summarizes_id_list'][2]['name'],
                classificationType:
                  summary['summarizes']['summarizes_id_list'][3]['name'],
                constructionType:
                  summary['summarizes']['summarizes_id_list'][4]['name'],
                digital:
                  summary['summarizes']['summarizes_id_list'][5]['name'] ===
                  'true'
                    ? true
                    : false
              };
            }
          });
          return data;
        })
      );
  }

  /**
   * This function is to prepare the query which will send to Geopath summary API to get inventory counts.
   * @param query
   */
  private prepareMarketCountQuery(q) {
    const query = Helper.deepClone(q);
    const marketIds = [];
    if (query.market.id) {
      marketIds.push(query.market.id);
    } else if (
      query.market['marketsGroup'] &&
      query.market['marketsGroup'].length
    ) {
      query.market['marketsGroup'].forEach((market) => {
        marketIds.push(market['id']);
      });
    }
    const summaryQuery: GeopathSummaryQuery = {
      plan_id: query.plan_id,
      target_geography_list: marketIds,
      inventory_market_list: marketIds,
      summary_level_list: [
        'Media Type',
        'Frame Media',
        'Plant',
        'Classification Type',
        'Construction Type',
        'Digital'
      ]
    };
    if (query.operators && query.operators.length > 0) {
      summaryQuery.operator_name_list = query.operators;
    }
    if (query.mediaTypeFilters && query.mediaTypeFilters.length > 0) {
      const mediaIds = [];
      const digitalMedias = [];
      const classificationTypeIds = [];
      const constructionTypeIds = [];
      const mediaTypes = [];
      let digital = '';
      query.mediaTypeFilters.map((mediaType) => {
        if (mediaType.ids) {
          if (mediaType.ids.medias) {
            mediaIds.push(...mediaType['ids']['medias']);
          }

          if (
            mediaType.ids.environments &&
            mediaType.ids.environments.length > 0
          ) {
            classificationTypeIds.push(...mediaType.ids.environments);
          }
          if (
            mediaType.ids.construction &&
            mediaType.ids.construction.length > 0
          ) {
            constructionTypeIds.push(...mediaType.ids.construction);
          }

          if (
            mediaType.ids.construction &&
            mediaType.ids.construction.length > 0
          ) {
            constructionTypeIds.push(...mediaType.ids.construction);
          }

          if (mediaType.ids.mediaTypes) {
            mediaTypes.push(...mediaType['ids']['mediaTypes']);
          }
          if (mediaType.ids.material) {
            digital = mediaType.ids.material;
            digitalMedias.push(...mediaType.ids.material);
          }
        }
      });
      if (mediaIds.length > 0) {
        summaryQuery.frame_media_name_list = mediaIds.filter(
          this.getUniqueValues
        );
      }
      if (classificationTypeIds.length > 0) {
        summaryQuery.classification_type_list = classificationTypeIds.filter(
          this.getUniqueValues
        );
      }
      if (constructionTypeIds.length > 0) {
        summaryQuery.construction_type_list = constructionTypeIds.filter(
          this.getUniqueValues
        );
      }
      if (mediaTypes.length > 0) {
        summaryQuery.media_type_list = mediaTypes.filter(this.getUniqueValues);
      }
      if (
        !this.isAllMedia(query.mediaTypeFilters) &&
        !this.isMaterialMediaNotSelected(query.mediaTypeFilters)
      ) {
        if (this.isAllDigitalMedia(query.mediaTypeFilters)) {
          summaryQuery.digital = true;
        } else if (this.isAllNonDigitalMedia(query.mediaTypeFilters)) {
          summaryQuery.digital = false;
        }
      }
    }
    const measures_range_list = this.formatMeasuresRangeList(
      (query.measureRangeFilters && query.measureRangeFilters) || []
    );
    summaryQuery.measures_range_list = measures_range_list;
    return summaryQuery;
  }
  private isMaterialMediaNotSelected(mediaFilters) {
    return mediaFilters.every((media) => media?.ids?.['material'] === '');
  }
  // To check whether all selected media are both digital/non digital
  private isAllMedia(mediaFilters) {
    return mediaFilters.every((media) => media?.ids?.['material'] === 'both');
  }
  // To check whether all selected media are digital
  private isAllDigitalMedia(mediaFilters) {
    return mediaFilters.every((media) => media?.ids?.['material'] === 'true');
  }
  // To check whether all selected media are non digital
  private isAllNonDigitalMedia(mediaFilters) {
    return mediaFilters.every((media) => media?.ids?.['material'] === 'false');
  }
  /**
   * This function is to filter the unique vales in a given array
   */
  private getUniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
  };
  /* set and get the updatePlanId */
  setUpdatedMediaType(mediaData) {
    this.updatedMediaType = mediaData;
  }
  getUpdatedMediaType() {
    return this.updatedMediaType;
  }

  public getDurations(): Observable<Duration> {
    if (!this.duration$) {
      const url =
        this.config.envSettings['API_ENDPOINT_V2'] + 'workflows/durations/';
      this.duration$ = this.http
        .get<Duration>(url, {
          headers: this.reqHeaders
        })
        .pipe(
          publishReplay(1),
          refCount(),
          catchError((error) => {
            this.duration$ = null;
            return EMPTY;
          })
        );
    }
    return this.duration$;
  }
}
