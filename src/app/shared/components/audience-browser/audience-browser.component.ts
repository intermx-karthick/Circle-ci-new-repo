import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, forkJoin, Observable, of, Subject } from 'rxjs';
import swal from 'sweetalert2';
import {
  FormatService,
  AuthenticationService,
  CommonService,
  ExploreDataService,
  TargetAudienceService,
  ThemeService
} from '@shared/services';
import { MatDialog } from '@angular/material/dialog';
import { FiltersService } from '../../../explore/filters/filters.service';
import { AudienceTitleDialogComponent } from '@shared/components/audience-title-dialog/audience-title-dialog.component';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  tap,
  takeUntil,
  finalize,
  catchError,
  switchMap
} from 'rxjs/operators';
import { Helper } from '../../../classes';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { PopulationService } from 'app/population/population.service';
import { TooltipPanelData } from '@shared/tooltip-panel/tooltip-panel.model';

/**
 * @deprecated This component is deprecated and will be removed. Any new implementation should not be based on this component.
 * This is deprecated because of new design.
 */
@Component({
  selector: 'app-audience-browser',
  templateUrl: './audience-browser.component.html',
  styleUrls: ['./audience-browser.component.less'],
  providers: [PopulationService]
})
export class AudienceBrowserComponent extends AbstractLazyLoadComponent
  implements OnInit, OnChanges, OnDestroy {
  behaviorOption: any = {};
  public audienceLicense = {};
  public audiences: any = [];
  public segments: any = [];
  public subchilds: any = [];
  public finalTargetAudience: any = {};
  public step = null;
  public audienceLoader = false;
  public savedAudience: any = [];
  public savedAudience$: Observable<any> = null;
  public savedAudienceFilter$: Observable<any> = null;
  public filteredSavedAudience$: Subject<any> = new Subject();
  public searchSavedQuery: FormControl;
  @ViewChild('fName') focusNameRef: ElementRef;
  public currentAudienceId = null;
  public selectedTarget: any = {};
  public flattenedSelect: any = [];
  public flattenedAudienceKeys: any = [];
  public selectedAudience: any = [];
  public selectedAudienceTab = 0;
  public searchQuery = null;
  public filtered: any = [];
  public isEditAudienceName = false;
  public isEditBehaviorName = false;
  // public audienceForm :any;
  public audienceTitle = '';
  public audienceTitleName = '';
  public nameUniqueError = false;
  public isSmallScreen = false;
  public selectedTabAudienceList: any = [];
  private defaultAudience: any = {};
  @Input() selectedAudienceList: any = [];
  @Input() isScenario = false;
  @Input() isInventory = false;
  @Input() openAudience = false;
  @Input() selectionType = 'single';
  @Input() includeType;
  @Output() onCompletedBrowsing: EventEmitter<any> = new EventEmitter();
  private mod_permission: any;
  public allowInventory = '';
  private audienceAPILoadedFlag = false;
  private themeSettings: any;
  private unSubscribe = new Subject();
  public selectedTargets: any = [];
  public gettingDataFromAPI = false;
  public audienceLoadedIndex = 0;
  isInitialLoadCompleted = false;
  unsubscribeInitiator$: Subject<void> = new Subject();
  dataVersion: any = 2020;
  public isDataLoading = false;
  timeoutId: any;
  audienceAPICalls : any = null;
  tooltipPanelData: Record<string, TooltipPanelData> = {
    'Population Facts': {
      content: `PopFacts® includes all populations, including those in institutional and non-institutional <b>group quarters</b>
        (e.g. college/university student housing, nursing homes, military quarters, juvenile facilities, correctional facilities, etc.).
        When a user is looking for a target demographic of the population, they should use the Population section of the Insights Suite as <b>group quarters</b> are not included.`,
      url: 'https://support.geopath.io/hc/en-us/articles/4403704518669-PopFacts-'
    },
    'PRIZM Premier': {
      content: 'Please note that the Consumer Profiles and PRIZM Premier Segments use the PopFacts 0+ audience as the base, which includes those who live in group quarters.'
    },
    'Consumer Profiles': {
      content: 'Please note that the Consumer Profiles and PRIZM Premier Segments use the PopFacts 0+ audience as the base, which includes those who live in group quarters.'
    }
  };

  public constructor(
    private targetAudienceService: TargetAudienceService,
    private formatService: FormatService,
    private exploreData: ExploreDataService,
    private auth: AuthenticationService,
    private commonService: CommonService,
    private filtersService: FiltersService,
    private dialog: MatDialog,
    private theme: ThemeService,
    private populationService: PopulationService,
  ) {
    super();

    this.searchSavedQuery = new FormControl('');
    this.savedAudienceFilter$ = this.searchSavedQuery.valueChanges.pipe(
      debounceTime(300),
      startWith('')
    );
  }

  init() {
    if (this.includeType === 'explore') {
      const preferences = this.commonService.getUserPreferences();
      this.dataVersion = preferences?.measures_release ?? 2021;
      this.commonService.onDataVersionChange().subscribe((data) => {
        this.dataVersion = data;
        this.getAudiences();
      });
      const sessionFilter = this.targetAudienceService.getExploreSession();
      this.targetAudienceService
        .getDefaultAudience(false, this.dataVersion.toString())
        .subscribe((audience) => (this.defaultAudience = audience));
        this.getAudiences();
    } else {
      this.dataVersion = 2020;
      this.getAudiences();
    }

    this.filtersService
      .getFilters()
      .pipe(
        takeUntil(this.unSubscribe),
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe((data) => {
        this.setAudienceFromSession();
      });
  }
  getAudiences() {
    const sessionFilter = this.targetAudienceService.getExploreSession();
    this.targetAudienceService
      .getAudienceWithYear(this.dataVersion ,{}, true)
      .subscribe((result) => {
        this.selectedAudienceTab = 0;
        // const result = results[0];
        if (
          this.mod_permission?.features?.orderInventories?.status !== 'active'
        ) {
          this.audiences = this.getFormattedAudienceData(
            result['catalog']
          ).filter((audience) => audience.label.toLowerCase() !== 'ads');
        } else {
          this.audiences = this.getFormattedAudienceData(result['catalog']);
        }
        // Filtering to display only the module access allowed data.
        const allowedAudiences = this.mod_permission.features.gpAudience.tabs;
        this.audiences = this.audiences.filter((element) => allowedAudiences.includes(element.label));
        // Opening audience by default if user clicked on see audience in home screen.
        // TODO: See if we can convert this into an URL based action instead of local storage.
        setTimeout(() => {
          const defaultAudienceTab = this.filtersService.getExploreSession();
          if ((defaultAudienceTab &&
            defaultAudienceTab['clickAudience'] &&
            defaultAudienceTab['clickAudience'] === true) ||
            localStorage.getItem('clickAudience') === 'true') {
            this.selectedAudienceTab = 1;
            defaultAudienceTab['clickAudience'] = false;
            localStorage.removeItem('clickAudience');
            this.filtersService.saveExploreSession(defaultAudienceTab);
          }
        }, 200);

        this.selectedAudienceTab =
          sessionFilter != null &&
          typeof sessionFilter.audienceTabPosition !== 'undefined'
            ? sessionFilter.audienceTabPosition
            : 0;
        if (this.selectedAudienceTab === 0) {
          this.loadSavedAudiences(false);
        }

        this.setAudienceFromSession();
        if (this.selectedAudienceList && this.selectedAudienceList.length > 0) {
          const data = this.selectedAudienceList
            .map((option) => option.tag)
            .join();
          const currenttab = this.getCurrentTabData();
          if (
            typeof currenttab['tabType'] !== 'undefined' &&
            currenttab['tabType'] === 'single'
          ) {
            this.onFlatOptionChange(this.selectedAudienceList[0]);
          } else {
            this.targetAudienceService
              .getAudienceWithYear(this.dataVersion, { tags: data }, true)
              .subscribe(
                (resultData) => {
                  this.updateDataCurrentTab(resultData);
                },
                (error) => {
                  swal(
                    'Warning',
                    'Some error occurred. Please try again',
                    'warning'
                  );
                }
              );
          }
        }
      });
  }

  public ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']['gpInventory'][
      'status'
    ];
    this.commonService
      .getMobileBreakPoint()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((isMobile) => {
        this.isSmallScreen = isMobile;
      });
    this.subchilds = [{ name: 'Upper Crusts' }, { name: 'Movers and Shakers' }];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    // const sessionFilter = this.targetAudienceService.getExploreSession();
    this.listenerForInitialLoad();
    this.filtersService
      .onReset()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((type) => {
        if (type !== 'FilterInventory') {
          this.clearAll('clear');
        }
      });
    this.populationService.onReset()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(type => {
        if (type === 'All') {
          this.clearAll('clear');
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.openAudience && changes.openAudience.currentValue) {
      setTimeout(() => {
        this.tabSwitch({ index: this.selectedAudienceTab });
      }, 500);
    }

  }

  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  public selectAudience(audience) {
    this.updateSelectedAudience(audience);
  }

  public clearAll(clearType) {
    this.currentAudienceId = null;
    this.targetAudienceService.getAudienceWithYear(this.dataVersion).subscribe(
      (result) => {
        if (this.selectedAudienceTab > 1 || clearType === 'new') {
          this.selectedAudienceTab = 1;
        }
        if (
          this.mod_permission &&
          this.mod_permission.features &&
          this.mod_permission.features.orderInventories &&
          this.mod_permission.features.orderInventories.status &&
          this.mod_permission.features.orderInventories.status !== 'active'
        ) {
          this.audiences = this.getFormattedAudienceData(result.catalog).filter(
            (audience) => audience.label.toLowerCase() !== 'ads'
          );
        } else {
          this.audiences = this.getFormattedAudienceData(result.catalog);
        }
      },
      (error) => {
        swal('Warning', 'Some error occurred. Please try again', 'warning');
      }
    );
    if (clearType === 'clear') {
      this.selectedTarget = {};
      this.filtersService.clearFilter('audience', true);
      this.onCompletedBrowsing.emit({ clearFilter: true });
    } else {
      this.setAudienceTitle();
    }
  }

  public selectTarget(selectedAudience, event = null) {
    if (this.selectionType === 'multiple') {
      if (event && !event.checked) {
        this.selectedTargets.push(selectedAudience);
      } else {
        const selectedindex = this.selectedTargets.findIndex(
          (audience) => audience._id === selectedAudience._id
        );
        this.selectedTargets.splice(selectedindex, 1);
      }
    } else {
      this.selectedTarget = selectedAudience;
    }
  }
  public removeAudience(audienceOption) {
    this.updateSelectedAudience(audienceOption, true);
  }
  private setAudienceTitle() {
    if (this.savedAudience && this.savedAudience.length > 0) {
      this.audienceTitleName = this.formatService.getObjectTitle(
        this.savedAudience,
        'Audience',
        'title'
      );
      this.audienceTitle = this.audienceTitleName;
    } else {
      this.audienceTitleName = 'Untitled Audience 1';
      this.audienceTitle = this.audienceTitleName;
    }
  }
  public targetChange(filterType) {
    const currentTab = this.getCurrentTabData();
    if (this.selectionType === 'multiple') {
      if (filterType === 'custom' && currentTab['finalTargetAudience']) {
        this.onCompletedBrowsing.emit({
          targetAudience: [currentTab['finalTargetAudience']],
          selectedAudienceList: currentTab['flattenedSelect'],
          tabPosition: this.selectedAudienceTab,
          currentTargetKey: currentTab['finalTargetAudience'],
          currentTargetId: currentTab['targetAudience'],
          editAudienceId: currentTab['currentAudienceId'],
          clearFilter: false,
          tabType: filterType
        });
      } else if (filterType === 'saved' && this.selectedTargets) {
        const audiences = [];
        this.selectedTargets.map((aud) => {
          audiences.push({
            audience: aud.audiences[0]['key'],
            name: aud.title
          });
        });
        this.onCompletedBrowsing.emit({
          targetAudience: audiences,
          selectedAudienceList: [],
          tabPosition: this.selectedAudienceTab,
          currentTargetKey: '',
          currentTargetId: '',
          editAudience: null,
          clearFilter: false,
          tabType: filterType
        });
      } else if (
        filterType === 'single' &&
        typeof currentTab['selectedAudience'] !== 'undefined'
      ) {
        const audiences = [];
        currentTab['selectedAudience'].map((aud) => {
          audiences.push({
            audience: aud.targetAudienceKey,
            name: aud.description
          });
        });
        this.onCompletedBrowsing.emit({
          targetAudience: audiences,
          selectedAudienceList: [],
          tabPosition: this.selectedAudienceTab,
          currentTargetKey: '',
          currentTargetId: '',
          editAudience: null,
          clearFilter: false,
          tabType: filterType
        });
      } else {
        swal(
          'Warning',
          'Please further refine your target audience to apply.',
          'warning'
        );
      }
    } else {
      if (filterType === 'custom' && currentTab['finalTargetAudience']) {
        this.onCompletedBrowsing.emit({
          targetAudience: currentTab['finalTargetAudience'],
          selectedAudienceList: currentTab['flattenedSelect'],
          tabPosition: this.selectedAudienceTab,
          currentTargetKey: currentTab['finalTargetAudience'],
          currentTargetId: currentTab['targetAudience'],
          editAudienceId: currentTab['currentAudienceId'],
          clearFilter: false,
          tabType: filterType
        });
      } else if (filterType === 'saved' && this.selectedTarget.audiences) {
        this.onCompletedBrowsing.emit({
          targetAudience: {
            audience: this.selectedTarget.audiences[0]['key'],
            name: this.selectedTarget.title
          },
          selectedAudienceList: [],
          tabPosition: this.selectedAudienceTab,
          currentTargetKey: this.selectedTarget.audiences[0]['key'],
          currentTargetId: this.selectedTarget._id,
          editAudience: null,
          clearFilter: false,
          tabType: filterType
        });
      } else if (
        filterType === 'single' &&
        typeof currentTab['selectedAudience']['tag'] !== 'undefined'
      ) {
        const params = {};
        params['tags'] = currentTab['selectedAudience']['tag'];
        params['catalog'] = currentTab['label'];
        this.targetAudienceService
          .getAudienceWithYear(this.dataVersion, params, true)
          .subscribe((result) => {
            this.onCompletedBrowsing.emit({
              targetAudience: {
                audience: result['targetAudienceKey'],
                name: currentTab['selectedAudience']['description']
              },
              selectedAudienceList:
                result['audienceFilter'][0]['options'][0]['options'],
              tabPosition: this.selectedAudienceTab,
              currentTargetKey: result['targetAudienceKey'],
              currentTargetId:
                currentTab['selectedAudience']['targetAudienceKey'],
              editAudienceId: currentTab['currentAudienceId'],
              clearFilter: false,
              tabType: filterType
            });
          });
        this.selectedTarget = {};
      } else {
        swal(
          'Warning',
          'Please further refine your target audience to apply.',
          'warning'
        );
      }
    }
  }
  public onFlatTabSearch(event) {
    const txt = event.target.value;
    if (this.timeoutId) window.clearTimeout(this.timeoutId);
      this.timeoutId = window.setTimeout(() => {
        this.flatTabSearch(txt.trim());
      }, 300);
  }

  public flatTabSearch(eventText) {
    if (eventText) {
      const currentTab = this.getCurrentTabData();
      if (this.audienceAPICalls != null) {
        this.audienceAPICalls.unsubscribe();
      }
      this.audienceAPICalls = of(eventText).pipe(
        switchMap(() => {
          currentTab.searchQuery = eventText;
          currentTab.loader = true;
          const index = this.getCurrentTabIndex();
          this.audiences[index] = currentTab;
          const data: any = {
            catalog: currentTab.label,
            search: encodeURIComponent(eventText)
          };
          if (
            currentTab.selectedCategory &&
            currentTab.selectedCategory.label !== ''
          ) {
            data.catalog =
              currentTab.label + '.' + currentTab.selectedCategory.label;
          }
          return this.targetAudienceService.searchAudiencesWithYear(this.dataVersion, data).pipe(map((result) => result['data']));
        })).subscribe((result) => {
            this.updateFilteredDataCurrentTab(result);
        });

    }  else {
      const currentTab = this.getCurrentTabData();
      const index = this.getCurrentTabIndex();
      this.audiences[index]['searchQuery'] = '';
    }
  }
  public onSearch() {
    const currentTab = this.getCurrentTabData();
    const flattenedSelect = currentTab['flattenedSelect'] || [];
    const audienceTags = flattenedSelect.map((option) => option.tag);
    const searchTerm = currentTab.searchQuery.trim();
    if (searchTerm) {
      const data = {
        search: searchTerm,
        tags: audienceTags.join(),
        catalog: this.selectedTabAudienceList['label']
      };
      this.targetAudienceService.searchAudiencesWithYear(this.dataVersion, data).subscribe(
        (result) => {
          this.updateFilteredDataCurrentTab(result.data);
        },
        (error) => {
          swal('Warning', 'Some error occurred. Please try again', 'warning');
        }
      );
    } else {
      const index = this.getCurrentTabIndex();
      this.audiences[index]['filtered'] = [];
    }
  }
  public isSelected(audience) {
    return this.flattenedAudienceKeys.indexOf(audience) >= 0;
  }

  private flattenSelection(selectedAudience = [], tabName = '') {
    const flattenedSelect = [];
    let flattenedAudienceKeys = [];
    selectedAudience.map((grandParent) => {
      grandParent.options.map((parent) => {
        parent.options.map((option) => {
          flattenedSelect.push({
            tag: option.tag,
            description: option.description,
            category: grandParent.label,
            subCategory: parent.label,
            tab: tabName
          });
        });
      });
    });
    flattenedAudienceKeys = flattenedSelect.map((option) => option.tag);
    return {
      flattenedSelect: flattenedSelect,
      flattenedAudienceKeys: flattenedAudienceKeys
    };
  }
  private updateSelectedAudience(audience, remove = false) {
    const currentTab = this.getCurrentTabData();
    const flattenedSelect = currentTab['flattenedSelect'] || [];
    const flattenedAudienceKeys = currentTab['flattenedAudienceKeys'] || [];
    let audienceTags: any = [];
    if (remove) {
      flattenedSelect.splice(flattenedAudienceKeys.indexOf(audience.tag), 1);
      audienceTags = flattenedSelect.map((option) => option.tag);
    } else {
      audienceTags = flattenedSelect.map((option) => option.tag);
      audienceTags.push(audience.tag);
    }
    const params = {
      catalog: currentTab['label']
    };
    if (audienceTags && audienceTags.length > 0) {
      params['tags'] = audienceTags.join();
    }
    this.targetAudienceService.getAudienceWithYear(this.dataVersion, params, true).subscribe(
      (result) => {
        this.updateDataCurrentTab(result);
      },
      (error) => {
        swal('Warning', 'Some error occurred. Please try again', 'warning');
      }
    );
  }

  onEditAudienceName(event, audience) {
    if (event && event['value'] === true) {
      this.onCancelAudienceName();
    } else {
      this.isEditAudienceName = true;
      this.nameUniqueError = false;
      this.audienceTitle = audience['audienceTitleName'];
      // this.audience['controls'].name.enable();
      setTimeout(() => {
        this.focusNameRef.nativeElement.focus();
      }, 100);
    }
  }
  onSaveAudienceName(audience) {
    if (this.audienceTitle) {
      audience['audienceTitleName'] = this.audienceTitle;
      this.audienceTitle = '';
      this.isEditAudienceName = false;
    }
  }
  onCancelAudienceName() {
    this.isEditAudienceName = false;
    this.audienceTitle = '';
  }

  onEditBehaviorName(event, audience) {
    this.isEditBehaviorName = true;
    this.audienceTitle = audience['audienceTitleName'];
  }
  onCancelBehaviorName() {
    this.isEditBehaviorName = false;
    this.audienceTitle = '';
  }
  onSaveBehaviorName(audience) {
    if (this.audienceTitle) {
      audience['audienceTitleName'] = this.audienceTitle;
      this.audienceTitle = '';
      this.isEditBehaviorName = false;
    }
  }
  public saveAudience() {
    const currentTab = this.getCurrentTabData();
    if (this.isEditAudienceName || this.isEditBehaviorName) {
      currentTab['audienceTitleName'] = this.audienceTitle;
    }
    if (currentTab['tabType'] === 'single') {
      if (typeof currentTab['selectedAudience']['tag'] === 'undefined') {
        return swal(
          'Warning',
          'Please further refine your target audience to apply.',
          'warning'
        );
      }
      const params = {};
      params['tags'] = currentTab['selectedAudience']['tag'];
      params['catalog'] = currentTab['label'];
      this.targetAudienceService
        .getAudienceWithYear(this.dataVersion, params, true)
        .subscribe((result) => {
          const audienceData: any = {
            audience: {
              title: currentTab['audienceTitleName'],
              audiences: [
                {
                  key: result['targetAudienceKey'],
                  tags: [currentTab['selectedAudience']['tag']]
                }
              ]
            }
          };
          if (currentTab['currentAudienceId']) {
            this.updateSavedAudience(audienceData, currentTab);
          } else {
            this.createSaveAudience(audienceData);
          }
        });
    } else {
      if (
        !currentTab['finalTargetAudience'] ||
        !currentTab['finalTargetAudience'].audience
      ) {
        return swal(
          'Warning',
          'Please further refine your target audience to apply.',
          'warning'
        );
      }
      const audienceData: any = {
        audience: {
          title: currentTab['audienceTitleName'],
          audiences: [
            {
              key: currentTab['finalTargetAudience'].audience,
              tags: currentTab['flattenedAudienceKeys']
            }
          ]
        }
      };
      if (currentTab['currentAudienceId']) {
        this.updateSavedAudience(audienceData, currentTab);
      } else {
        this.createSaveAudience(audienceData);
      }
    }
  }

  private updateSavedAudience(audienceData: any, currentTab) {
    this.targetAudienceService
      .updateAudience(audienceData, currentTab['currentAudienceId'])
      .subscribe(
        (resultData) => {
          if (this.isScenario) {
            this.onCompletedBrowsing.emit({
              currentTargetId: resultData.data.id
            });
          }
          swal('Success', 'Your audience saved successfully.', 'success');
        },
        (error) => {
          if (
            typeof error.error !== 'undefined' &&
            error.error['code'] === 3026
          ) {
            swal(
              'Info',
              'This saved audience name already exists. Please use a different name.',
              'warning'
            );
          } else {
            swal('Warning', 'Some error occurred. Please try again', 'warning');
          }
        }
      );
  }

  private createSaveAudience(audienceData) {
    this.dialog
      .open(AudienceTitleDialogComponent, {
        /*height: '160px',*/
        data: audienceData,
        width: '500px',
        closeOnNavigation: true,
        panelClass: 'save-audience-dialog'
      })
      .afterClosed()
      .subscribe((result) => {
        const currentTab = this.getCurrentTabData();
        if (typeof result !== 'undefined' && result) {
          audienceData.audience.title = result;
          currentTab['audienceTitleName'] = result;
          // this.audienceTitle = x.value;
          this.targetAudienceService.saveAudience(audienceData).subscribe(
            (audience) => {
              if (this.isScenario) {
                this.onCompletedBrowsing.emit({
                  currentTargetId: audience.data.id
                });
              }
              swal('Success', 'Your audience saved successfully.', 'success');
            },
            (error) => {
              if (
                typeof error.error !== 'undefined' &&
                typeof error.error['code'] !== 'undefined' &&
                error.error['code'] === 3017
              ) {
                swal(
                  'Info',
                  'This saved audience name already exists. Please use a different name.',
                  'warning'
                );
              } else {
                swal(
                  'Warning',
                  'Some error occurred. Please try again',
                  'warning'
                );
              }
            }
          );
        }
      });
  }
  public editAudience(audience) {
    const savedAudience = audience.audiencesInfo;
    const key = Object.keys(savedAudience[0])[0];
    const actualAudience = savedAudience[0][key];
    const catalog = actualAudience[0]['catalog'].split('.')[0];
    const tabIndex = this.audiences.findIndex((audienceTag) => {
      return audienceTag['label'] === catalog;
    });
    const currentTab = this.audiences[tabIndex];
    if (currentTab['tabType'] === 'single') {
      this.selectedAudienceTab = tabIndex + 1;
      const setAudience = {
        title: audience.title,
        _id: audience._id,
        audiences: actualAudience
      };
      setAudience.audiences.push({ tag: key, description: audience.title });
      this.updateFlatOptionChange(setAudience);
    } else {
      const data = [];
      savedAudience.forEach((character) => {
        Object.keys(character).forEach((item1) => {
          character[item1].forEach((item) => {
            data.push(item.tag);
          });
        });
      });
      this.targetAudienceService
        .getAudienceWithYear(this.dataVersion,{ catalog: catalog, tags: data }, true)
        .subscribe(
          (res) => {
            this.updateDataCurrentTab(res, tabIndex, audience);
            this.selectedAudienceTab = tabIndex + 1;
          },
          (error) => {
            swal('Warning', 'Some error occurred. Please try again', 'warning');
          }
        );
    }
  }

  public deleteAudience(audience) {
    swal({
      title: 'Are you sure you want to delete this audience?',
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: 'NO',
      confirmButtonText: 'YES, DELETE',
      confirmButtonClass: 'waves-effect waves-light',
      cancelButtonClass: 'waves-effect waves-light'
    })
      .then((x) => {
        if (typeof x.value !== 'undefined' && x.value) {
          this.targetAudienceService.deleteAudience(audience._id).subscribe(
            (response) => {
              // this.savedAudience.splice(this.savedAudience.indexOf(audience), 1);
              this.savedAudience$
                .pipe(takeUntil(this.unSubscribe))
                .subscribe((savedAudience) => {
                  savedAudience.splice(savedAudience.indexOf(audience), 1);
                  this.filteredSavedAudience$.next(savedAudience);
                });
              swal('Deleted!', 'Audience deleted successfully', 'success');
              if (
                Object.keys(this.selectedTarget).length > 0 &&
                this.selectedTarget._id === audience._id
              ) {
                this.clearAll('clear');
              }
            },
            (e) => {
              let message = '';
              if (
                typeof e.error !== 'undefined' &&
                typeof e.error.message !== 'undefined'
              ) {
                message = 'An error has occurred. Please try again later.';
              }
              swal('Error', message, 'error');
            }
          );
        }
      })
      .catch(swal.noop);
  }
  setStep(index: number) {
    this.step = index;
  }

  public scrollTo(event) {
    // event.target.scrollIntoView();
  }

  /** To sort dynamic array that key can be string or numeric
   * whatever type it may be;
   * @addedBy Kumaravel P
   * @date 23/09/2019
   * @param {*} key using by which key of the object
   * @param {*} order asc or desc by which order we need the array to be sorted
   * @returns 1,-1 based on the value greater than or lessthan between
   */
  private compareValues(key, order) {
    return function (a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }

      const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];
      let comparison = 0;
      varA > varB ? (comparison = 1) : (comparison = -1);
      return order === 'desc' ? comparison * -1 : comparison;
    };
  }

  public tabSwitch(event: object = {}) {
    this.savedAudience = [];
    this.searchQuery = null;
    this.isEditAudienceName = false;
    this.isEditBehaviorName = false;
    this.audienceTitle = '';
    const index = this.getCurrentTabIndex();
    const data = this.audiences[index];
    if (
      typeof data !== 'undefined' &&
      typeof data.tabType !== 'undefined' &&
      data.tabType === 'single' &&
      data.displayList &&
      data.displayList.length <= 0
    ) {
      this.audienceAPILoadedFlag = true;
      this.targetAudienceService
        .getAudienceWithYear(this.dataVersion,{ catalog: data.label }, true)
        .subscribe((result) => {
          if (result['catalog'] && result['catalog'].length > 0) {
            result.catalog[0]['options'].sort(
              this.compareValues('description', 'asc')
            );
            const audience = result.catalog[0]['options'];
            const allAudience = [];
            if (audience && audience.length >= 1) {
              data.options = audience;
              data.categories = [];
              let j = 0;
              data.categories.push({
                description: 'All Categories',
                label: '',
                options: []
              });
              audience.map((item) => {
                data.categories.push(item);
                allAudience.push(...item.options);
                j++;
              });
              data.displayList = allAudience;
              data.categories[0]['options'] = allAudience;
              data.options = data.categories;
              data.selectedCategory = data.categories[0];
            } else {
              data.displayList = audience[0]['options'];
            }
          } // End of result['catalog']
          this.audienceAPILoadedFlag = false;
        });
    }
    this.selectedTabAudienceList = data;
    if (event && event['index'] === 0) {
      this.loadSavedAudiences(false);
    }
  }
  private loadSavedAudiences(resetTitle = true) {
    this.savedAudience$ = this.targetAudienceService
      .getFormattedSavedAudiences()
      .pipe(
        tap((savedAudiences) => {
          if (this.selectedTarget['_id']) {
            this.selectedTarget = this.targetAudienceService.findSavedAudienceById(
              this.selectedTarget['_id'],
              savedAudiences
            );
          }
          if (resetTitle) {
            this.setAudienceTitle();
          }
        })
      );
    combineLatest(this.savedAudience$, this.savedAudienceFilter$)
      .pipe(
        map(([savedAudience, filter]) => {
          return savedAudience.filter((audience) => {
            return (
              audience.title
                .toLowerCase()
                .indexOf(filter.toLowerCase().trim()) >= 0
            );
          });
        }),
        takeUntil(this.unSubscribe)
      )
      .subscribe((data) => {
        this.destroyInitiator();
        this.filteredSavedAudience$.next(data);
      });
  }
  getFormattedAudienceData(audiences) {
    const format = [];
    for (let i = 0; i < audiences.length; i++) {
      if (
        typeof audiences[i]['options'][0]['options'] !== 'undefined' &&
        audiences[i]['options'][0]['options'].length > 1
      ) {
        const temp = audiences[i];
        temp['tabType'] = 'multiple';
        temp['displayList'] = temp['options'];
        temp['selectedAudience'] = [];
        temp['targetAudience'] = {};
        temp['audienceTitleName'] = this.defaultAudience.description;
        temp['dataVersion'] = this.dataVersion;
        temp['enableSave'] = true;
        temp['loader'] = false;
        format.push(temp);
      } else {
        const aud = {};
        aud['tabType'] = 'single';
        aud['label'] = audiences[i]['label'];
        aud['description'] = audiences[i]['description'];
        aud['displayList'] = [];
        aud['selectedAudience'] = [];
        aud['targetAudience'] = {};
        aud['audienceTitleName'] = 'Untitled';
        aud['dataVersion'] = this.dataVersion;
        aud['enableSave'] = true;
        aud['loader'] = false;
        format.push(aud);
      }
    }
    return format;
  }
  onCategoryChange(e) {
    const selected = e.value;
    const index = this.getCurrentTabIndex();
    const data = this.audiences[index];
    const selectedCategory = data.options.find(
      (item) => item.label === selected.label
    );
    data.displayList = selectedCategory['options'];
    if (data.searchQuery !== '') {
      this.flatTabSearch(data.searchQuery);
    }
  }
  private getCurrentTabIndex(): number {
    if (this.dataVersion === 2020) {
      return this.selectedAudienceTab - 1;
    }
    return this.selectedAudienceTab;
  }
  public getCurrentTabData() {
    const index = this.getCurrentTabIndex();
    return this.audiences[index];
  }
  public updateFilteredDataCurrentTab(filterData) {
    const index = this.getCurrentTabIndex();
    this.audiences[index]['filtered'] = [];
    this.audiences[index]['loader'] = false;
    if (filterData && filterData.length > 0) {
      this.audiences[index]['filtered'] = filterData;
    }
  }
  public updateDataCurrentTab(r, index = null, savedAudience = {}) {
    if (!index) {
      index = this.getCurrentTabIndex();
    }
    const data = this.audiences[index];
    data['displayList'] = r.catalog[0] ? r.catalog[0]['options'] : [];
    data['selectedAudience'] = r.audienceFilter[0]
      ? r.audienceFilter[0]['options']
      : [];
    data['targetAudience'] = r.targetAudienceKey;
    const flatten = this.flattenSelection(
      data['selectedAudience'],
      data['label']
    );
    data['flattenedAudienceKeys'] = flatten['flattenedAudienceKeys'];
    data['flattenedSelect'] = flatten['flattenedSelect'];
    const title = flatten['flattenedSelect']
      .map((option) => option.subCategory + ' - ' + option.description)
      .join(', ');
    if (typeof savedAudience['_id'] !== 'undefined') {
      data['currentAudienceId'] = savedAudience['_id'];
      data['audienceTitleName'] = savedAudience['title'];
    } else if (typeof data['currentAudienceId'] === 'undefined') {
      data['audienceTitleName'] = title ? title : 'Total Population 0+ yrs';
    }
    data['finalTargetAudience'] = {
      audience: r.targetAudienceKey,
      name: flatten['flattenedSelect']
        .map((option) => option.description)
        .join()
    };
    this.audiences[index] = data;
  }
  onFlatOptionChange(character, index = null) {
    if (!index === null) {
      index = this.getCurrentTabIndex();
    }
    const data = this.audiences[index];
    data['selectedAudience'] = character;
    if (!data['currentAudienceId']) {
      data['audienceTitleName'] = character.description;
    }

    const params = {};
    params['tags'] = data['selectedAudience']['tag'];
    params['catalog'] = data['label'];
    this.targetAudienceService
      .getAudienceWithYear(this.dataVersion, params, true)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((result) => {
        data['selectedAudience']['targetAudienceKey'] =
          result['targetAudienceKey'];
        this.audiences[index] = data;
      });
  }
  onSelectMultipleOption(character, index = null) {
    if (!index) {
      index = this.getCurrentTabIndex();
    }
    const data = Helper.deepClone(this.audiences[index]);
    const selectedAudience = data['selectedAudience'];
    const audIndex = selectedAudience.findIndex((aud) => {
      return aud.tag === character.tag;
    });
    if (audIndex > -1) {
      selectedAudience.splice(audIndex, 1);
      this.audiences[index]['selectedAudience'] = selectedAudience;
    } else {
      // data['selectedAudience'].push(character);
      const params = {};
      params['tags'] = character['tag'];
      params['catalog'] = data['label'];
      this.gettingDataFromAPI = true;
      this.audienceLoadedIndex++;
      this.targetAudienceService
        .getAudienceWithYear(this.dataVersion, params, true)
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((result) => {
          character['targetAudienceKey'] = result['targetAudienceKey'];
          this.audiences[index]['selectedAudience'].push(character);
          this.audienceLoadedIndex--;
          this.isSelectionOver();
        });
    }
  }
  isSelectionOver() {
    if (this.audienceLoadedIndex <= 0) {
      this.gettingDataFromAPI = false;
    }
  }
  checkIsSelected(option) {
    const index = this.getCurrentTabIndex();
    const matches = this.audiences[index]['selectedAudience'].filter(
      (v) => v.tag === option.tag
    );
    return matches.length > 0;
  }

  updateFlatOptionChange(audience, index = null) {
    if (!index) {
      index = this.getCurrentTabIndex();
    }
    if (this.audiences[index]) {
      const data = this.audiences[index];
      data['selectedAudience'] = audience.audiences[0];
      data['audienceTitleName'] = audience.title;
      data['currentAudienceId'] = audience['_id'];
      const params = {};
      params['tags'] = data['selectedAudience']['tag'];
      params['catalog'] = data['label'];
      this.targetAudienceService
        .getAudienceWithYear(this.dataVersion, params, true)
        .subscribe((result) => {
          data['selectedAudience']['targetAudienceKey'] =
            result['targetAudienceKey'];
        });
      this.audiences[index] = data;
    }
  }
  private setAudienceFromSession() {
    const filters =
      this.isScenario || this.isInventory
        ? ''
        : this.filtersService.getExploreSession();
    if (filters) {
      if (
        typeof filters['data'] !== 'undefined' &&
        typeof filters['data']['audience'] !== 'undefined'
      ) {
        if (typeof filters['data']['audience']['details'] !== 'undefined') {
          const targetDetail = filters['data']['audience']['details'];
          this.exploreData.setSelectedTarget(
            targetDetail['targetAudience'].audience
          );
          this.exploreData.setSelectedTargetName(
            targetDetail['targetAudience'].name
          );
          this.selectedAudienceTab = targetDetail['tabPosition'];
          switch (targetDetail['tabType']) {
            case 'single':
              const setAudience = {
                title: targetDetail['targetAudience'].name,
                _id: '', // targetDetail['targetAudience'].audience,
                audiences: targetDetail['selectedAudienceList']
              };
              setAudience.audiences.push({
                tag: targetDetail['targetAudience'].audience,
                description: targetDetail['targetAudience'].name
              });
              this.updateFlatOptionChange(setAudience);
              break;
            case 'custom':
              const data = [];
              const currentTab = this.audiences[
                targetDetail['tabPosition'] - 1
              ];
              this.selectedAudienceTab = targetDetail['tabPosition'];
              if (currentTab) {
                targetDetail['selectedAudienceList'].forEach((character) => {
                  data.push(character.tag);
                });
                this.targetAudienceService
                  .getAudienceWithYear(this.dataVersion, {
                    catalog: currentTab['label'],
                    tags: data
                  })
                  .subscribe(
                    (res) => {
                      this.updateDataCurrentTab(res);
                    },
                    (error) => {
                      swal(
                        'Warning',
                        'Some error occurred. Please try again',
                        'warning'
                      );
                    }
                  );
              }
              break;
            case 'saved':
              if (
                typeof filters['data']['audience']['details'][
                  'currentTargetId'
                ] !== 'undefined' &&
                filters['data']['audience']['details']['currentTargetId'] !=
                  null
              ) {
                this.targetAudienceService
                  .getFormattedSavedAudiences()
                  .pipe(takeUntil(this.unSubscribe))
                  .subscribe((audiences) => {
                    const id = targetDetail['currentTargetId'];
                    if (id) {
                      this.selectedTarget = this.targetAudienceService.findSavedAudienceById(
                        id,
                        audiences
                      );
                    }
                  });
              }
              break;

            default:
              this.selectedAudienceTab = 1;
              break;
          }
        }
      } else {
        this.selectedAudienceTab = 0;
        this.selectedTarget = {};
        this.exploreData.setSelectedTarget(this.defaultAudience.audienceKey);
        this.exploreData.setSelectedTargetName(
          this.defaultAudience.description
        );
      }
    }
  }
  public trackBySavedAudience(index, item) {
    return item._id;
  }
}
