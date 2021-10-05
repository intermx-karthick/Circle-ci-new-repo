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
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { combineLatest, interval, Observable, of, Subject } from 'rxjs';
import {
  FormatService,
  AuthenticationService,
  CommonService,
  ExploreDataService,
  TargetAudienceService,
  ThemeService
} from '@shared/services';
import { MatDialog } from '@angular/material/dialog';
import { FiltersService } from '../../explore/filters/filters.service';
import { AudienceTitleDialogComponent } from '@shared/components/audience-title-dialog/audience-title-dialog.component';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  tap,
  takeUntil,
  filter,
  catchError,
  switchMap,
  debounce
} from 'rxjs/operators';
import { Helper } from '../../classes';
import { AbstractLazyLoadComponent } from '@shared/custom-lazy-loader';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { CustomValidators } from '../../validators/custom-validators.validator';
import { TooltipPanelData } from '@shared/tooltip-panel/tooltip-panel.model';

@Component({
  selector: 'app-audience-filter',
  templateUrl: './audience-filter.component.html',
  styleUrls: ['./audience-filter.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudienceFilterComponent extends AbstractLazyLoadComponent
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
  public audienceTitleFc = new FormControl('', [
    Validators.required,
    CustomValidators.noWhitespaceValidator(true)
  ]);
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
  @Input() includeType = 'dialog';
  @Input() deleteAudience$: Subject<any>;
  @Output() onCompletedBrowsing: EventEmitter<any> = new EventEmitter();
  @Output() updateSelectedAudienceList: EventEmitter<any> = new EventEmitter();
  private mod_permission: any;
  public allowInventory = '';
  private audienceAPILoadedFlag = false;
  private themeSettings: any;
  private unSubscribe = new Subject();
  public selectedTargets: any = [];
  public gettingDataFromAPI = false;
  public audienceLoadedIndex = 0;
  isInitialLoadCompleted: boolean = false;
  unsubscribeInitiator$: Subject<void> = new Subject();
  public isDataVersionOpen = false;
  public selectedDataVersion: any = 2020;
  public dataVersions = [202106, 2021, 2020];
  public savedDataVersion = 2020;
  timeoutId: any;
  audienceAPICalls : any = null;
  tooltipPanelData:  Record<string, TooltipPanelData> = {
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

  constructor(
    private targetAudienceService: TargetAudienceService,
    private formatService: FormatService,
    private exploreData: ExploreDataService,
    private auth: AuthenticationService,
    private commonService: CommonService,
    private filtersService: FiltersService,
    private dialog: MatDialog,
    private theme: ThemeService,
    private cdRef: ChangeDetectorRef,
    private workspaceV3Service: WorkspaceV3Service,
    private matSnackBar: MatSnackBar
  ) {
    super();
    this.searchSavedQuery = new FormControl('');
    this.savedDataVersion = Number(this.theme.getThemeSettingByName('measuresRelease'));
    this.selectedDataVersion = this.savedDataVersion;
    this.savedAudienceFilter$ = this.searchSavedQuery.valueChanges.pipe(
      debounceTime(300),
      startWith('')
    );
  }
  init() {
    this.targetAudienceService.getDefaultAudience(false, this.savedDataVersion.toString())
      .subscribe((audience) => {
      this.defaultAudience = audience;
      this.cdRef.markForCheck();
    });
    this.getAudiences();
    // this.getAudiences();
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

  public ngOnInit() {
    this.themeSettings = this.theme.getThemeSettings();
    this.mod_permission = this.auth.getModuleAccess('explore');
    this.allowInventory = this.mod_permission['features']?.['gpInventory'][
      'status'
    ];
    this.commonService
      .getMobileBreakPoint()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((isMobile) => {
        this.isSmallScreen = isMobile;
        this.cdRef.markForCheck();
      });
    this.subchilds = [{ name: 'Upper Crusts' }, { name: 'Movers and Shakers' }];
    this.audienceLicense = this.auth.getModuleAccess('gpAudience');
    // const sessionFilter = this.targetAudienceService.getExploreSession();
    this.cdRef.markForCheck();
    this.listenerForInitialLoad();
    this.filtersService
      .onReset()
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((type) => {
        if (type !== 'FilterInventory') {
          this.clearAll('clear');
        }
      });
    this.listenForClearFilters();
    if(this.includeType !== 'dialog') {
      this.deleteAudience$.subscribe((data) => {
        const audienceIndex = this.selectedAudienceList.findIndex((d) => d['id'] === data['id']);
        this.removeSelectedAudience(this.selectedAudienceList[audienceIndex], audienceIndex);
      });
    }
  }

  async audienceTabUpdate(audienses) {
    const allowedTabs = this.mod_permission.features.gpAudience.tabs;
    this.audiences = audienses.filter((element) => allowedTabs.includes(element.label));
    return true;
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
    this.selectedTargets = [];
    this.selectedTarget = {};
    this.cdRef.markForCheck();

    this.targetAudienceService.getAudienceWithYear(this.savedDataVersion).subscribe(
      (result) => {
        if (this.selectedAudienceTab > 1 || clearType === 'new') {
          this.selectedAudienceTab = 1;
          this.cdRef.markForCheck();
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
          this.cdRef.markForCheck();
        } else {
          this.audiences = this.getFormattedAudienceData(result.catalog);
          this.cdRef.markForCheck();
        }
      },
      (error) => {
        this.showsAlertMessage('Some error occurred. Please try again');
      }
    );
    if (clearType === 'clear') {
      this.selectedTarget = {};
      this.filtersService.clearFilter('audience', true);
      this.onCompletedBrowsing.emit({ clearFilter: true });
    } else {
      this.setAudienceTitle();
    }
    this.cdRef.markForCheck();
  }

  public selectTarget(selectedAudience, event = null) {
    if (this.selectionType === 'multiple') {
      if (event && event.checked) {
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

    this.cdRef.markForCheck();
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
      this.audienceTitleFc.setValue(this.audienceTitleName);
    } else {
      this.audienceTitleName = 'Untitled Audience 1';
      this.audienceTitleFc.setValue(this.audienceTitleName);
    }
    this.cdRef.markForCheck();
  }
  public targetChange(filterType) {
    const currentTab = this.getCurrentTabData();
    const index = this.getCurrentTabIndex();
    if (this.selectionType === 'multiple') {
      if (filterType === 'custom' && currentTab['finalTargetAudience']) {
        this.onCompletedBrowsing.emit({
          targetAudience: [{
            name: currentTab['currentAudienceId'] ? currentTab['audienceTitleName'] : currentTab['finalTargetAudience']['name'],
            audience: currentTab['finalTargetAudience']['audience'],
            measuresRelease: this.savedDataVersion
          }],
          selectedAudienceList: currentTab['flattenedSelect'],
          tabPosition: this.selectedAudienceTab,
          currentTargetKey: currentTab['finalTargetAudience'],
          currentTargetId: currentTab['targetAudience'],
          editAudienceId: currentTab['currentAudienceId'],
          clearFilter: false,
          tabType: filterType
        });
        this.clearAll('clear');
      } else if (filterType === 'saved' && this.selectedTargets) {
        const audiences = [];
        this.selectedTargets.map((aud) => {
          audiences.push({
            audience: aud.audiences[0]['key'],
            name: aud.title,
            measuresRelease: this.savedDataVersion
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
        this.selectedTargets = [];
        // this.clearAll('clear');
      } else if (
        filterType === 'single' &&
        typeof currentTab['selectedAudience'] !== 'undefined'
      ) {
        const audiences = [];
        if (
          currentTab['currentAudienceId'] &&
          currentTab['selectedAudience'].length === 1
        ) {
          currentTab['selectedAudience'].map((aud) => {
            audiences.push({
              audience: aud.targetAudienceKey,
              name: currentTab['audienceTitleName']
            });
          });
        } else {
          currentTab['selectedAudience'].map((aud) => {
            audiences.push({
              audience: aud.targetAudienceKey,
              name: aud.description,
              measuresRelease: this.savedDataVersion
            });
          });
        }

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
        // this.clearAll('clear');
        delete currentTab['currentAudienceId'];
        currentTab['audienceTitleName'] = "Untitled"
        currentTab['selectedAudience'] = [];
        this.audiences[index] = currentTab;
      } else {
        this.showsAlertMessage('Please further refine your target audience to apply.');
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
            name: this.selectedTarget.title,
            measuresRelease: this.savedDataVersion
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
          .getAudienceWithYear(this.savedDataVersion, params, true)
          .subscribe((result) => {
            this.onCompletedBrowsing.emit({
              targetAudience: {
                audience: result['targetAudienceKey'],
                name: currentTab['selectedAudience']['description'],
                measuresRelease: this.savedDataVersion
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
        this.showsAlertMessage('Please further refine your target audience to apply.');
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
          this.audiences[this.getCurrentTabIndex()] = currentTab;
          this.cdRef.markForCheck();
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
          return this.targetAudienceService.searchAudiencesWithYear(this.savedDataVersion, data).pipe(map((result) => result['data']));
      })).subscribe((result) => {
            this.updateFilteredDataCurrentTab(result);
        });
    } else {
      const currentTab = this.getCurrentTabData();
      delete(currentTab.searchQuery);
      this.audiences[this.getCurrentTabIndex()] = currentTab;
      this.cdRef.markForCheck();
    }
  }
  public onSearch() {
    const currentTab = this.getCurrentTabData();
    const flattenedSelect = currentTab['flattenedSelect'] || [];
    const audienceTags = flattenedSelect.map((option) => option.tag);
    const searchTerm = (currentTab.searchQuery) ? currentTab.searchQuery.trim(): '';
    if (searchTerm) {
      const data = {
        search: searchTerm,
        tags: audienceTags.join(),
        catalog: this.selectedTabAudienceList['label']
      };

      this.targetAudienceService.searchAudiencesWithYear(this.savedDataVersion, data).subscribe(
        (result) => {
          this.updateFilteredDataCurrentTab(result.data);
        },
        (error) => {
          this.showsAlertMessage('Some error occurred. Please try again');
        }
      );
    } else {
      const index = this.getCurrentTabIndex();
      this.audiences[index]['filtered'] = [];
      this.cdRef.markForCheck();
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
    this.targetAudienceService.getAudienceWithYear(this.savedDataVersion, params, true).subscribe(
      (result) => {
        this.updateDataCurrentTab(result);
      },
      (error) => {
        this.showsAlertMessage('Some error occurred. Please try again');
      }
    );
  }

  onEditAudienceName(event, audience) {
    if (event && event['value'] === true) {
      this.onCancelAudienceName();
    } else {
      this.isEditAudienceName = true;
      this.nameUniqueError = false;
      this.audienceTitleFc.setValue(audience['audienceTitleName']);
      // this.audience['controls'].name.enable();
      this.cdRef.markForCheck();
      setTimeout(() => {
        this.focusNameRef.nativeElement.focus();
      }, 100);
    }
  }
  onSaveAudienceName(audience) {
    if (this.audienceTitleFc.valid) {
      audience['audienceTitleName'] = this.audienceTitleFc.value;
      this.audienceTitleFc.setValue('');
      this.isEditAudienceName = false;
      this.cdRef.markForCheck();
    }
  }
  onCancelAudienceName() {
    this.isEditAudienceName = false;
    this.audienceTitleFc.setValue('');
    this.cdRef.markForCheck();
  }

  onEditBehaviorName(event, audience) {
    this.isEditBehaviorName = true;
    this.audienceTitleFc.setValue( audience['audienceTitleName']);
    this.cdRef.markForCheck();
  }
  onCancelBehaviorName() {
    this.isEditBehaviorName = false;
    this.audienceTitleFc.setValue('');
    this.cdRef.markForCheck();
  }
  onSaveBehaviorName(audience) {
    if (this.audienceTitleFc.valid) {
      audience['audienceTitleName'] = this.audienceTitleFc.value;
      this.audienceTitleFc.setValue('');
      this.isEditBehaviorName = false;
      this.cdRef.markForCheck();
    }
  }
  public saveAudience() {
    const currentTab = this.getCurrentTabData();
    if (this.isEditAudienceName || this.isEditBehaviorName) {
      if(this.audienceTitleFc.invalid) return
      currentTab['audienceTitleName'] = this.audienceTitleFc.value;
    }
    if (currentTab?.['tabType'] === 'single') {
      const dubCurrentTab = Helper.deepClone(currentTab);
      if (this.selectionType === 'multiple') {
        dubCurrentTab['selectedAudience'] = dubCurrentTab['selectedAudience'][0];
      }
      if (typeof dubCurrentTab['selectedAudience']['tag'] === 'undefined') {
        this.showsAlertMessage('Please further refine your target audience to apply.');
        return false;
      }
      const params = {};
      params['tags'] = dubCurrentTab['selectedAudience']['tag'];
      params['catalog'] = dubCurrentTab['label'];
      this.targetAudienceService
        .getAudienceWithYear(this.savedDataVersion, params, true)
        .subscribe((result) => {
          const audienceData: any = {
            audience: {
              title: dubCurrentTab['audienceTitleName'],
              audiences: [
                {
                  key: result['targetAudienceKey'],
                  tags: [dubCurrentTab['selectedAudience']['tag']]
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
        this.showsAlertMessage('Please further refine your target audience to apply.')
        return false;
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
          /* if (this.isScenario) {
            this.onCompletedBrowsing.emit({
              currentTargetId: resultData.data.id
            });
          } */
          this.showsAlertMessage('Your audience saved successfully');
        },
        (error) => {
          if (
            typeof error.error !== 'undefined' &&
            error.error['code'] === 3026
          ) {
            this.showsAlertMessage('This saved audience name already exists. Please use a different name.');
          } else {
            this.showsAlertMessage('Some error occurred. Please try again');
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
        // panelClass: 'save-audience-dialog'
        panelClass: 'imx-mat-dialog',
      })
      .afterClosed()
      .subscribe((result) => {
        const currentTab = this.getCurrentTabData();
        if (typeof result !== 'undefined' && result) {
          audienceData.audience.title = result;
          currentTab['audienceTitleName'] = result;
          // this.audienceTitle = x.value;
          this.cdRef.markForCheck();
          this.targetAudienceService.saveAudience(audienceData).subscribe(
            (audience) => {
              audienceData.audience['_id'] = audience?.data?.id;
              let tags = [];
              if (currentTab?.tabType === 'single') {
                if (this.selectionType === 'multiple') {
                  tags = [currentTab?.selectedAudience[0]?.tag];
                } else {
                  tags = [currentTab?.selectedAudience?.tag];
                }

              } else {
                tags = currentTab?.flattenedAudienceKeys;
              }
              this.targetAudienceService
                .getAudienceWithYear(
                  this.savedDataVersion,
              {
                    catalog: currentTab?.label,
                    tags: tags
                  },
                  true
                )
                .subscribe(
                  (res) => {
                    this.updateDataCurrentTab(
                      res,
                      this.getCurrentTabIndex(),
                      audienceData.audience
                    );
                    this.cdRef.markForCheck();
                  },
                  (error) => {
                    this.showsAlertMessage('Some error occurred. Please try again');
                  }
                );
              /* if (this.isScenario) {
                this.onCompletedBrowsing.emit({
                  currentTargetId: audience.data.id
                });
              } */
              this.showsAlertMessage('Your audience saved successfully.');
            },
            (error) => {
              if (
                typeof error.error !== 'undefined' &&
                typeof error.error['code'] !== 'undefined' &&
                error.error['code'] === 3017
              ) {
                this.showsAlertMessage('This saved audience name already exists. Please use a different name.');
              } else {
                this.showsAlertMessage('Some error occurred. Please try again.');
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
    if (currentTab?.['tabType'] === 'single') {
      this.selectedAudienceTab = tabIndex + 1;
      const setAudience = {
        title: audience.title,
        _id: audience._id,
        audiences: actualAudience
      };
      setAudience.audiences.push({ tag: key, description: audience.title });
      this.cdRef.markForCheck();
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
        .getAudienceWithYear(this.savedDataVersion, { catalog: catalog, tags: data }, true)
        .subscribe(
          (res) => {
            this.updateDataCurrentTab(res, tabIndex, audience);
            this.selectedAudienceTab = tabIndex + 1;
            this.cdRef.markForCheck();
          },
          (error) => {
            this.showsAlertMessage('Some error occurred. Please try again.');
          }
        );
    }
  }

  public deleteAudience(audience) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(filter((result) => result && result.action))
      .subscribe((result) => {
        this.targetAudienceService.deleteAudience(audience._id).subscribe(
          (response) => {
            // this.savedAudience.splice(this.savedAudience.indexOf(audience), 1);
            this.savedAudience$
              .pipe(takeUntil(this.unSubscribe))
              .subscribe((savedAudience) => {
                savedAudience.splice(savedAudience.indexOf(audience), 1);
                this.filteredSavedAudience$.next(savedAudience);
              });
              this.showsAlertMessage('Audience deleted successfully');
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
            this.showsAlertMessage(message);
          }
        );
      });
  }
  setStep(index: number) {
    this.step = index;
    this.cdRef.markForCheck();
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
    this.audienceTitleFc.setValue('');
    const index = this.getCurrentTabIndex();
    const data = this.audiences[index];
    if (
      typeof data !== 'undefined' &&
      typeof data?.tabType !== 'undefined' &&
      data.tabType === 'single' &&
      data.displayList &&
      data.displayList.length <= 0
    ) {
      this.audienceAPILoadedFlag = true;
      this.targetAudienceService
        .getAudienceWithYear(this.savedDataVersion, { catalog: data.label }, true)
        .subscribe((result) => {
          if (result['catalog'] && result['catalog'].length > 0) {
            result.catalog[0]['options'].sort(
              this.compareValues('description', 'asc')
            );
            const audience = result.catalog[0]['options'];
            const allAudience = [];
            data.categories = [];
            data.categories.push({
              description: 'All Categories',
              label: '',
              options: []
            });
            audience.map((item) => {
              data.categories.push(item);
              allAudience.push(...item.options);
            });
            data.categories[0]['options'] = allAudience;
            data.displayList = allAudience;
            data.options = data.categories;
            data.selectedCategory = data.categories[0];
          } // End of result['catalog']
          this.audienceAPILoadedFlag = false;
          this.cdRef.markForCheck();
        });
    }
    this.selectedTabAudienceList = data;
    this.cdRef.markForCheck();
    if (event && event['index'] === 0) {
      this.loadSavedAudiences(false);
    }
  }
  private loadSavedAudiences(resetTitle = true) {
    this.savedAudience$ = this.targetAudienceService
      .getFormattedSavedAudiences()
      .pipe(
        tap((savedAudiences) => {
          if (this.selectedTarget && this.selectedTarget['_id']) {
            this.selectedTarget = this.targetAudienceService.findSavedAudienceById(
              this.selectedTarget['_id'],
              savedAudiences
            );
            this.cdRef.markForCheck();
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
  handleSelection(event) {
    if (event.option.selected) {
      event.source.selectedOptions._multiple = false;
    }
  }
  getPopulationOptions(audienceList = []) {
    if (audienceList && audienceList.length > 0) {
      return audienceList[0]['options'];
    } else {
      return [];
    }
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
        temp['targetAudience'] = '';
        temp['audienceTitleName'] = this.defaultAudience.description;
        temp['dataVersion'] = 2020;
        temp['enableSave'] = true;
        temp['loader'] = true;
        format.push(temp);
      } else {
        const aud = {};
        aud['tabType'] = 'single';
        aud['label'] = audiences[i]['label'];
        aud['description'] = audiences[i]['description'];
        aud['displayList'] = [];
        aud['selectedAudience'] = [];
        aud['targetAudience'] = '';
        aud['audienceTitleName'] = 'Untitled';
        aud['dataVersion'] = 2020;
        aud['enableSave'] = true;
        aud['loader'] = true;
        format.push(aud);
      }
    }
    return format;
  }
  onCategoryChange(e) {
    const selected = e.value;
    const index = this.getCurrentTabIndex();
    const data = this.audiences[index];
    if (selected.label === '') {
      data.displayList = data.options[0].options;
    } else {
      const selectedCategory = data.options.find(item => item.label === selected.label);
      data.displayList = selectedCategory['options'];
    }
    if (data.searchQuery !== '') {
      this.flatTabSearch(data.searchQuery);
    }
  }
  private getCurrentTabIndex(): number {
    if (this.savedDataVersion === 2020) {
      return this.selectedAudienceTab - 1;
    }
    return this.selectedAudienceTab;
  }
  public getCurrentTabData() {
    return this.audiences[this.getCurrentTabIndex()];
  }
  public updateFilteredDataCurrentTab(filterData, index = null) {
    if (!index) {
      index = this.getCurrentTabIndex();
    }
    this.audiences[index]['filtered'] = [];
    if (filterData && filterData.length > 0) {
      this.audiences[index]['filtered'] = filterData;
    }
    this.audiences[index]['loader'] = false;
    this.cdRef.markForCheck();
  }
  public updateDataCurrentTab(r, index = null, savedAudience = {}) {
    if (!index) {
      index = this.getCurrentTabIndex();
    }
    const data = (this.audiences[index]) ? this.audiences[index] : {};
    if (data?.['tabType'] !== 'single') {
      data['selectedAudience'] = r.audienceFilter[0]
      ? r.audienceFilter[0]['options']
      : [];
    } else {
      data['selectedAudience'] = r.audienceFilter[0]?.options[0]
      ? r.audienceFilter[0]?.options?.[0]?.options
      : [];
    }
    data['targetAudience'] = r.targetAudienceKey;
    let title = '';
    if (data?.['tabType'] !== 'single') {
      data['displayList'] = r.catalog[0] ? r.catalog[0]['options'] : [];
      const flatten = this.flattenSelection(
        data['selectedAudience'],
        data['label']
      );
      data['flattenedAudienceKeys'] = flatten['flattenedAudienceKeys'];
      data['flattenedSelect'] = flatten['flattenedSelect'];
      title = flatten['flattenedSelect']
        .map((option) => option.subCategory + ' - ' + option.description)
        .join(', ');

      data['finalTargetAudience'] = {
        audience: r.targetAudienceKey,
        name: flatten['flattenedSelect']
          .map((option) => option.description)
          .join()
      };
    }
    if (typeof savedAudience['_id'] !== 'undefined') {
      data['currentAudienceId'] = savedAudience['_id'];
      data['audienceTitleName'] = savedAudience['title'];
    } else if (typeof data['currentAudienceId'] === 'undefined') {
      data['audienceTitleName'] = title ? title : 'Total Population 0+ yrs';
    }
    this.audiences[index] = data;
    this.cdRef.markForCheck();
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
      .getAudienceWithYear(this.savedDataVersion, params, true)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((result) => {
        data['selectedAudience']['targetAudienceKey'] =
          result['targetAudienceKey'];
        this.cdRef.markForCheck();
      });
    this.audiences[index] = data;
    this.cdRef.markForCheck();
  }
  onSelectMultipleOption(character, index = null) {
    if (!index) {
      index = this.getCurrentTabIndex();
    }
    const data = Helper.deepClone(this.audiences[index]);
    // delete this.audiences[index]['currentAudienceId'];
    const selectedAudience = data?.['selectedAudience'] || [];
    const audIndex = selectedAudience.findIndex((aud) => {
      return aud.tag === character.tag;
    });
    if (audIndex > -1) {
      selectedAudience.splice(audIndex, 1);
      this.audiences[index]['selectedAudience'] = selectedAudience;
      if (!data['currentAudienceId']) {
        if (selectedAudience.length === 1) {
          this.audiences[index]['audienceTitleName'] = selectedAudience[0].description;
        } else {
          this.audiences[index]['audienceTitleName'] = 'Untitled';
        }
      }
      this.cdRef.markForCheck();
    } else {
      const params = {};
      params['tags'] = character['tag'];
      params['catalog'] = data['label'];
      this.gettingDataFromAPI = true;
      this.audienceLoadedIndex++;
      this.targetAudienceService
        .getAudienceWithYear(this.savedDataVersion, params, true)
        .pipe(takeUntil(this.unSubscribe))
        .subscribe((result) => {
          character['targetAudienceKey'] = result['targetAudienceKey'];
          this.audiences[index]['selectedAudience'].push(character);
          if (!data['currentAudienceId']) {
            if (this.audiences[index]['selectedAudience'].length === 1) {
              this.audiences[index]['audienceTitleName'] = this.audiences[index]['selectedAudience'][0].description;
            } else {
              this.audiences[index]['audienceTitleName'] = 'Untitled';
            }
          }
          this.audienceLoadedIndex--;
          this.cdRef.markForCheck();
          this.isSelectionOver();
        });
    }
  }
  isSelectionOver() {
    if (this.audienceLoadedIndex <= 0) {
      this.gettingDataFromAPI = false;
      this.cdRef.markForCheck();
    }
  }
  checkIsSelected(option) {
    const index = this.getCurrentTabIndex();
    if (
      this.audiences[index] &&
      this.audiences[index]['selectedAudience'] &&
      Array.isArray(this.audiences[index]['selectedAudience'])
    ) {
      const matches = this.audiences[index]['selectedAudience'].filter(
        (v) => v.tag === option.tag
      );
      return matches.length > 0;
    } else {
      return false;
    }

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
        .getAudienceWithYear(this.savedDataVersion, params, true)
        .subscribe((result) => {
          if(this.selectionType === 'multiple') {
            data['selectedAudience'] = [{
              description: data['selectedAudience']['description'],
              tag: data['selectedAudience']['tag'],
              targetAudienceKey: result['targetAudienceKey']
            }];
          } else {
            data['selectedAudience']['targetAudienceKey'] =
            result['targetAudienceKey'];
          }
          this.audiences[index] = data;
          this.cdRef.markForCheck();
        });
    }
    this.cdRef.markForCheck();
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
                  .getAudienceWithYear(this.savedDataVersion, {
                    catalog: currentTab['label'],
                    tags: data
                  })
                  .subscribe(
                    (res) => {
                      this.updateDataCurrentTab(res);
                    },
                    (error) => {
                      this.showsAlertMessage('Some error occurred. Please try again');
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
    this.cdRef.markForCheck();
  }
  public trackBySavedAudience(index, item) {
    return item._id;
  }

  public trackAudienceInfo(index, item) {
    return index;
  }

  public track(index, item) {
    return index;
  }
  /**
   * This method is for tracking audience records having label as unique
   * @param index
   * @param item
   */
  public trackAudienceByLabel(index, item) {
    return item.label;
  }
  /**
   * This method is for tracking audience records having tag as unique
   * @param index
   * @param item
   */
  public trackAudienceByTag(index, item) {
    return item.tag;
  }

  private listenForClearFilters(){
    this.workspaceV3Service.clearScenarioFilters$.pipe(
      takeUntil(this.unSubscribe)
    ).subscribe(()=>{
      this.clearAll('clear');
      this.cdRef.markForCheck();
    })
  }
  public trackSelectedAudienceById(index, item) {
    return item.id;
  }
  public removeSelectedAudience(audience, index) {
    this.dialog
      .open(DeleteConfirmationDialogComponent, {
        width: '340px',
        height: '260px',
        panelClass: 'imx-mat-dialog'
      })
      .afterClosed()
      .pipe(filter((result) => result && result.action))
      .subscribe((result) => {
        this.selectedAudienceList.splice(index, 1);
        this.updateSelectedAudienceList.emit(this.selectedAudienceList);
      });
  }

  public isSelectedAudience(selectedAudience, type = "multiple" ) {
    if (type === 'multiple') {
      const selectedAudienceIndex = this.selectedTargets.findIndex((audience) => audience._id === selectedAudience._id)

      return selectedAudienceIndex > -1;
    } else {
      return this.selectedTarget._id === selectedAudience._id;
    }
  }
  private showsAlertMessage(msg) {
    const config = {
      duration: 5000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, 'DISMISS', config);
  }
  getAudiences() {
    this.targetAudienceService
      .getAudienceWithYear(this.savedDataVersion, {}, true)
      .subscribe((result) => {
        if (
          this.mod_permission?.features?.orderInventories?.status !== 'active'
        ) {
          this.audiences = this.getFormattedAudienceData(result.catalog).filter(
            (audience) => audience.label.toLowerCase() !== 'ads'
          );
        } else {
          this.audiences = this.getFormattedAudienceData(result.catalog);
        }
        const allowedTabs = this.mod_permission.features.gpAudience.tabs;
        this.audiences = this.audiences.filter((element) => allowedTabs.includes(element.label));
        const sessionFilter = this.targetAudienceService.getExploreSession();
        this.selectedAudienceTab =
          sessionFilter != null &&
          typeof sessionFilter.audienceTabPosition !== 'undefined'
            ? sessionFilter.audienceTabPosition
            : 0;
        this.cdRef.markForCheck();
        if (this.selectedAudienceTab === 0) {
          this.loadSavedAudiences(false);
        }
        this.setAudienceFromSession();
      });
  }
  openDataVersion() {
    this.isDataVersionOpen = !this.isDataVersionOpen;
  }
  onDataVersionChange(data) {
    this.selectedDataVersion = data.option.value;
  }
  applyDataVersionChange() {
    if (this.savedDataVersion !== this.selectedDataVersion) {
      this.savedDataVersion = this.selectedDataVersion;
      this.isDataVersionOpen = false;
      this.selectedAudienceTab = 0;
      this.getAudiences();
      if (this.savedDataVersion === 2020) {
        this.selectedAudienceTab = 1;
      }
      this.cdRef.markForCheck();
    } else {
      this.isDataVersionOpen = false;
    }
  }
}
