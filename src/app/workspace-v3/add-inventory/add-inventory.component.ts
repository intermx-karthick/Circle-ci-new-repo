import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
  ChangeDetectorRef,
  OnDestroy,
  ApplicationRef
} from '@angular/core';
import { ENTER, COMMA, SEMICOLON } from '@angular/cdk/keycodes';
import { FileUploadConfig } from '@interTypes/file-upload';
import {
  CSVService,
  InventoryService,
  AuthenticationService,
  LoaderService
} from '@shared/services';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { saveAs } from 'file-saver';
import {
  filter,
  map,
  takeUntil,
  switchMap,
  mergeMap,
  catchError,
  debounceTime,
  tap,
  startWith,
  distinctUntilChanged,
  concatMap, scan, withLatestFrom, combineLatest
} from 'rxjs/operators';
import { Helper } from 'app/classes';
import { INVENTORY_SAVING_LIMIT } from '@constants/inventory-limits';
import { ConvertPipe } from '@shared/pipes/convert.pipe';
import {BehaviorSubject, concat, forkJoin, Observable, of, Subject, throwError} from 'rxjs';
import { ScenarioDetails } from '@interTypes/scenario.response';
import { FormControl } from '@angular/forms';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { FiltersService } from '../../explore/filters/filters.service';
import { FieldsMappingComponent } from '@shared/components/fields-mapping/fields-mapping.component';
import { SelectMarketTypeDialogComponent } from '../select-market-type-dialog/select-market-type-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScenarioPlanTabLabels } from '@interTypes/enums';
import { SummaryPanelActionService } from '../summary-panel-action.service';
import { MatSelectionListChange } from '@angular/material/list';
@Component({
  selector: 'app-add-inventory',
  templateUrl: './add-inventory.component.html',
  styleUrls: ['./add-inventory.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CSVService]
})
export class AddInventoryComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  selectedTab = 0;
  public labels = this.workspaceV3Service.workSpaceLabels;
  selectedLabel = 'SPOT_IDs';
  public currentIdsType = '';
  public appliedFilters: any = {};
  public geoPanelIds: any = [];
  public operatorUnitIds: any = [];
  public operatorKeyCodes = [ENTER, COMMA, SEMICOLON];
  public fileUploadConfig: FileUploadConfig = {
    acceptMulitpleFiles: false,
    acceptedFormats: ['csv']
  };
  public packagesLoading = true;
  public inventorySearch: FormControl = new FormControl('');
  private inventoryPagination$ = new BehaviorSubject<number>(1);
  public totalInventorySetPages: number;
  public currentInventorySetPage: number;
  public inventories$: Observable<any[]> = null;
  public selectedInventoryOptionsCtrl: FormControl = new FormControl();
  public uploadFileData: any;
  closeAllExpansionPanel = false;
  @Input() public operators = [];
  @Input() public type;
  @Input() scenario = {} as ScenarioDetails;
  @Input() selectedPlanTab: string;
  @Output() public applyFilter = new EventEmitter();
  @Output() public closeFilter = new EventEmitter();
  @Output() public addInventoryFilter = new EventEmitter();
  @Output() public onOpenMediaAndPlacement = new EventEmitter();
  @Output() public onSelectInventorySet = new EventEmitter();
  @Output() public onSpotFilterChange = new EventEmitter();


  @Input() public includeType = 'dialog';

  @Input() inventoryPlanIDs = [];
  @Input() isOnlyOperatorFilter = false;
  public clientId: any;
  public customInventories: boolean;
  filterInventoryData: any;
  public showInventoryFilters = true;
  public hideOperatorFilter = true;
  @ViewChild('clearButton', { read: ElementRef }) clearButton: ElementRef;
  private unsubscribe$ = new Subject();
  fileFilterData: any;
  public clearAttachment$ = new Subject();
  @Input() tabType = 'MarketPlan';
  public isExpandMediaType = false;
  public disableTabPagination = false;
  isInvalidMediaAttribFrom = false;

  isInventoryFilterSelection = false;
  isspotIdsChanges = false;
  isOperatorIdsChanges = false;
  inventorySetChanges = false;

  initialFilterChanges = false;
  isFilterChanges = [];
  isLocationFilterChange = false;
  /** Operator input data */
  public operatorsData = {
    optionsData: [],
    selectedOptions: []
  };
  operatorExpansionPanelOpen = false;
  invalidGeoPanelIds: any;
  invalidOperatorPanelIds: any;
  validGeoPanelIds: any[];
  validOperatorPanelIds: any[];
  baseAudience = false;
  constructor(
    private csvService: CSVService,
    private dialog: MatDialog,
    private inventoryService: InventoryService,
    private convert: ConvertPipe,
    private auth: AuthenticationService,
    private workspaceV3Service: WorkspaceV3Service,
    private cdRef: ChangeDetectorRef,
    private filterService: FiltersService,
    private loaderService: LoaderService,
    public snackBar: MatSnackBar,
    private summaryPanelAction: SummaryPanelActionService
  ) {}

  ngOnInit(): void {
    this.getInventorySetsObservable$();
    this.listenForClearFilters();
    this.setPackages();
    const mod_permission = this.auth.getModuleAccess('explore');
    this.customInventories =
      mod_permission['features']?.['customInventories']['status'];
    this.initialFilterChanges = true;
    this.summaryPanelAction
      .deletePackage()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        const selectedOptions = this.selectedInventoryOptionsCtrl.value;
        const pindex = selectedOptions.findIndex(
          (p) => data['id'] === p['_id']
        );
        selectedOptions.splice(pindex, 1);
        this.setValueToInventorySets(selectedOptions);
      });

    this.summaryPanelAction
      .deleteSpotIDFilter()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        if(data) {
          this.geoPanelIds = [];
          this.operatorUnitIds = [];
          this.onSpotFilterChange.emit({});
        }
      });
    const themeSettings = JSON.parse(localStorage.getItem('themeSettings'));;
    this.baseAudience = themeSettings?.baseAudienceRequired ?? false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedPlanTab) {
      if (
        changes.selectedPlanTab.currentValue ===
        ScenarioPlanTabLabels.INVENTORY_PLAN
      ) {
        this.showInventoryFilters = true;
        this.setPackages();
        this.disableTabPagination = false;
        if(this.type === 'create') {
          this.hideOperatorFilter = true;
        } else {
          this.hideOperatorFilter = false;
        }
      } else {
        this.showInventoryFilters = false;
        this.selectedLabel = 'SELECT_ATTRIBUTES';
        this.disableTabPagination = true;
        if(this.type === 'create') {
          this.hideOperatorFilter = true;
        } else {
          this.hideOperatorFilter = false;
        }
      }
      this.cdRef.markForCheck();
    }
    this.setOperatorData();
  }

  onChipAdded(event){
    this.onSpotFilterChange.emit({
      type: 'spot',
      ids: this.geoPanelIds
    });
    if(event?.length){
      this.isspotIdsChanges = true;
    } else{
      this.isspotIdsChanges = false;
    }
  }
  onChipRemoved(item){
    if(this.invalidGeoPanelIds?.data) {
      const index1 = this.invalidGeoPanelIds.data.indexOf(item);
      if (index1 != -1) this.invalidGeoPanelIds.data.splice(index1, 1);
    }
    if(this.validGeoPanelIds) {
      const index2 = this.validGeoPanelIds.indexOf(item);
      if (index2 != -1)  this.validGeoPanelIds.splice(index2, 1);
    }
    this.cdRef.detectChanges();
  }
  onOperatorChipAdded(event){
    this.onSpotFilterChange.emit({
      type: 'operator',
      ids: this.operatorUnitIds
    });
    if(event?.length){
      this.isOperatorIdsChanges = true;
    }else{
      this.isOperatorIdsChanges = false;
    }
  }
  onOperatorChipRemoved(item){
    if(this.invalidOperatorPanelIds?.data) {
      const index1 = this.invalidOperatorPanelIds.data.indexOf(item);
      if (index1 != -1) this.invalidOperatorPanelIds.data.splice(index1, 1);
    }
    if(this.validOperatorPanelIds) {
      const index2 = this.validOperatorPanelIds.indexOf(item);
      if (index2 != -1) this.validOperatorPanelIds.splice(index2, 1);
    }
    this.cdRef.detectChanges();
  }
  clearAllGeoIds() {
    this.invalidGeoPanelIds = [];
    this.geoPanelIds = [];
    this.validGeoPanelIds = [];
    this.cdRef.detectChanges();
  }
  clearAllOperatorIds() {
    this.invalidOperatorPanelIds = [];
    this.operatorUnitIds = [];
    this.validOperatorPanelIds = [];
    this.cdRef.detectChanges();
  }

  ngAfterViewInit() {
    this.inventoryService.clearAll(this.clearButton.nativeElement);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private setOperatorData() {
    const selectAll = {
      id: 'all',
      name: 'Select All',
      count: 0,
      slno: ''
    };
    this.operatorsData.optionsData =  [];
    if (this.operators?.length > 0) {
      this.operatorsData.optionsData.push(selectAll);
      this.operators.map((selected) => {
        selected.id = selected.name;
        this.operatorsData.optionsData.push(selected);
      });
    }
    /* if (this.scenario?.operators === undefined) {
      this.operatorsData.selectedOptions = [{ id: 'all', name: 'Select All' }];
    } else */
    if (this.scenario?.operators?.data?.length > 0) {
      this.operatorsData.selectedOptions = this.scenario.operators.data.map(
        (operatorName) => {
          if (operatorName === 'all') {
            return { id: 'all', name: 'Select All' };
          } else {
            return { id: operatorName, name: operatorName };
          }
          
        }
      );
    } else {
      this.operatorsData.selectedOptions = [];
    }

    // For triggering changes in child comp
    this.operatorsData = Helper.deepClone(this.operatorsData);
  }
  public setPackages() {
    // TODO: Here after this won't work because the list is paginated, need to use a get API call to get the required data and set it here using hte package IDs.
    if (this.scenario?.package && this.scenario?.package.length > 0) {
      const selectedInventorySets$: Observable<any>[] = this.scenario
        .package.map(inventorySetId => {
        return this.workspaceV3Service.getInventorySetById(inventorySetId).pipe(
          map(res => {
            return res.packages ? res.packages : {};
          }),
          catchError(err => of({}))
        );
      });
      forkJoin(selectedInventorySets$).subscribe(res => {
        this.setValueToInventorySets(res);
      });
    }
  }
  public trackByPackage(id, item) {
    return item._id;
  }

  public compare(package1, package2) {
    return package1 && package2 && package1['_id'] === package2['_id'];
  }
  onSelectTab(event) {
    this.selectedTab = event?.index;
    this.selectedLabel = event?.tab?.ariaLabel;
    // The below is a fix for IMXUIPRD-2825, tab labels related issue. Don't remove
    // https://github.com/angular/components/issues/2236#issuecomment-370134509
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 20);
  }

  public sportsIdType(type) {
    this.currentIdsType = type;
  }

  uploadedFile(event) {
    this.uploadFileData = event;
  }

  public downloadSampleCSV() {
    this.csvService.getSampleCSV().subscribe(
      (res) => {
        saveAs(res.body, 'sample.csv');
      },
      (error) => {
        const data: ConfirmationDialog = {
          notifyMessage: true,
          confirmTitle: 'Error',
          messageText:
            'There is a problem generating the file. Please try again later.'
        };
        this.dialog.open(ConfirmationDialogComponent, {
          data: data,
          width: '450px'
        });
      }
    );
  }
  public loadMoreInventorySet() {
    if (this.currentInventorySetPage < this.totalInventorySetPages) {
      this.currentInventorySetPage += 1;
      this.inventoryPagination$.next(this.currentInventorySetPage);
      this.packagesLoading = true;
      this.cdRef.markForCheck();
    }
  }
  public getInventorySetsObservable$(): void {
    const search$ = this.inventorySearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith(''),
        tap(res => {
          this.inventoryPagination$.next(1);
          this.packagesLoading = true;
          this.cdRef.markForCheck();
        })
      );
    this.inventories$ = this.inventoryPagination$.pipe(
      debounceTime(400),
      withLatestFrom(search$),
      switchMap(([page, search]) => {
        return this.workspaceV3Service
          .getSavedInventorySets(search, page, 15)
          .pipe(map(response => {
            // setting up pagination limits.
            this.currentInventorySetPage = page;
            this.totalInventorySetPages = Math.ceil(response['pagination']['total'] / response['pagination']['perPage']);
            return response['results'] ? response['results'] : [];
          }),
            tap(res => {
              this.packagesLoading = false;
              this.cdRef.markForCheck();
            }));
      }),
      withLatestFrom(this.inventoryPagination$),
      scan((acc, [currentOptions, currOffset]) => currOffset === 1 ? currentOptions : [...acc, ...currentOptions], []),
    );
  }

  private resetAppliedFilters() {
    this.appliedFilters = {
      data: [],
      selected: null
    };
  }

  public onApply(): void {
    if (this.type === 'edit') {
      // this.applySpotIds();
      switch (this.selectedLabel) {
        case 'SPOT_IDs':
          this.applySpotIds();
          break;
        case 'INVENTORY_SET':
          this.applyInventorySet();
          break;
        case 'FILE':
          this.applyFile();
          break;
        case 'SELECT_ATTRIBUTES':
          this.applyFilterInventory();
          break;
        default:
          break;
      }
    } else {
      this.resetAppliedFilters();
      this.appliedFilters['customdata'] = [];
      switch (this.selectedLabel) {
        case 'SPOT_IDs':
          this.applySpotIds();
          break;
        case 'INVENTORY_SET':
          this.applyInventorySet();
          break;
        case 'FILE':
          this.applyFile();
          break;
        case 'SELECT_ATTRIBUTES':
          this.applyFilterInventory();
          break;
        default:
          break;
      }
    }
  }

  private applyFilterInventory() {
    this.appliedFilters['selected'] = 'filterInventory';
    this.appliedFilters['filterInventory'] = this.filterInventoryData;
    this.submitFilters();
  }

  public removeLocationEmit(event){
    if (
      this.isFilterChanges?.length < 2 &&
      !event?.length &&
      this.isLocationFilterChange
    ) {
       this.isInventoryFilterSelection = false;
       this.isLocationFilterChange = false;
    }
  }

  public applyInventoryFilter(event) {
    this.filterInventoryData = event;
    if (event?.mediaAttributes?.formValues){
      this.isInvalidMediaAttribFrom = event.mediaAttributes.mediaAttributeForm;
      this.filterInventoryData['mediaAttributes'] = event.mediaAttributes.formValues;
    }
    this.filterInventoryData['isInvalidMediaAttribFrom'] = this.isInvalidMediaAttribFrom;
    this.appliedFilters['selected'] = 'filterInventory';
    this.appliedFilters['filterInventory'] = this.filterInventoryData;

    this.addInventoryFilter.emit({
      filterData: {
        selectedFilters: this.appliedFilters,
        filterType: 'Inventory',
        inventoryFilters: this.filterInventoryData,
        fileData: this.fileFilterData // null
      }
    });
    // Apply button disable based on selection
    this.isFilterChanges = [];
    if(event){
      Object.keys(event).forEach(
              (key) => {
                switch (key) {
                  case 'mediaAttributes':
                    if(Object.keys(event?.['mediaAttributes']).length){
                      Object.keys(event?.['mediaAttributes']).forEach( value=>{
                        if(event?.['mediaAttributes'][value]){
                          this.isFilterChanges.push(true);
                        }
                      })
                    }
                    break;
                  case 'thresholds':
                   this.isFilterChanges.push(true);
                    break;
                  case 'location':
                    if(event?.['location']?.['data']?.length){
                      this.isFilterChanges.push(true);
                      this.isLocationFilterChange = true;
                    }
                    break;
                  case 'operator':
                    // (event?.['operator']?.['selectedOptions']?.length && event?.['operator']?.['selectedOptions']?.[0]?.['id'] !=='all') || 
                    if(event?.['operator']?.['operatorChanges']){
                      this.isFilterChanges.push(true);
                    }
                    break;
                  case 'mediaTypeFilters':
                    if(event?.['mediaTypeFilters']?.length){
                      this.isFilterChanges.push(true);
                    }
                    break;
                  default:
                    break;
                }
              }
            );

    }
    if(this.isFilterChanges?.length){
      this.isInventoryFilterSelection = true
    }else{
      this.isInventoryFilterSelection = false
    }
  }

  private applyFile() {
    if (!this.uploadFileData?.[0]?.fileFormData) {
      return;
    }
    this.appliedFilters['selected'] = 'file';
    this.appliedFilters['fileData'] = {};
    this.fileFilterData = {};
    this.fileFilterData['fileData'] = this.uploadFileData;
    let mappingsResultData;
    let validIds = [];
    let planPeriod: { start: string; end: string };
    this.workspaceV3Service
      .uploadSpotScheduleCSV(
        this.scenario['_id'],
        this.uploadFileData[0].fileFormData
      )
      .subscribe(
        (response) => {
          this.dialog
            .open(FieldsMappingComponent, {
              disableClose: true,
              panelClass:'custom-field-mapping',
              data: {
                dbFields: response['dbColumns'],
                fileHeaders: response['csvHeaders']
              }
            })
            .afterClosed()
            .pipe(
              filter((mappingsInfo) => mappingsInfo),
              switchMap((mappingsInfo) => {
                mappingsInfo.mappings = mappingsInfo.mappings.filter(
                  (value) => value.source_key
                );
                return this.workspaceV3Service
                  .updateCsvFieldsMapping(
                    this.scenario['_id'],
                    response['file'],
                    mappingsInfo
                  )
                  .pipe(
                    switchMap(
                      (mappingsResult) => {
                        mappingsResultData = mappingsResult;
                        validIds = mappingsResult?.data?.validIds || [];
                        planPeriod = mappingsResult?.data?.date;
                        let message = 'File Uploaded Successfully.';
                        if (mappingsResult['data']['validIds'].length) {
                          if (mappingsResult['data']['validIds'].length < 2) {
                            message =
                              'File Uploaded Successfully.<br><p class="spot-count"><span>' +
                              mappingsResult['data']['validIds'].length +
                              '</span> spot added</p>';
                          } else {
                            message =
                              'File Uploaded Successfully.<br><p class="spot-count"><span>' +
                              mappingsResult['data']['validIds'].length +
                              '</span> spots added</p>';
                          }
                        }
                        const data: ConfirmationDialog = {
                          notifyMessage: true,
                          confirmTitle: 'Success',
                          messageText: message
                        };
                        if (
                          mappingsResult['data'] &&
                          mappingsResult['data']['invalidIds'] &&
                          mappingsResult['data']['invalidIds'].length
                        ) {
                          data.messageText = '';
                          data.confirmDesc =
                            'File Uploaded Successfully. But some spots are invalid. Click on Download for Invalid ids CSV';
                          data.notifyMessage = false;
                          data.confirmButtonText = 'Download';
                          data.cancelButtonText = 'Cancel';
                          data.headerCloseIcon = false;
                        }
                        return this.dialog
                          .open(ConfirmationDialogComponent, {
                            disableClose: true,
                            data: data,
                            width: '450px'
                          })
                          .afterClosed()
                          .pipe(
                            switchMap((fileUploadRes) => {
                              if (fileUploadRes['action']) {
                                if (
                                  mappingsResultData['data'] &&
                                  mappingsResultData['data']['invalidIds'] &&
                                  mappingsResultData['data']['invalidIds']
                                    .length
                                ) {
                                  this.loaderService.display(true);
                                  this.downloadInvalidCsv(
                                    mappingsResultData['data']['invalidIds']
                                  );
                                }
                              }
                              return this.getFilteredMarkets(validIds);
                            }), catchError((error) => {
                              this.snackBar.open(
                                error?.error?.message ||
                                  'Oops! Something went wrong, please try again.',
                                'DISMISS',
                                {
                                  duration: 2000
                                });
                              return of(error);
                            })
                          );
                      }
                    ), catchError((error) => {
                      this.snackBar.open(
                        error?.error?.message ||
                          'Oops! Something went wrong, please try again.',
                        'DISMISS',
                        {
                          duration: 2000
                        });
                      return of(error);
                    })
                  );
              }), catchError((error) => {
                this.snackBar.open(
                  error?.error?.message ||
                    'Oops! Something went wrong, please try again.',
                  'DISMISS',
                  {
                    duration: 2000
                  }
                );
                return of(error);
              })
            )
            .subscribe((mappingsResult) => {
              if (mappingsResult?.summaries && mappingsResult?.marketType) {
                const marketData = this.getMarketsForIDs(
                  mappingsResult['summaries'],
                  mappingsResult['marketType']
                );
                this.appliedFilters['data'] = validIds;
                this.appliedFilters['marketData'] = marketData;
                this.appliedFilters['marketType'] = mappingsResult['marketType']['market_type'];
                this.appliedFilters['fileData'] = this.fileFilterData;
                if (planPeriod) {
                  this.fileFilterData['planPeriod'] = planPeriod;
                }
                if (this.inventoryPlanIDs !== null && this.inventoryPlanIDs.length > 0) {
                  this.getPermissionToOverideState('upload');
                } else {
                  this.clearAttachment$.next(true);
                  this.submitFilters();
                }
              }else if(mappingsResult?.cancelAutoAssign){
                // Cancel or Close auto-assign market
                this.appliedFilters['data'] = validIds;
                this.appliedFilters['fileData'] = this.fileFilterData;
                if (planPeriod) {
                  this.fileFilterData['planPeriod'] = planPeriod;
                }
                if (this.inventoryPlanIDs !== null && this.inventoryPlanIDs.length > 0) {
                  this.getPermissionToOverideState('upload');
                } else {
                  this.clearAttachment$.next(true);
                  this.submitFilters();
                }
              }
            });
        },
        (error) => {
          this.snackBar.open(
            error?.error?.message ||
              'Oops! Something went wrong, please try again.',
              'DISMISS',
            {
              duration: 2000
            }
          );
        }
      );
  }
  private getFilteredMarkets(validIds, idType = 'spot_id'): Observable<any> {
    return this.dialog
      .open(SelectMarketTypeDialogComponent, {
        disableClose: true,
        data: {},
        panelClass:'inventory-market-select-dialog'
      })
      .afterClosed()
      .pipe(
        mergeMap((marketTypeResult) => {
          if(marketTypeResult?.cancelAutoAssign){
            return of(marketTypeResult)
          }
          const marketTypeList = {
            market_type: marketTypeResult['market_type'],
            action: 'replace',
            individual: marketTypeResult['individual'],
            id_list: validIds
          };
          const filtersData = {
            id_type: idType,
            id_list: validIds,
            target_segment: '2032',
            summary_level_list: [marketTypeResult['market_type']],
            measures_required: false,
            status_type_name_list: ['*']
          };
          if (this.baseAudience) {
            filtersData['base_segment'] = '2032';
          }
          return this.inventoryService
            .getFilterData(filtersData, false)
            .pipe(
              map((summaries) => {
                const mappingsResult = {};
                mappingsResult['marketType'] = marketTypeResult;
                mappingsResult['summaries'] = summaries;
                return mappingsResult;
              }), catchError((error) => {
                this.snackBar.open('Oopss! Something went wrong, please try again.',
                  'DISMISS',
                  {
                    duration: 2000
                  }
                );
                return of(error);
              })
            );
        }), catchError((error) => {
          this.snackBar.open(
            error?.error?.message ||
              'Oops! Something went wrong, please try again.',
            'DISMISS',
            {
              duration: 2000
            }
          );
          return of(error);
        })

      );
  }

  private applySpotIds() {
    if (this.currentIdsType === 'geopathPanel') {
      this.appliedFilters['selected'] = 'geopathPanel';
      this.appliedFilters['data'] = Helper.deepClone(this.geoPanelIds);
    } else {
      this.appliedFilters['selected'] = 'operatorPanel';
      this.appliedFilters['data'] = Helper.deepClone(this.operatorUnitIds);
    }
    let idType = 'spot_id';
    if (this.appliedFilters['selected'] === 'operatorPanel') {
      idType = 'plant_frame_id';
    }
    const ids = this.appliedFilters['data'];
    const filtersData = {
      id_type: idType,
      id_list: ids,
      target_segment: '2032',
      measures_required: false,
      status_type_name_list: ['*']
    };
    if (this.baseAudience) {
      filtersData['base_segment'] = '2032';
    }
    return this.inventoryService
      .getInventoriesWithAllData(filtersData, false)
      .pipe(switchMap((inventories) => {
        const invaildIds =  inventories?.inventory_summary?.invalid_ids?.id_list ?? [];
        let message = '';
        if (idType === 'plant_frame_id') {
          const vaildIds = [];
          this.operatorUnitIds.forEach((id) => {
            if (!invaildIds.includes(id)) {
              vaildIds.push(id);
            }
          });
          this.validOperatorPanelIds = vaildIds;
          this.invalidOperatorPanelIds = { type: 'operatorPanelId', data: invaildIds};
          message = 'Some Operators IDs you’ve entered are invalid, please try again.'
        } else {
          const vaildIds = [];
          this.geoPanelIds.forEach((id) => {
            if (!invaildIds.includes(id)) {
              vaildIds.push(id);
            }
          });
          this.validGeoPanelIds = vaildIds;
          this.invalidGeoPanelIds = { type: 'geoPanelId', data: invaildIds};
          message = 'Some Geopath IDs you’ve entered are invalid, please try again.'
        }
        this.cdRef.markForCheck();
        if (invaildIds?.length > 0) {
          this.snackBar.open(
            message,
            'DISMISS', {
              duration: 2000
            });
          return of(null);
        } else {
          return this.getFilteredMarkets(ids, idType);
        }
      }))
      .pipe(filter((data) => data !== null))
      .subscribe((data) => {
        if(!data?.cancelAutoAssign){
          const marketData = this.getMarketsForIDs(
            data['summaries'],
            data['marketType']
          );
          this.appliedFilters['marketType'] = data['marketType']['market_type'];
          this.appliedFilters['marketData'] = marketData;
          this.appliedFilters['cancelAutoAssign'] = false;
        } else if (data?.cancelAutoAssign) {
          /* This to handle markets are removed from Targeted market if cancelled auto assign */
          this.appliedFilters['cancelAutoAssign'] = true;
        }
        if (this.inventoryPlanIDs !== null && this.inventoryPlanIDs.length > 0) {
          this.getPermissionToOverideState();
        } else {
          this.submitFilters();
        }
      },  (error) => {
        this.snackBar.open(
          error?.error?.message ||
            'Oops! Something went wrong, please try again.',
          'DISMISS',
          {
            duration: 2000
          });
      });
  }

  private applyInventorySet() {
    this.getGeoIdsFromSets(this.selectedInventoryOptionsCtrl.value);
    if (this.type === 'edit') {
      this.appliedFilters[
        'inventorySet'
      ] = this.selectedInventoryOptionsCtrl.value;
    } else {
      this.appliedFilters['selected'] = 'packagePanel';
      this.appliedFilters[
        'additionalData'
      ] = this.selectedInventoryOptionsCtrl.value;
    }
    const ids = this.appliedFilters['data'];
    const idType = 'spot_id';
    this.getFilteredMarkets(ids, idType).subscribe((marketDataResult) => {
      if(!marketDataResult?.cancelAutoAssign){
        const marketData = this.getMarketsForIDs(
        marketDataResult['summaries'],
        marketDataResult['marketType']
      );
      this.appliedFilters['marketType'] = marketDataResult['marketType']['market_type'];
      this.appliedFilters['marketData'] = marketData;
      }
      if (this.inventoryPlanIDs !== null && this.inventoryPlanIDs.length > 0) {
        this.getPermissionToOverideState();
      } else {
        this.submitFilters();
      }
    });
  }

  private getGeoIdsFromSets(inventorySets) {
    /**
     * One or more package panel can be selected, so we are looping over
     *
     */
    this.appliedFilters['customdata'] = [];
    this.appliedFilters['data'] = [];
    inventorySets?.map?.((item) => {
      /**
       * For each inventory we only need the geopanel ID, so we're
       * using a function to extract the ID as an array and we are
       * spreading it using the ... spread operator. Finally the
       * resulting array this.appliedFilters['data'] will be an array
       * of geopanel IDs from selected inventory sets
       */
      if (item) {
        const gp_ids = [];
        const custom_ids = [];
        item.inventory.map((inventory) => {
          if (inventory['type'] === 'geopathPanel') {
            gp_ids.push(inventory['id']);
          } else {
            custom_ids.push(inventory['id']);
          }
        });
        this.appliedFilters['data'].push(...gp_ids);
        if (
          this.customInventories &&
          item.client_id !== null &&
          Number(item.client_id) === Number(this.clientId)
        ) {
          this.appliedFilters['customdata'].push(...custom_ids);
        }
      }
    });
  }

  public submitFilters() {
    if (
      this.appliedFilters?.['selected'] === 'geopathPanel' &&
      this.appliedFilters?.['data']?.length
    ) {
      const ids = [];
      this.appliedFilters['data'].forEach((element) => {
        ids.push(parseInt(element));
      });
      this.appliedFilters['data'] = ids;
    }
    /*If operator spot IDs are selected, we need to get the spot ids from API before sending it to scenario.
    All features in scenario are written based on spot ids and sending back operator ids as is was a mistake. It won't work when you want to add to existing becuase GP API only supports one type of ids.*/
    if (
      this.appliedFilters?.['selected'] === 'operatorPanel' &&
      this.appliedFilters?.['data'].length
    ) {
      // make network call here and change the data then close dialogRef
      const filters = {
        operatorPanelIdList: this.appliedFilters['data']
      };
      const normalizedFilters = this.inventoryService.normalizeFilterDataNew(
        filters
      );
      this.inventoryService
        .getInventorySpotIds(normalizedFilters, false)
        .pipe(
          map((response) => {
            if (
              response?.inventory_summary?.pagination?.number_of_spots <
              INVENTORY_SAVING_LIMIT
            ) {
              if (response?.['inventory_summary']?.['frame_list']) {
                return response['inventory_summary']['frame_list'].flatMap(
                  (frame) => frame['spot_id_list']
                );
              } else {
                return [];
              }
            } else {
              const spotOverloadMessage: ConfirmationDialog = {
                notifyMessage: true,
                confirmTitle: 'Error',
                messageText: `Your operator spot ids have more than ${this.convert.transform(
                  INVENTORY_SAVING_LIMIT,
                  'ABBREVIATE'
                )} spots, ${this.labels.scenario[0]} is currently limited to ${this.convert.transform(
                  INVENTORY_SAVING_LIMIT,
                  'ABBREVIATE'
                )} inventories.`
              };
              this.dialog.open(ConfirmationDialogComponent, {
                data: spotOverloadMessage,
                width: '586px'
              });
              throwError('Too many spots or no spots found');
            }
          })
        )
        .subscribe((response) => {
          this.appliedFilters['selected'] = 'geopathPanel';
          this.appliedFilters['data'] = response;

          if (this.type === 'edit') {
            const data = {
              filterData: {
                selectedFilters: this.appliedFilters,
                filterType: 'Inventory',
                inventoryFilters: this.filterInventoryData,
                fileData: this.fileFilterData
              }
            };
            this.applyFilter.emit(data);
          } else {
            const data = {
              filterData: {
                selectedFilters: this.appliedFilters,
                filterType: 'Inventory'
              }
            };
            this.applyFilter.emit(data);
          }
        });
    } else {
      if (this.type === 'edit') {
        const data = {
          filterData: {
            selectedFilters: this.appliedFilters,
            filterType: this.selectedLabel !== 'SELECT_ATTRIBUTES'? 'Inventory' : 'InvetoryFilter',
            inventoryFilters: this.filterInventoryData,
            fileData: this.fileFilterData
          }
        };
        this.applyFilter.emit(data);
      } else {
        const data = {
          filterData: {
            selectedFilters: this.appliedFilters,
            filterType:
              this.selectedLabel !== 'SELECT_ATTRIBUTES'
                ? 'Inventory'
                : 'InvetoryFilter'
          }
        };
        this.applyFilter.emit(data);
      }
    }
  }

  public onClearAll() {
    if (this.type === 'edit') {
      this.workspaceV3Service.clearScenarioFilters$.next({clear: true});
    } else {
      this.resetAll();
    }
  }

  resetAll() {
    this.resetAppliedFilters();
    this.geoPanelIds = [];
    this.operatorUnitIds = [];
    this.setValueToInventorySets([]);
    this.cdRef.detectChanges();
    this.filterService.resetFilter('All');
  }

  private listenForClearFilters() {
    this.workspaceV3Service?.clearScenarioFilters$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.resetAll();
      });
  }

  getMarketsForIDs(summaries, marketSelection) {
    let marketData = [];
    let prefix = '';
    switch (marketSelection['market_type']) {
      case 'CBSA':
        prefix = 'CBSA';
        break;
      case 'County':
        prefix = 'CNTY';
        break;
      default:
    }
    summaries['summaries'].forEach((summary) => {
      marketData.push({
        id: prefix + summary['summarizes']['id'],
        name: summary['summarizes']['name']
      });
    });
    if (marketSelection['individual'] === false) {
      let marketName = marketData.map((data) => {
        return data.name;
      });
      marketName = marketName.filter((item, index) => {
        return marketName.indexOf(item) === index;
      });
      const marketDatas = [
        {
          id: '',
          name: marketName.join(),
          marketsGroup: marketData
        }
      ];
      // this.updateMarketByUpload(marketDatas);
      return marketDatas;
    } else {
      return marketData;
      // this.updateMarketByUpload(marketData);
    }
  }
  getPermissionToOverideState(type = 'inventory') {
    const data: ConfirmationDialog = {
      notifyMessage: false,
      headerCloseIcon: false,
      confirmDesc:
        'Do you want the uploaded data to be added with existing data or you want to replace existing?',
      confirmButtonText: 'Replace Existing',
      cancelButtonText: 'Add to Existing',
      secondayCancelBtnText: 'Cancel'
    };
    this.dialog
      .open(ConfirmationDialogComponent, {
        disableClose: true,
        data: data,
        width: '450px'
      })
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((response) => {
        if (response?.secondaryCancel) {
          return;
        }
        if (!response?.action) {
          const ids = Helper.deepClone(this.appliedFilters['data']).map((id) => Number(id));
          let inventoryPlanIDs = this.inventoryPlanIDs;
          if (this.inventoryPlanIDs === null) {
            inventoryPlanIDs = [];
          }
          ids.push(...inventoryPlanIDs);
          this.appliedFilters['data'] = Helper.deepClone(ids);
        }
        this.appliedFilters['data'] = this.appliedFilters['data'].filter(
          this.getUniqueValues
        );
        if (type === 'upload') {
          this.clearAttachment$.next(true);
        }
        this.submitFilters();
      });
  }
  private getUniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
  };
  public downloadInvalidCsv(invalidIds) {
    const idsArray = [];
    idsArray.push({ title: 'Spot Id' });
    invalidIds.forEach((id) => idsArray.push({ spot_id: id }));
    this.csvService
      .build([...idsArray], [], true)
      .download('invalid-spots', 'csv');
    this.loaderService.display(false);
  }
  // Close side nav filter in scenario plan page
  public onCloseFilter() {
    this.closeFilter.emit();
  }

  public onMedaiTypeExpand(event) {
    this.isExpandMediaType = event?.mediaPanel?._expanded;
    this.onOpenMediaAndPlacement.emit(event?.mediaPanel);
    if(event?.otherPanel?._expanded) {
      this.operatorExpansionPanelOpen = false;
      this.closeAllExpansionPanel = false;
    }
  }

  public onOperatorExpand(event) {
    this.closeAllExpansionPanel = true;
  }

  public onSelectingInventorySets(data: MatSelectionListChange) {
    const value = this.selectedInventoryOptionsCtrl.value;
    this.onSelectInventorySet.emit(value);
  }

  private setValueToInventorySets(value){
    this.selectedInventoryOptionsCtrl.setValue(value);
    this.onSelectInventorySet.emit(value);
    this.appliedFilters[
      'inventorySet'
    ] = this.selectedInventoryOptionsCtrl.value;
    this.addInventoryFilter.emit({
      filterData: {
        selectedFilters: this.appliedFilters,
        filterType: 'Inventory',
        inventoryFilters: this.filterInventoryData,
        fileData: this.fileFilterData // null
      }
    });
  }
  public applyOperators(data) {
    this.filterInventoryData['operator'] = data;
    this.applyInventoryFilter(this.filterInventoryData);
  }
}
