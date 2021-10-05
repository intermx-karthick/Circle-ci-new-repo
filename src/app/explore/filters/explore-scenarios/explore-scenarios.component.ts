import { Component, OnInit, ViewChild, ElementRef, ViewChildren, QueryList, AfterViewInit, OnDestroy, Pipe, ChangeDetectorRef } from '@angular/core';
import { ProjectListQueryParams, WorkflowLables } from '@interTypes/workspaceV2';
import { CommonService } from '@shared/services';
import { WorkSpaceDataService } from '@shared/services/work-space-data.service';
import { takeWhile, debounceTime, distinctUntilChanged, map, take, last, switchMap, filter, tap, startWith } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { FormatService } from '@shared/services/format.service';
import { LoaderService } from '@shared/services/loader.service';
import { WorkSpaceService } from '@shared/services/work-space.service';
import { ExploreDataService } from '@shared/services/explore-data.service';
import { FiltersService } from '../filters.service';
import { ListKeyManager } from '@angular/cdk/a11y';
import { ArrowNavigationComponent } from '@shared/components/arrow-navigation/arrow-navigation.component';
import { AuthenticationService } from '@shared/services/authentication.service';
import { ThemeService } from '@shared/services/theme.service';
import { TargetAudienceService } from '@shared/services/target-audience.service';
import { combineLatest, forkJoin, Observable, Subject, Subscription } from 'rxjs';
import { InventoryService } from '@shared/services';
import { MarketTypeEnum } from './../../../Interfaces/enums/market-type';
import { Helper } from '../../../classes';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { WorkspaceV3Service } from '../../../workspace-v3/workspace-v3.service';
import { FormControl } from '@angular/forms';
import { NewConfirmationDialogComponent } from "@shared/components/new-confirmation-dialog/new-confirmation-dialog.component";
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-explore-scenarios',
  templateUrl: './explore-scenarios.component.html',
  styleUrls: ['./explore-scenarios.component.less']
})
export class ExploreScenariosComponent extends AbstractLazyLoadComponent implements OnInit, AfterViewInit, OnDestroy {

  private unSubscribe = true;
  private unSubscribeMap: Subscription;
  private routeParams: any = {};
  public packages = [];
  public scenarios: any = [];
  public appliedFilters = {};
  public currentScenario = {};
  public filteredScenarios: any = [];
  public selectedInventoryOptions = [];
  public selectedScenario = {};
  public savedAudiences = [];
  public defaultAudience = [];
  public markets = [];
  public searchQuery = '';
  @ViewChild('scenarioSearch') focusOperator: ElementRef;
  public keyboardEventsManager: ListKeyManager<any>;
  @ViewChildren(ArrowNavigationComponent) listItems: QueryList<ArrowNavigationComponent>;
  public mod_permission: any;
  public mod_project_permission: any;
  public allowInventory = '';
  public allowScenarios = '';
  public workFlowLabels: WorkflowLables;
  public clientId;
  public customInventories = false;
  userEmail: string;
  isInitialLoadCompleted: boolean = false;
  unsubscribeInitiator$ = new Subject<void>();
  // https://intermx-test.apigee.net/int/v2.1/workflows/projects?page=1&perPage=10&sortField=updatedAt&sortOrder=desc&fieldSet=_id,name,description,ownerName,ownerEmail,updatedBy,isDraft,owner,created
  public projectQueryParams: ProjectListQueryParams = {
    sortField: 'createdAt',
    sortOrder: 'asc',
    fieldSet: '_id,name'
  };
  public totalPage = 0;
  public searchScenarioQuery: FormControl;
  projects: any[];
  selectedProject;
  constructor(
    private workSpaceDataService: WorkSpaceDataService,
    private route: ActivatedRoute,
    private formatService: FormatService,
    private loaderService: LoaderService,
    private router: Router,
    private workSpaceService: WorkSpaceService,
    private exploreData: ExploreDataService,
    private filtersService: FiltersService,
    private auth: AuthenticationService,
    private targetAudienceService: TargetAudienceService,
    private commonService: CommonService,
    private theme: ThemeService,
    private inventoryService: InventoryService,
    private workspaceV3Service: WorkspaceV3Service,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog) {
    super();
    this.workFlowLabels = this.commonService.getWorkFlowLabels();
  }

  init(): void {
    this.searchScenarioQuery = new FormControl('');
    this.targetAudienceService
      .getSavedAudiences()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(response => {
        this.savedAudiences = response.audienceList || [];
      });

    this.workSpaceDataService
      .getScenarios()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(scenarios => {
        this.scenarios = scenarios;
        this.filteredScenarios = Helper.deepClone(scenarios);
        this.destroyInitiator();
        // set the selected scenario if exist filters for initial loading
        this.loadFilterFromSession();
      });

    combineLatest([
      this.workspaceV3Service.getDraftProject(),
      this.workspaceV3Service.getProjects(this.projectQueryParams).pipe(
        tap(data => {
          if (data['pagination']) {
            this.totalPage = Math.ceil(data['pagination']['total'] / 10);
          }
        }),
        map(data => data['projects']))
    ]).subscribe((results) => {
      if (results[0]) {
        this.projects = [];
        this.selectedProject = results[0]?._id;
        this.projects.push({
          '_id': results[0]?._id,
          'name': results[0]?.name,
        });
      }
      if (results[1]) {
        this.projects.push(...results[1]);
      }
      this.cdRef.detectChanges();
      if (typeof this.selectedScenario['id'] !== 'undefined' || typeof this.selectedScenario['_id'] !== 'undefined' ) {
        this.workspaceV3Service
          .getScenariobyId(this.selectedScenario['id'] ?? this.selectedScenario['_id'])
          .pipe(filter(scenario => scenario), map(scenario => scenario.scenario))
          .subscribe((scenario) => {
            this.loadScenarioByID(scenario['projectId']);
          });
      } else {
        if (results[0]?.scenarios && results[0]?.scenarios?.length > 0 && results[0]?.ownerEmail === this.userEmail) {
          results[0]?.scenarios.forEach(scenario => {
            scenario['projectId'] = results[0]?._id;
            scenario['projectName'] = results[0]?.name;
            scenario['displayName'] = scenario.name;
            this.scenarios.push(scenario);
          });
        }
        this.scenarios.sort((item1, item2) => this.formatService.sortAlphabetic(item1, item2, 'displayName'));
        this.workSpaceDataService.setScenarios(this.scenarios);
      }
      this.cdRef.detectChanges();
    });
  }
  public loadScenarioByID(value) {
    this.selectedProject = value;
    this.searchQuery = '';
    this.cdRef.detectChanges();
    this.workspaceV3Service
      .getProjectDetails(this.selectedProject)
      .subscribe((project) => {
        this.scenarios = [];
        project?.scenarios.forEach(scenario => {
          scenario['projectId'] = project?._id;
          scenario['displayName'] = scenario.name;
          this.scenarios.push(scenario);
        });
        this.scenarios.sort((item1, item2) => this.formatService.sortAlphabetic(item1, item2, 'displayName'));
        this.workSpaceDataService.setScenarios(this.scenarios);
      });
  }

  public ngOnInit() {
    const themeSettings = this.theme.getThemeSettings();
    const session = this.filtersService.getExploreSession();
    if (session && session['data'] && session['data']['scenario']) {
      this.selectedScenario = session['data']['scenario'];
    }
    this.clientId = themeSettings.clientId;
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory']['status'];
    this.mod_project_permission = this.auth.getModuleAccess('v3workspace');
    this.allowScenarios = this.mod_project_permission['status'];
    this.defaultAudience = this.route.snapshot.data.defaultAudience;
    const userData = this.auth.getUserData();
    this.userEmail = userData['email'] ? userData['email'] : '';
    // Commented to use markets list from CSV by Jagadeesh on 03-10-2019
    // this.markets = this.route.snapshot.data['markets'] || [];
    this.markets = this.route.snapshot.data['dummyMarkets'] || [];
    this.clientId = Number(themeSettings.clientId);
    this.customInventories = (
      this.mod_permission
      && this.mod_permission['features']
      && this.mod_permission['features']['customInventories']
      && this.mod_permission['features']['customInventories']['status']
      && this.mod_permission['features']['customInventories']['status'] === 'active' || false);

    // this.savedAudiences = routeData.audiences['audienceList'];

    this.listenerForInitialLoad();


    this.workSpaceDataService
      .getPackages()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(packages => {
        this.packages = packages;
      });

    this.workSpaceDataService
      .getScenarios()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(scenarios => {
        this.scenarios = Helper.deepClone(scenarios);
        this.filteredScenarios = Helper.deepClone(scenarios);
        // set the selected scenario if exist filters for initial loading
        this.loadFilterFromSession();
        this.cdRef.markForCheck();
      });
    this.workSpaceDataService
      .getPackages()
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeWhile(() => this.unSubscribe)
      )
      .subscribe(packages => {
        this.packages = packages || [];
      });
    combineLatest([
      this.route.queryParams
        .pipe(filter(params => params.scenario)),
      this.exploreData.onMapLoad()
        .pipe(filter(res => res)),
    ]).pipe(switchMap(([params, event]) => {
      return this.workspaceV3Service.getScenariobyId(params['scenario'])
        .pipe(filter(scenario => scenario),
          map(scenario => scenario.scenario));
    })).pipe(
      debounceTime(1000), // To avoid overriding bubbles count while clicking map inventory on workspace
      takeWhile(() => this.unSubscribe)
    )
      .subscribe((scenarioData) => {
        this.route.queryParams.subscribe(mapData => {
          // Checking query params for default week. If set to true will delivery week applied default value. This for convertion code
          scenarioData['defaultWeekParams'] = (mapData['defaultWeek'] === 'true');
          this.mapScenario(scenarioData);
          this.cdRef.markForCheck();
        });
      });
    this.filtersService.onReset()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(type => {
        this.selectedInventoryOptions = [];
        this.clearFilter();
      });
    this.filtersService.checkSessionDataPushed()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe(val => {
        if (val) {
          this.loadFilterFromSession();
        }
      });
    this.workSpaceDataService
      .getNewScenario()
      .pipe(takeWhile(() => this.unSubscribe))
      .subscribe((scenario) => {
        if (this.projects.filter((project) => project['_id'] === scenario['project']['_id']).length <= 0) {
          this.projects.push(scenario['project']);
          this.cdRef.detectChanges();
        }
        if (scenario['project']['_id'] === this.selectedProject) {
          const dubScenario = scenario['scenario'];
          dubScenario['displayName'] = scenario['scenario']['name'];
          this.scenarios.push(dubScenario);
          this.scenarios.sort((item1, item2) => this.formatService.sortAlphabetic(item1, item2, 'displayName'));
          this.workSpaceDataService.setScenarios(this.scenarios);
        }
      });

  }
  private loadFilterFromSession() {
    const filters = this.filtersService.getExploreSession();
    if (filters) {
      if (
        typeof filters['data'] !== 'undefined' &&
        typeof filters['data']['scenario'] !== 'undefined' &&
        filters['data']['scenario']['id']
      ) {
        const id = filters['data']['scenario']['id'];
        const scenario = this.scenarios.find(s => (s._id === id));
        this.selectedScenario = scenario;
      }
    }
  }
  public ngOnDestroy() {
    this.unSubscribe = false;
  }

  public onApply() {
    this.resetAppliedFilters();
    this.workspaceV3Service
      .getScenariobyId(this.selectedScenario['_id'])
      .pipe(map((scenario) => scenario?.scenario))
      .subscribe((scenario) => {
        /**
        * A scenario can have audience, market, inventory sets and place
        * packs, we're just sending the scenario data here. On base
        * filter and on explore component, the audience, market, place-set
        * and the inventory set will be handled respectively
        */
        /** apply audience if available */
        if (scenario['audiences'] && scenario['audiences'].length) {
          const audience = scenario['audiences'][0];
          if (audience) {
            const target = {};
            const dataVersion = audience?.measuresRelease ?? 2020;
            this.commonService.setDataVersion(dataVersion);
            this.filtersService.setFilter(
              'measuresRelease',
              dataVersion
            );
            this.filtersService.setFilterPill(
              'measuresRelease',
              `Data Source: ${dataVersion.toString()}`
            );
            target['key'] = audience['id'];
            target['details'] = {
              currentTargetId: audience['id'],
              currentTargetKey: audience['id'],
              editAudienceId: 0,
              selectedAudienceList: [],
              tabPosition: 0,
              targetAudience: {
                name: audience['name'],
                audience: audience['id']
              },
              tabType: ''
            };
            this.filtersService.setFilter('audience', target);
            this.exploreData.setSelectedTarget(audience['id']);
            this.exploreData.setSelectedTargetName(audience['Name']);
          }
        }

        /** Market filters */

        if (scenario && scenario['market'] && scenario['market'].length) {
          const selectedMarket = scenario['market'][0];
          const market = {};
          const submitedMarket = [];
          const marketTypes = ['DMA', 'CBSA', 'CNTY'];
          let marketType = 'global';
          let marketSubmitType = 'individual';

          if (selectedMarket['id'] !== 'global') {
            if (selectedMarket['marketsGroup'] && selectedMarket['marketsGroup'].length) {
              marketTypes.map(type => {
                if (selectedMarket['marketsGroup'][0]['id'].includes(type)) {
                  marketType = type;
                }
              });
              marketSubmitType = 'group';
            } else {
              marketTypes.map(type => {
                if (selectedMarket['id'].includes(type)) {
                  marketType = type;
                }
              });

            }
          } else {
            submitedMarket.push({ id: 'global', name: 'United States' });
          }

          if (marketType !== 'global') {
            scenario['market'].map(smarket => {
              if (smarket.marketsGroup && smarket.marketsGroup.length) {
                const mGroup = smarket.marketsGroup;
                if (mGroup[0]['id'].includes(marketType)) {
                  mGroup.map(typeData => {
                    const index = submitedMarket.findIndex(m => m.id === typeData.id);
                    if (index < 0 && typeData.id !== 'global') {
                      submitedMarket.push(typeData);
                    }
                  });
                }
              } else {
                const index = submitedMarket.findIndex(m => m.id === smarket.id);
                if (index < 0 && smarket.id !== 'global' && smarket['id'].includes(marketType)) {
                  submitedMarket.push(smarket);
                }
              }
            });
          }

          if (scenario['market'].length === 1 && (!scenario['market'][0]['marketsGroup'] || !scenario['market'][0]['marketsGroup'].length)) {
            marketSubmitType = 'individual';
            market['selected'] = selectedMarket['id'];
          } else if (scenario['market'][0] && scenario['market'][0]['marketsGroup']
            && scenario['market'][0]['marketsGroup'].length) {
            marketSubmitType = 'group';
            market['selected'] = 'all';
          } else if (scenario['market'] && scenario['market'].length > 1) {
            market['selected'] = 'all';
            marketSubmitType = 'individual';
            market['selected'] = 'individual_all';
          }
          market['selectedMarkets'] = submitedMarket;
          market['type'] = MarketTypeEnum[marketType.toUpperCase()];
          market['submitType'] = marketSubmitType;
          this.filtersService.setFilter('market', market);
          this.exploreData.setSelectedMarket(market);

        } else {
          this.filtersService.setFilter('market', ' ');
        }

        /** Media type filters */
        if (scenario && scenario['mediaTypeFilters'] && scenario['mediaTypeFilters']['enabled'] && scenario['mediaTypeFilters']['data'] && scenario['mediaTypeFilters']['data'].length && scenario['mediaTypeFilters']['data'][0]) {
          const dymmyMediaTypes = {
            medias: [],
            environments: [],
            construction: [],
            mediaTypes: [],
            material: [],

          }
          scenario['mediaTypeFilters']['data'].map(mediaType => {
            dymmyMediaTypes['medias'] = [...dymmyMediaTypes['medias'], ...mediaType['ids']['medias']];
            dymmyMediaTypes['environments'] = [...dymmyMediaTypes['environments'], ...mediaType['ids']['environments']];
            dymmyMediaTypes['construction'] = [...dymmyMediaTypes['construction'], ...mediaType['ids']['construction']];
            dymmyMediaTypes['mediaTypes'] = [...dymmyMediaTypes['mediaTypes'], ...mediaType['ids']['mediaTypes']];
            dymmyMediaTypes['material'].push(mediaType['ids']['material']);
          });

          /** Remove duplication from array */

          const medias = dymmyMediaTypes['medias'].filter(function (elem, index, self) {
            return index === self.indexOf(elem);
          });

          const environments = dymmyMediaTypes['environments'].filter(function (elem, index, self) {
            return index === self.indexOf(elem);
          });

          const construction = dymmyMediaTypes['construction'].filter(function (elem, index, self) {
            return index === self.indexOf(elem);
          });

          const mediaTypes = dymmyMediaTypes['mediaTypes'].filter(function (elem, index, self) {
            return index === self.indexOf(elem);
          });

          let materialtype = '';
          let meterialPills = [];
          if (dymmyMediaTypes['material'].includes('both') || (dymmyMediaTypes['material'].includes('true') && dymmyMediaTypes['material'].includes('false'))) {
            materialtype = 'both';
            meterialPills = ['Digital & Printed/Mesh'];
          } else {
            if (dymmyMediaTypes['material'].includes('true')) {
              materialtype = 'true';
              meterialPills = ['Digital'];

            } else if (dymmyMediaTypes['material'].includes('false')) {
              materialtype = 'false';
              meterialPills = ['Digital & Printed/Mesh'];
            }
          }

          const submitMediaType = {
            ids: {
              medias: medias,
              environments: environments,
              construction: construction,
              mediaTypes: mediaTypes,
              placeType: [],
              placementType: [],
              material: materialtype
            },
            pills: {
              medias: medias,
              classification: environments,
              construction: construction,
              mediaTypes: mediaTypes,
              place_type_name_list: [],
              placement_type_name_list: [],
              material: meterialPills
            },
            selection: {
              classification: environments.length && true || false,
              construction: construction.length && true || false,
              mediaTypes: mediaTypes.length && true || false,
              medias: medias.length && true || false,
              material: materialtype !== '' && true || false,
              placementType: false,
              placeType: false
            }
          };
          this.filtersService.setFilter('mediaTypeList', Helper.deepClone(submitMediaType));
        } else {
          this.filtersService.clearFilter('mediaTypeList', true);
        }

        /** Apply operator filters */
        if (scenario && scenario['operators'] && scenario['operators']['enabled'] && scenario['operators']['data'].length && scenario['operators']['data'][0] !== 'all') {
          this.filtersService.setFilter('operatorList', Helper.deepClone(scenario['operators']['data']));
        } else {
          this.filtersService.clearFilter('operatorList', true);
        }

        /** Apply measureRangeFilters filters */
        if (scenario && scenario['measureRangeFilters'] && scenario['measureRangeFilters']['enabled'] && scenario['measureRangeFilters']['data'].length) {

          const threshols = {
            inMarketCompPer: [0, 100],
            targetCompPer: [0, 100],
            inMarketCompIndex: [10, 210],
            targetImp: [0, 150000]
          };
          scenario['measureRangeFilters']['data'].map(threshold => {
            if (threshold['type'] === 'index_comp_target') {
              threshols['inMarketCompIndex'][0] = threshold['min'];
              threshols['inMarketCompIndex'][1] = threshold['max'];
            }
            if (threshold['type'] === 'imp_target') {
              threshols['targetImp'][0] = threshold['min'];
              threshols['targetImp'][1] = threshold['max'];
            }
          });

          this.filtersService.setFilter('thresholds', Helper.deepClone(threshols));
        } else {
          this.filtersService.clearFilter('thresholds', true);
        }

        /** Media Attributes filters */

        if (scenario && scenario['mediaAttributes'] && scenario['mediaAttributes']['enabled'] && Object.keys(scenario['mediaAttributes']['data']).length) {
          const formatMediaAttribute = this.formatMediaAttribute(scenario['mediaAttributes']['data']);
          if (formatMediaAttribute?.['spotLength']) {
            const mediaAttributeFormat = {
              min: formatMediaAttribute?.['spotLength'][0] ?? null,
              max: formatMediaAttribute?.['spotLength'][1] ?? null,
            }
            formatMediaAttribute['spotLength'] = mediaAttributeFormat;
          }
          this.filtersService.setFilter('mediaAttributes', formatMediaAttribute);
        } else {
          this.filtersService.clearFilter('mediaAttributes', true);
        }

        /** Added Location filters */
        if (scenario && scenario['locationFilters'] && scenario['locationFilters']['enabled'] && scenario['locationFilters']['data'].length) {
          const selectedGeoLocation = [];
          scenario['locationFilters']['data'].map(location => {
            const lData = {
              label: location['type'] + ': ' + location['label'],
              data: location
            };
            selectedGeoLocation.push(lData);
          });
          this.filtersService.setFilter('location', { type: 'geography', selectedGeoLocation: selectedGeoLocation });
        } else {
          this.filtersService.setFilter('location', { type: 'geography', selectedGeoLocation: [] });
          this.filtersService.clearFilter('location', true);
        }

        if ((scenario && scenario['delivery_period_weeks']) && !scenario['defaultWeekParams']) {
          const weeks = Number(scenario['delivery_period_weeks'] * 7);
          this.filtersService.setFilter('period_days', weeks);
        }
        this.appliedFilters['selected'] = 'scenarioPanel';
        this.appliedFilters['filterType'] = 'scenario';
        if (scenario['scenarioInventorySetId']) {
          this.getPackagesData(scenario);
        } else {
          this.appliedFilters['data'] = {
            id: scenario['_id'],
            displayName: this.getDisplayName(scenario),
            ids: scenario['inventory'] || []
          };
          this.submitFilters();
        }
      });
  }

  private formatMediaAttribute(media) {
    const mediaAttribute = {};
    if (media) {
      if (media['orientation']) {
        mediaAttribute['orientationList'] = {
          min: media['orientation']['min'],
          max: media['orientation']['max']
        };
      }

      if (media['illumination_start_time'] && media['illumination_end_time']) {
        mediaAttribute['illuminationHrsRange'] = [media['illumination_start_time'], media['illumination_end_time']];
      }
      if (media['frame_width']) {
        mediaAttribute['panelSizeWidthRange'] = [media['frame_width']['min'], media['frame_width']['max']];
      }
      if (media['frame_height']) {
        mediaAttribute['panelSizeHeightRange'] = [media['frame_height']['min'], media['frame_height']['max']];
      }

      if (media['spot_length']) {
        mediaAttribute['spotLength'] = [media['spot_length']['min'], media['spot_length']['max']];
      }

      if (media['rotating'] || media['rotating'] === false) {
        mediaAttribute['rotating'] = media['rotating'];
        mediaAttribute['movementList'] = media['rotating'];
      }
      if (media['status_type_name_list']) {
        mediaAttribute['auditStatusList'] = media['status_type_name_list'];
      }
    }
    return mediaAttribute;
  }

  /**
   * Sometimes selected scenario does not containing displayName while loading.
   * To fix this method will help
   */
  private getDisplayName(selectedScenario) {
    if (selectedScenario['displayName']) {
      return selectedScenario['displayName'];
    } else {
      const filteredScenario = this.scenarios.filter(scenario => scenario['_id'] === selectedScenario['_id'])[0];
      if (filteredScenario && filteredScenario['displayName']) {
        return filteredScenario['displayName'];
      }
    }
  }

  async getPackagesData(scenario) {
    if (scenario['scenarioInventorySetId']) {
      await this.workSpaceService.getExplorePackagesById(false, scenario['scenarioInventorySetId']).subscribe(dataById => {
        this.selectedPackageInv([dataById['packages']], scenario).then(data => {
          this.appliedFilters['data'] = {
            id: scenario['_id'],
            displayName: this.getDisplayName(scenario),
            ids: scenario['inventory'] || []
          };
          this.submitFilters();
          return true;
        });
      });
    } else {
      await this.workSpaceService.getExplorePackages()
        .pipe(
          takeWhile(() => this.unSubscribe),
          filter(inventory => inventory && inventory['packages']))
        .subscribe(inventory => {
          this.packages = inventory['packages'] && inventory['packages'];
          this.selectedPackageInv(this.packages, scenario).then(data => {
            this.appliedFilters['data'] = {
              id: scenario['_id'],
              projectId: this.selectedProject,
              displayName: this.getDisplayName(scenario),
              ids: scenario['inventory'] || []
            };
            this.submitFilters();
          });
          return true;
        });
    }
  }

  async selectedPackageInv(inventorySets, scenario) {
    // scenario may contain multiple inventory sets
    const packs = inventorySets.filter(packageSet => scenario['scenarioInventorySetId'].indexOf(packageSet._id) !== -1);
    if (packs.length > 0) {
      this.selectedInventoryOptions = packs;
      // getting just the geoPanel Ids we need from inventory set
      scenario['inventory'] = {};
      this.selectedInventoryOptions.map(item => {
        /**
        * For each inventory we only need the geopanel ID, so we're
        * using a function to extract the ID as an array and we are
        * spreading it using the ... spread operator. Finally the
        * resulting array this.appliedFilters['data'] will be an array
        * of geopanel IDs from selected inventory sets
        */
        if (item) {
          /*
            Here gp_ids and custom_ids is dummy array to maintain
            Geopath panel ids and custom db panel ids to decide which ids have to passed
            which APIs (Geopath or Elastic)
          */
          const gp_ids = [];
          const custom_ids = [];
          item.inventory.map(inventory => {
            if (inventory['type'] === 'geopathPanel') {
              gp_ids.push(inventory['id']);
            } else {
              custom_ids.push(inventory['id']);
            }
          });
          if (!scenario['inventory']['gp_ids']) {
            scenario['inventory']['gp_ids'] = [];
          }
          scenario['inventory']['gp_ids'].push(...gp_ids);
          /* If the customInventories is not active and clientId is not matched we shouldn't load that panel ids */
          if (this.customInventories
            && item.client_id !== null
            && Number(item.client_id) === Number(this.clientId)) {
            if (!scenario['inventory']['custom_ids']) {
              scenario['inventory']['custom_ids'] = [];
            }
            scenario['inventory']['custom_ids'].push(...custom_ids);
          }
          // this.selectedScenario['inventory'].push(...Array.from(item.inventory, inventory => inventory['id']));
        }
      });
    }
  }

  private submitFilters() {
    if (this.selectedScenario['_id']) {
      this.filtersService.setFilter(this.appliedFilters['filterType'], this.appliedFilters['data']);
      this.cdRef.markForCheck();
    } else {
      this.clearFilter();
    }
  }

  private resetAppliedFilters() {
    this.appliedFilters = {
      data: [],
      selected: null,
      filterType: '',
    };
  }

  public filterScenarios(data) {
    if (data.emptySearch) {
      this.filteredScenarios = this.scenarios;
    } else {
      this.filteredScenarios = data.value;
    }
  }

  public clearFilter() {
    const filters = this.filtersService.getExploreSession();
    const selected = this.selectedScenario;
    if (
      Object.keys(selected).length > 0 && filters &&
      typeof filters['data'] !== 'undefined' &&
      typeof filters['data']['scenario'] !== 'undefined'
    ) {
      if (filters['data']['audience'] &&
        filters['data']['audience']['details'] && filters['data']['audience']['details']['currentTargetId']) {
        if (filters['data']['audience']['details']['currentTargetId'] === selected['audiences'][0]['id']) {
          this.filtersService.clearFilter('audience');
          this.exploreData.setSelectedTarget(this.defaultAudience['audienceKey']);
          this.exploreData.setSelectedTargetName(this.defaultAudience['description']);
        }
      }
      /** To clear the market if selected scenario have market */
      if (filters['data']['market'] && selected['market'].length) {
        this.filtersService.clearFilter('market');
        this.exploreData.setSelectedMarket({});
        /* if ( (selected && !selected['market'][0]['marketsGroup'].length) &&
         (filters['data']['market']['selected'] === selected['market'][0]['id'])) {
            this.filtersService.clearFilter('market');
            this.exploreData.setSelectedMarket({});
         } else {
           if (filters['data']['market']['selected'] === selected['market'][0]['marketsGroup'][0]['id']) {
            this.filtersService.clearFilter('market');
            this.exploreData.setSelectedMarket({});
           }
         }*/
      }
      if (selected['operators']['enabled'] && filters['data']['operatorList']) {
        this.filtersService.clearFilter('operatorList', true);
      }

      if (selected['mediaTypeFilters']['enabled'] && filters['data']['mediaTypeList']) {
        this.filtersService.clearFilter('mediaTypeList', true);
      }

      if (selected['measureRangeFilters']['enabled'] && filters['data']['thresholds']) {
        this.filtersService.clearFilter('thresholds', true);
      }

      if (selected['mediaAttributes']['enabled'] && filters['data']['mediaAttributes']) {
        this.filtersService.clearFilter('mediaAttributes', true);
      }

      if (selected['delivery_period_weeks'] && filters['data']['period_days']) {
        this.filtersService.clearFilter('period_days', true);
      }
    }
    this.currentScenario = {};
    this.selectedScenario = {};
    this.filtersService.clearFilter('scenario', true);
    this.searchQuery = '';
    this.filteredScenarios = this.scenarios;
    this.resetAppliedFilters();
    this.cdRef.markForCheck();
  }

  public editScenario(scenario) {
    this.router.navigateByUrl(
      `/workspace-v3/scenario/${scenario._id}?projectId=${this.selectedProject}`
    );
  }

  public deleteScenario(scenario) {
    const dialogueData = {
      title: 'Confirmation',
      description: `Are you sure you want to delete the ${this.workFlowLabels.scenario[0]} "${scenario.name}"?`,
      confirmBtnText: 'YES, DELETE',
      cancelBtnText: 'Cancel',
      displayCancelBtn: true
    };
    this.dialog.open(NewConfirmationDialogComponent, {
      data: dialogueData,
      width: '340px',
      height: '260px',
      panelClass: 'imx-mat-dialog'
    }).afterClosed().pipe(
      takeWhile(() => this.unSubscribe),
      map(res => res['action'])
    ).subscribe(flag => {
      if (flag !== undefined && flag) {
        this.workspaceV3Service
          .deleteScenarios(scenario._id)
          .subscribe((success) => {
            const updated = this.scenarios.filter(item => {
              return item._id !== scenario._id;
            });
            this.scenarios = updated;
            this.filteredScenarios = updated;
            this.cdRef.detectChanges();
            this.clearFilter();
          });
      }
    });
  }

  private mapScenario(scenario): void {
    this.currentScenario = scenario;
    this.selectedScenario = scenario;
    this.filtersService.isSessionFilter = false;
    this.onApply();
  }
  public onRadioBtnChange(scenario) {
    this.selectedScenario = scenario;
  }
  public setSelectedScenario(selected) {
    if (typeof selected['_id'] !== 'undefined') {
      this.selectedScenario = selected;
    } else {
      this.selectedScenario = this.currentScenario;
    }
  }
  getMarket(id) {
    const market = this.markets.find(m => m.id === id);
    return market;
  }
  async getMarkets(markets, marketType) {
    const temp: any = [];
    let dummyMarkets: any = this.markets;
    const ids = markets.map(m => m.id);
    if (marketType === 'CBSA') {
      dummyMarkets = await this.inventoryService.getMarketsCBSAFromFile().toPromise();
    } else if (marketType === 'County') {
      dummyMarkets = await this.inventoryService.getDataFromFile('counties').toPromise();
    }
    await dummyMarkets.map(market => {
      if (ids.indexOf(market.id) > -1) {
        temp.push(market);
      }
    });
    return temp;
  }

  public ngAfterViewInit() {
    if (this.listItems['_results']) {
      this.keyboardEventsManager = new ListKeyManager<any>(this.listItems).withWrap().withTypeAhead();
    }
  }
}
