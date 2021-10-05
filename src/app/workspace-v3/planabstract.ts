import { WorkspaceV3Service } from './workspace-v3.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { DuplicateScenarioV3Component } from './duplicate-scenario-v3/duplicate-scenario-v3.component';
import { ConfirmationDialog, Market, MarketPlan, Plan, Query } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { Helper } from 'app/classes';
import { GenerateScenarioDuplicatePopupComponent } from './generate-scenario-duplicate-popup/generate-scenario-duplicate-popup.component';
import {  ScenarioPlanLabels } from '@interTypes/enums';
import { ThemeService } from '@shared/services';
import { Observable, of } from 'rxjs';
import { MarketPlanService } from './market-plan.service';
import { Filter } from '@interTypes/filter';
import { NewConfirmationDialogComponent } from '@shared/components/new-confirmation-dialog/new-confirmation-dialog.component';
export class PlanAbstract {
  public labels = this.workspaceService.workSpaceLabels;
  themeSettings: any;
  clientDataId: any;
  pageType: any;
  static getSnackBarConfig(): MatSnackBarConfig {
    return {
      duration: 5000
    };
  }
  constructor(
    public workspaceService: WorkspaceV3Service,
    public matDialog: MatDialog,
    public router: Router,
    public snackBar: MatSnackBar,
    public themeService: ThemeService,
    public marketPlanService: MarketPlanService
  ) {
    this.themeSettings = this.themeService.getThemeSettings();
    this.clientDataId = this.themeSettings.clientId;
  }

  /**
   * This function used to create a duplicate plan
   * @param plan Set the scenario plan data
   */
  public createDuplicatePlan(plan) {
    this.matDialog
      .open(DuplicateScenarioV3Component, {
        panelClass: 'imx-mat-dialog',
        width: '500px',
        data: {
          scenario: plan
        }
      })
      .afterClosed()
      .pipe(filter((data) => data?.response?.data?.id))
      .subscribe((data) => {
        const url = `/workspace-v3/scenario/${data['response']['data']['id']['scenario']}?projectId=${data['response']['data']['id']['project']}`;
        this.router.navigateByUrl(url);
      });
  }

  /**
   * This functioin used to create a delete the selected plan
   * @param plan set the create plan data
   */

  public deletePlan(
    plan,
    project = '',
    moveScenarioList = false,
    callback = () => {}
  ) {
    this.matDialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(
        filter((result) => result && result.action),
        switchMap((response) =>
          this.workspaceService.deleteScenarios(plan['_id'])
        )
      )
      .subscribe(
        (response) => {
          this.snackBar.open(`${this.labels.scenario[0]} deleted successfully`, 'DISMISS', {
            duration: 2000
          });
          if (callback) {
            callback();
          }
          if (moveScenarioList && project) {
            let url = 'workspace-v3/projects/list';
              if(!project['isDraft']) {
                url = `workspace-v3/projects/${project['_id']}`
              }
              this.router.navigateByUrl(url);
          }
        },
        (error) => {
          const message =
            error?.error?.message ||
            `Something went wrong, ${this.labels.scenario[0]} is not deleted.`;
          this.snackBar.open(message, 'DISMISS', {
            duration: 2000
          });
        }
      );
  }


  generatePlanViceVersa(scenario, type, project) {
    let url;
    if (type === ScenarioPlanLabels.MARKET_PLAN) {
      this.workspaceService
        .getScenarioMediaTypes(scenario['_id'])
        .pipe(map((mediaType) => mediaType['mediaTypeFilters']))
        .subscribe((mediaTypes) => {
          const mediaTypeFilters = {
            enabled: true,
            data: mediaTypes
          }
          if (
            scenario?.audiences?.length > 0 &&
            scenario?.market?.length > 0 &&
            mediaTypeFilters?.data?.length > 0 &&
            scenario?.delivery_period_weeks
          ) {
            scenario['mediaTypeFilters'] = mediaTypeFilters;
            if (scenario?.delivery_period_weeks !== null && (scenario.audiences.filter((aud) => aud.measuresRelease === 2020).length > 0 && scenario.audiences.filter((aud) => aud.measuresRelease === 2021).length > 0) && (scenario?.delivery_period_weeks === 26 || scenario?.delivery_period_weeks === 52)) {
              this.getInformationPopupState().subscribe((flag) => {
                if (flag !== undefined && !flag) {
                  this.createAndGeneratePlanViceVersa(scenario, type, project);
                } else {
                  url = `/workspace-v3/plan/create?projectId=${project['_id']}&scenarioId=${scenario?._id}`;
                  this.router.navigateByUrl(url);
                }
              });
            } else {
              this.createAndGeneratePlanViceVersa(scenario, type, project);
            }
          } else {
            url = `/workspace-v3/plan/create?projectId=${project['_id']}&scenarioId=${scenario?._id}`;
            this.router.navigateByUrl(url);
          }
        });
    } else {
      if (scenario?.audiences?.length > 0 && scenario?.market?.length > 0) {
        if (scenario?.delivery_period_weeks !== null && (scenario.audiences.filter((aud) => aud.measuresRelease === 2020).length > 0 && scenario.audiences.filter((aud) => aud.measuresRelease === 2021).length > 0) && (scenario?.delivery_period_weeks === 26 || scenario?.delivery_period_weeks === 52)) {
          this.getInformationPopupState().subscribe((flag) => {
            if (flag !== undefined && !flag) {
              this.createAndGeneratePlanViceVersa(scenario, type, project);
            } else {
              url = `/workspace-v3/plan/create?projectId=${project['_id']}&planType=inventory`;
              this.router.navigateByUrl(url);
            }
          });
        } else {
          this.createAndGeneratePlanViceVersa(scenario, type, project);
        }
        
      } else {
        url = `/workspace-v3/plan/create?projectId=${project['_id']}&planType=inventory`;
        this.router.navigateByUrl(url);
      }
    }
  }
  getInformationPopupState(): Observable<any> {
      const dialogueData = {
        title: 'Confirmation',
        description: 'Measurement with conflicting Plan Period could be erroneous, verify before Progressing.',
        confirmBtnText: 'OK',
        cancelBtnText: 'SKIP & CONTINUE'
      };
      return this.matDialog.open(NewConfirmationDialogComponent, {
        data: dialogueData,
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      }).afterClosed()
        .pipe(
            map(res => res?.action)
        );
  }

  public createAndGeneratePlanViceVersa(scenarioObj, type, project) {
    const scenario = Helper.deepClone(scenarioObj);
    // const scenario = {};
    scenario['plan_period_type'] = 'generic';
    delete scenario['_id'];
    delete scenario['updatedAt'];
    delete scenario['createdAt'];
    delete scenario['when'];
    delete scenario['actual'];
    delete scenario['audience'];
    delete scenario['budget'];
    delete scenario['filterInventoryByMarket'];
    delete scenario['geography'];
    delete scenario['goals'];
    delete scenario['labels'];
    delete scenario['locationFilters'];
    delete scenario['markets'];
    // delete scenario['measureRangeFilters'];
    // delete scenario['mediaAttributes'];
    // delete scenario['operators'];
    delete scenario['package'];
    delete scenario['places'];
    delete scenario['planned'];
    delete scenario['scenarioInventorySetId'];
    delete scenario['spotCount'];
    delete scenario['job'];
    if (scenario?.attachments?.length === 0) {
      delete scenario['attachments'];
    }
    if (scenario?.marketPlans?.plans?.length === 0) {
      delete scenario['marketPlans'];
    }
    if (type === ScenarioPlanLabels.MARKET_PLAN) {
      delete scenario['addInventoryFromFilter'];
      delete scenario['includeOutsideMarketInvs'];
    } else {
      delete scenario['marketPlans'];
    }
    const inventoryPackageData = {
      name: '',
      name_key: '',
      description: '',
      client_id: this.clientDataId,
      isScenarioInventorySet: true
    };

    if (type === ScenarioPlanLabels.MARKET_PLAN) {
      scenario['delivery_period_weeks'] = Number(
        scenarioObj['delivery_period_weeks']
      );
      scenario['spot_schedule'] = null;
    } else {
      if (scenarioObj & scenarioObj.spot_schedule) {
        scenario['spot_schedule'] = scenarioObj.spot_schedule;
      } else {
        scenario['delivery_period_weeks'] =
          scenarioObj['delivery_period_weeks'];
      }
      scenario['addInventoryFromFilter'] = true;
    }
    scenario['type'] = type;
    this.workspaceService
      .createScenario(project['_id'], scenario)
      .pipe(
        switchMap((scenarioResponse) => {
          if (scenarioResponse['status'] === 'success') {
            scenario['name'] = scenarioResponse['data']['name'];
            inventoryPackageData['name'] =
              scenarioResponse['data']['name'] + Date.now();
            return this.workspaceService
              .saveInventoryPackage(
                inventoryPackageData,
                scenarioObj.inventoryIDs
              )
              .pipe(
                switchMap((packageResponse) => {
                  if (packageResponse['status'] === 'success') {
                    scenario['scenarioInventorySetId'] =
                      packageResponse['data']['id'];
                    const updateScenario = {
                      scenario: scenario
                    };
                    return this.workspaceService
                      .updateScenario(
                        updateScenario,
                        scenarioResponse['data']['id']['scenario']
                      )
                      .pipe(
                        switchMap((response) => {
                          if (response['status'] === 'success') {
                            // Checking the plan type and performing corresponding actions
                            const config = PlanAbstract.getSnackBarConfig();
                            this.snackBar.open(
                              scenarioResponse.message,
                              'DISMISS',
                              {
                                ...config
                              }
                            );
                            if (type === ScenarioPlanLabels.MARKET_PLAN) {
                              const marketPlanData = this.onGeneratePlanData(
                                scenarioObj
                              );
                              return this.workspaceService
                                .generatePlans(
                                  scenarioResponse['data']['id']['scenario'],
                                  marketPlanData
                                )
                                .pipe(
                                  switchMap((mrketPlanResponse) =>
                                    of(scenarioResponse)
                                  ),
                                  catchError((error) => {
                                    return of(scenarioResponse);
                                  })
                                );
                            } else {
                              return this.workspaceService
                                .generateInventoryPlan(
                                  scenarioResponse['data']['id']['scenario']
                                )
                                .pipe(
                                  switchMap((invPlanResponse) => {
                                    if (
                                      invPlanResponse['status'] === 'success'
                                    ) {
                                      this.snackBar.open(
                                        'Plan is being generated. We shall notify you soon.',
                                        'DISMISS',
                                        {
                                          ...config
                                        }
                                      );
                                    }
                                    return of(scenarioResponse);
                                  }),
                                  catchError((error) => {
                                    return of(scenarioResponse);
                                  })
                                );
                            }
                          } else {
                            of(response);
                          }
                        })
                      );
                  } else {
                    return of(packageResponse);
                  }
                })
              );
          } else {
            return of(scenarioResponse);
          }
        })
      )
      .subscribe(
        (response) => {
          if (type === ScenarioPlanLabels.MARKET_PLAN) {
            const url = `/workspace-v3/scenario/${response['data']['id']['scenario']}?projectId=${response['data']['id']['project']}&planType=${type}`;
            this.router.navigateByUrl(url);
          } else if (response.status === 'success') {
            if (this.pageType === 'scenarioView') {
              let url = '';
              if (project['isDraft']) {
                url = `/workspace-v3/projects/list?type=sandbox`;
              } else {
                url = `/workspace-v3/projects/${project['_id']}`;
              }
              this.router.navigateByUrl(url);
            } else {
             
              this.getProjects();
            }
          }
        },
        (error) => {
          if (error?.error?.code === 7087) {
            this.matDialog
              .open(GenerateScenarioDuplicatePopupComponent, {
                panelClass: 'imx-mat-dialog',
                width: '500px',
                data: {
                  type: type
                }
              })
              .afterClosed()
              .subscribe((data) => {
                if (data?.name) {
                  const scenarioData = Helper.deepClone(scenarioObj);
                  scenarioData['name'] = data.name;
                  this.createAndGeneratePlanViceVersa(
                    scenarioData,
                    scenario['type'],
                    project
                  );
                }
              });
          } else {
            const config = PlanAbstract.getSnackBarConfig();
            this.snackBar.open('Something went wrong', 'DISMISS', {
              ...config
            });
          }
        }
      );
  }
  onGeneratePlanData(scenarioObj) {
    const goals = {
      trp: 200,
      reach: null,
      frequency: 0,
      imp: null,
      type: 'trp',
      duration: scenarioObj.delivery_period_weeks ? scenarioObj.delivery_period_weeks : 1,
      effectiveReach: 1,
      allocationMethod: 'equal'
    };
    const plans: Plan[] = [];
    scenarioObj.audiences.forEach((audience: Filter) => {
      scenarioObj.market.forEach((market: Market) => {
        const marketData: Market = {
          id: market.id,
          name: market.name,
          marketsGroup: market['marketsGroup'] || []
        };
        const query: Query = {
          audience: audience,
          market: marketData,
          operators: scenarioObj?.operators?.data,
          goals: goals,
          mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
            scenarioObj?.mediaTypeFilters?.data
          ),
          measureRangeFilters: scenarioObj?.measureRangeFilters?.data,
          mediaAttributes: scenarioObj?.mediaTypeFilters?.data,
          locationFilters: scenarioObj?.locationFilters?.data
        };
        if (query.operators && query.operators.length === 0) {
          delete query['operators'];
        }
        plans.push({
          query: query
        });
      });
    });
    const markets = scenarioObj.market.map((i) => {
      return {
        id: i.id,
        name: i.name,
        marketsGroup: i['marketsGroup'] || []
      };
    });
    const marketPlan: MarketPlan = {
      targets: {
        audiences: scenarioObj.audiences,
        markets: markets,
        goals: goals,
        mediaTypeFilters: this.marketPlanService.cleanMediaTypeData(
          scenarioObj?.mediaTypeFilters?.data
        ),
        operators: scenarioObj?.operators?.data,
        measureRangeFilters: scenarioObj?.measureRangeFilters?.data,
        locationFilters: scenarioObj?.locationFilters?.data
      },
      plans: plans
    };
    if (
      marketPlan.targets.operators &&
      marketPlan.targets.operators.length === 0
    ) {
      delete marketPlan.targets.operators;
    }
    return marketPlan;
  }
  getProjects() {}
}
