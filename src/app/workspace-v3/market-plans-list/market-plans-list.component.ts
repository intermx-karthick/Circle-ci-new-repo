import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  AfterViewChecked,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarketPlanService } from '../market-plan.service';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '@shared/services';
import {
  MarketPlanTargets,
  PlanViewState,
  ViewByType
} from '@interTypes/workspaceV2';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { CustomizeColumnComponent } from '@shared/components/customize-column/customize-column.component';
import { Helper } from 'app/classes';
import { EditPlanComponent } from '../edit-plan/edit-plan.component';
import { Subject } from 'rxjs';
import { ViewByFilter } from '@interTypes/enums';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';

@Component({
  selector: 'app-market-plans-list',
  templateUrl: './market-plans-list.component.html',
  styleUrls: ['./market-plans-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed, void',
        style({ height: '0px', minHeight: '0', display: 'none' })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
      transition(
        'expanded <=> void',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ]
})
export class MarketPlansListComponent
  implements OnInit, AfterViewChecked, OnDestroy {
  displayedColumns: string[] = [
    'MediaType',
    'Required/Total In Market',
    'Trp',
    'Reach',
    'Reach Net',
    'Frequency',
    'Target In-Market Imp',
    'Target Imp',
    'Total Imp',
    'actions'
  ];
  dataSource = new MatTableDataSource([]);
  isExpantedId: string;
  @Input() goalFormData: any;
  @Input() planData: any;
  @Input() isLoader: boolean;
  @Input() isCalculatingData: boolean;
  @Output() updateParentPlanTotal: EventEmitter<any> = new EventEmitter();
  @Output() updatePlansViewState: EventEmitter<any> = new EventEmitter();
  @Output() loaderStatus: EventEmitter<boolean> = new EventEmitter();
  @Input() public projectOwnerEmail;
  @Input() public userEmail;
  // This var is used for switching between view by Media and operator
  public selectedViewByType: ViewByType = ViewByFilter.MEDIA;
  public viewByTypes = ViewByFilter;
  @Input() public scenarioId: string;
  @Input() editPlan$: Subject<string>;
  @Input() updatePlan$: Subject<string>;
  @Input() plansViewState: PlanViewState[] = [];
  @Input() refresh$: Subject<any> = new Subject(); // using for inventory dialog close

  private unSubscribe$: Subject<void> = new Subject<void>();

  expandedElement: any | null;
  public rowEditId = '';
  private operatorData = [];
  private mediaTypeData = [];
  public selectedMediaTypes: any;
  public source = 'markettype';
  public isNoDataFound = false;
  public operatorModulePermission = false;
  private projectPermission: any;
  public customInventoryAllowed = false;
  public isExpandTabs = false;
  public isOperatorEmptyorAll = false;
  public locks = [];
  public updatedMediaTypes: any;
  public mediaTypeLable = [];
  public isSaveingPlan: any = null;
  public savingPlanInput = null;
  public updatedPlanId: any;
  public sortable = [];
  public duplicateDisplayedColumns: any;
  public hoveredIndex = null;
  public viewByFilter = ViewByFilter;
  public isViewByOptionsOpen = false;
  public viewByOverlayOrigin: CdkOverlayOrigin;

  constructor(
    private cdRef: ChangeDetectorRef,
    private marketPlanService: MarketPlanService,
    private activeRoute: ActivatedRoute,
    private auth: AuthenticationService,
    public dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    /** Getting Project module permission */
    this.projectPermission = this.auth.getModuleAccess('v3workspace');
    const explorePermissions = this.auth.getModuleAccess('explore');
    if (
      explorePermissions?.['features']?.['customInventories']?.['status'] ===
      'active'
    ) {
      this.customInventoryAllowed = true;
    }
    this.duplicateDisplayedColumns = [...this.displayedColumns];
    if (
      this.projectPermission['scenarios']['operators']['status'] === 'active'
    ) {
      this.operatorModulePermission = true;
    } else {
      this.operatorModulePermission = false;
    }
    const mediaTypeData = {};
    const operatorData = {};
    if (this.planData['query'] && this.planData['query']['mediaTypeFilters']) {
      this.selectedMediaTypes = [...this.planData['query']['mediaTypeFilters']];
    } else {
      this.selectedMediaTypes = [...this.planData['mediaTypes']];
    }
    this.marketPlanService
      .getTargetData()
      .subscribe((targetData: MarketPlanTargets) => {
        // Check to if operator is selected all or empty
        if (
          targetData.operators &&
          (targetData.operators.length < 1 ||
            targetData.operators[0] === 'all')
        ) {
          this.isOperatorEmptyorAll = true;
        } else {
          this.isOperatorEmptyorAll = false;
        }
      });
    if (this.planData['planData']?.['allocation_list']) {
      let effectiveReach = {};
      if (this.planData['query']) {
        effectiveReach =
          (this.planData['query']['goals']['effectiveReach'] &&
            Number(this.planData['query']['goals']['effectiveReach'])) ||
          0;
      }
      this.planData['planData']['allocation_list'].map(
        (plan, allocationIndex) => {
          if (
            (typeof plan['measures']['spots'] !== 'undefined' &&
              plan['measures']['spots'] !== null) ||
            (typeof plan['measures']['trp'] !== 'undefined' &&
              plan['measures']['trp'] !== null)
          ) {
            let mediaType = plan['media_type_group'][
              'frame_media_name_list'
            ].join(',');
            let mediaTypename = '';
            let currentMediaType = '';
            for (const element of this.selectedMediaTypes) {
              const material_medias = element['ids']['material_medias'];
              // && JSON.parse(JSON.stringify((element['ids']['material_medias'])))
              // || [];

              let medias_ids = []; // JSON.parse(JSON.stringify((element['ids']['medias'])));
              if (element['ids']['medias']) {
                medias_ids = Helper.deepClone(element['ids']['medias']);
              }
              if (element['ids']['material'] !== '' && material_medias && Array.isArray(material_medias)) {
                medias_ids.push(...material_medias);
              }
              let isMediaTypeMatched = false;
              if (
                !plan['media_type_group']['frame_media_name_list'] ||
                plan['media_type_group']['frame_media_name_list']
                  .sort()
                  .join(',') === medias_ids.sort().join(',')
              ) {
                isMediaTypeMatched = true;
              }
              let isClassificationTypeMatched = false;
              if (
                !plan['media_type_group']['classification_type_list'] ||
                plan['media_type_group']['classification_type_list']
                  .sort()
                  .join(',') === element['ids']['environments'].sort().join(',')
              ) {
                isClassificationTypeMatched = true;
              }
              let isConstructionTypeMatched = false;
              if (
                !plan['media_type_group']['construction_type_list'] ||
                plan['media_type_group']['construction_type_list']
                  .sort()
                  .join(',') === element['ids']['construction'].sort().join(',')
              ) {
                isConstructionTypeMatched = true;
              }
              let isMediaMatched = false;
              if (
                !plan['media_type_group']['media_type_list'] ||
                plan['media_type_group']['media_type_list'].sort().join(',') ===
                  element['ids']['mediaTypes'].sort().join(',')
              ) {
                isMediaMatched = true;
              }
              let isDigitalMatched = false;
              if (
                (element['ids']['material'] !== '' &&
                  element['ids']['material'] !== 'both' &&
                  !plan['media_type_group']['frame_media_name_list']) ||
                plan['media_type_group']['frame_media_name_list']
                  .sort()
                  .join(',') === medias_ids.sort().join(',')
              ) {
                isDigitalMatched = true;
              }
              if (
                isMediaTypeMatched &&
                isClassificationTypeMatched &&
                isConstructionTypeMatched &&
                isDigitalMatched &&
                isMediaMatched
              ) {
                mediaTypename = element['data'];
                currentMediaType = element;
                break;
              }
            }
            let operator = '';
            if (plan['media_type_group']['operator_name_list']) {
              operator = plan['media_type_group']['operator_name_list'][0];
            }

            let totalInMarketCount = this.getTotalMarketCount(
              plan['media_type_group'],
              this.planData['planData']['totalMarketInventoryInfo'],
              currentMediaType
            );

            let currentMediaTypeData;
            let currentMediaIndex;
            /* if (!this.operatorModulePermission || this.isOperatorEmptyorAll) {
            } */
            for (
              let i = 0;
              i <
              this.planData['planData']['summaries']['by_media_type_group']
                .length;
              i++
            ) {
              const element = this.planData['planData']['summaries'][
                'by_media_type_group'
              ][i];

              const material_medias =
                (currentMediaType['ids']?.['material_medias'] &&
                  Helper.deepClone(
                    currentMediaType['ids']['material_medias']
                  )) ||
                [];
              // const medias_ids = JSON.parse(JSON.stringify((currentMediaType['ids']['medias'])));

              const medias_ids = [];
              if (currentMediaType['ids']?.['medias']) {
                medias_ids.push(...currentMediaType['ids']['medias']);
              }

              if (
                currentMediaType['ids'] &&
                currentMediaType['ids']['material'] !== '' &&
                currentMediaType['ids']['material'] !== 'all'
              ) {
                medias_ids.push(...material_medias);
              }
              let isMediaTypeMatched = false;
              if (
                !element['media_type_group']['frame_media_name_list'] ||
                element['media_type_group']['frame_media_name_list']
                  .sort()
                  .join(',') === medias_ids.sort().join(',')
              ) {
                isMediaTypeMatched = true;
              }
              let isMediaMatched = false;
              if (
                !element['media_type_group']['media_type_list'] ||
                element['media_type_group']['media_type_list']
                  .sort()
                  .join(',') ===
                  currentMediaType['ids']['mediaTypes'].sort().join(',')
              ) {
                isMediaMatched = true;
              }

              let isClassificationTypeMatched = false;
              if (
                !element['media_type_group']['classification_type_list'] ||
                element['media_type_group']['classification_type_list']
                  .sort()
                  .join(',') ===
                  currentMediaType['ids']['environments'].sort().join(',')
              ) {
                isClassificationTypeMatched = true;
              }

              let isConstructionTypeMatched = false;
              if (
                !element['media_type_group']['construction_type_list'] ||
                element['media_type_group']['construction_type_list']
                  .sort()
                  .join(',') ===
                  currentMediaType['ids']['construction'].sort().join(',')
              ) {
                isConstructionTypeMatched = true;
              }
              let isDigitalMatched = false;
              if (
                (currentMediaType['ids'] &&
                  currentMediaType['ids']['material'] !== '' &&
                  currentMediaType['ids']['material'] !== 'both' &&
                  !element['media_type_group']['frame_media_name_list']) ||
                element['media_type_group']['frame_media_name_list']
                  .sort()
                  .join(',') === medias_ids.sort().join(',')
              ) {
                isDigitalMatched = true;
              }
              if (
                isMediaTypeMatched &&
                isClassificationTypeMatched &&
                isConstructionTypeMatched &&
                isDigitalMatched &&
                isMediaMatched
              ) {
                currentMediaTypeData = Helper.deepClone(element);
                currentMediaIndex = i;
                break;
              }
            }
            mediaType = mediaTypename;
            if (currentMediaTypeData) totalInMarketCount = totalInMarketCount || currentMediaTypeData?.measures?.spots;
            if (
              totalInMarketCount > 0 ||
              (typeof this.planData['query']['operators'] === 'undefined' &&
                currentMediaTypeData)
            ) {
              if (!mediaTypeData[mediaType]) {
                mediaTypeData[mediaType] = {
                  mediaType: mediaType,
                  mediaTypeLable: mediaTypename,
                  parent: mediaType,
                  trp: 0,
                  totalInMarket: 0,
                  spots: 0,
                  reach: 0,
                  reachNet: 0,
                  frequency: 0,
                  targetInMarketImp: 0,
                  targetImp: 0,
                  totalImp: 0,
                  data: [],
                  editable: true,
                  collapsed: true
                };
              }
              /* mediaTypeData[mediaType]['trp'] += plan['measures']['trp'];
            mediaTypeData[mediaType]['totalInMarket'] += totalInMarketCount;
            mediaTypeData[mediaType]['spots'] += plan['measures']['spots'];
            if (effectiveReach === 3) {
              mediaTypeData[mediaType]['reach'] += plan['measures']['eff_reach_pct'] && plan['measures']['eff_reach_pct'] || 0;
              mediaTypeData[mediaType]['frequency'] += plan['measures']['eff_freq_avg'] && plan['measures']['eff_freq_avg'] || 0;
            } else {
              mediaTypeData[mediaType]['reach'] += plan['measures']['reach_pct'] && plan['measures']['reach_pct'] || 0;
              mediaTypeData[mediaType]['frequency'] += plan['measures']['freq_avg'] && plan['measures']['freq_avg'] || 0;
            } */
              if (!currentMediaTypeData) {
                mediaTypeData[mediaType]['trp'] = '';
                mediaTypeData[mediaType]['totalInMarket'] += totalInMarketCount;
                mediaTypeData[mediaType]['spots'] = '';
                mediaTypeData[mediaType]['reach'] = '';
                mediaTypeData[mediaType]['reachNet'] = '';
                mediaTypeData[mediaType]['frequency'] = '';
                mediaTypeData[mediaType]['targetInMarketImp'] = '';
                mediaTypeData[mediaType]['targetImp'] = '';
                mediaTypeData[mediaType]['totalImp'] = '';
              } else {
                mediaTypeData[mediaType]['totalInMarket'] += totalInMarketCount;
                mediaTypeData[mediaType]['trp'] =
                  currentMediaTypeData['measures']['trp'];
                mediaTypeData[mediaType]['spots'] =
                  currentMediaTypeData['measures']['spots'];
                if (effectiveReach === 3) {
                  // tslint:disable-next-line:max-line-length
                  mediaTypeData[mediaType]['reach'] =
                    (currentMediaTypeData['measures']['eff_reach_pct'] &&
                      currentMediaTypeData['measures']['eff_reach_pct']) ||
                    0;

                  // tslint:disable-next-line:max-line-length
                  mediaTypeData[mediaType]['reachNet'] =
                    (currentMediaTypeData['measures']['eff_reach_net'] &&
                      currentMediaTypeData['measures']['eff_reach_net']) ||
                    0;

                  // tslint:disable-next-line:max-line-length
                  mediaTypeData[mediaType]['frequency'] =
                    (currentMediaTypeData['measures']['eff_freq_avg'] &&
                      currentMediaTypeData['measures']['eff_freq_avg']) ||
                    0;
                } else {
                  // tslint:disable-next-line:max-line-length
                  mediaTypeData[mediaType]['reach'] =
                    (currentMediaTypeData['measures']['reach_pct'] &&
                      currentMediaTypeData['measures']['reach_pct']) ||
                    0;

                  // tslint:disable-next-line:max-line-length
                  mediaTypeData[mediaType]['reachNet'] =
                    (currentMediaTypeData['measures']['reach_net'] &&
                      currentMediaTypeData['measures']['reach_net']) ||
                    0;

                  // tslint:disable-next-line:max-line-length
                  mediaTypeData[mediaType]['frequency'] =
                    (currentMediaTypeData['measures']['freq_avg'] &&
                      currentMediaTypeData['measures']['freq_avg']) ||
                    0;
                }
                mediaTypeData[mediaType]['targetInMarketImp'] =
                  currentMediaTypeData['measures']['imp_target_inmkt'];
                mediaTypeData[mediaType]['targetImp'] =
                  currentMediaTypeData['measures']['imp_target'];
                mediaTypeData[mediaType]['totalImp'] =
                  currentMediaTypeData['measures']['imp'];
              }

              mediaTypeData[mediaType]['id'] = this.planData['id'];
              mediaTypeData[mediaType]['allocationIndex'] = allocationIndex;

              if (!this.operatorModulePermission || this.isOperatorEmptyorAll) {
                /* mediaTypeData[mediaType]['trp'] = currentMediaTypeData['measures']['trp'];
              mediaTypeData[mediaType]['spots'] = currentMediaTypeData['measures']['spots']; */
                mediaTypeData[mediaType]['mediaTypeIndex'] = currentMediaIndex;
                /** If spots value zero , add null to reach & frequency */
                if (
                  currentMediaTypeData &&
                  currentMediaTypeData['measures']['spots'] === 0
                ) {
                  mediaTypeData[mediaType]['reach'] = null;
                  mediaTypeData[mediaType]['reachNet'] = null;
                  mediaTypeData[mediaType]['frequency'] = null;
                  mediaTypeData[mediaType]['targetInMarketImp'] = null;
                  mediaTypeData[mediaType]['targetImp'] = null;
                  mediaTypeData[mediaType]['totalImp'] = null;
                }
              }
              if (typeof this.planData['query']['operators'] === 'undefined') {
                this.filterMarketsInventorynfo(plan['media_type_group'], this.planData.planData.totalMarketInventoryInfo, currentMediaType).map((pl) => {
                  if (pl) {
                    const oppIndex = mediaTypeData[mediaType]['data'].findIndex(
                      (opp) => opp.mediaType === pl['operator']
                    );
                    if (oppIndex > -1) {
                      mediaTypeData[mediaType]['data'][oppIndex][
                        'totalInMarket'
                      ] += pl['spots'];
                    } else {
                      mediaTypeData[mediaType]['data'].push({
                        mediaType: pl['operator'],
                        mediaTypeLable: pl['operator'],
                        parent: mediaType,
                        totalInMarket: pl['spots'],
                        spots: null,
                        trp: null,
                        reach: null,
                        reachNet: null,
                        frequency: null,
                        targetInMarketImp: null,
                        targetImp: null,
                        totalImp: null,
                        id: this.planData['id'],
                        allocationIndex: allocationIndex,
                        editable: false,
                        collapsed: false
                      });
                    }
                    // mediaTypeData[mediaType]['totalInMarket'] += pl['spots'];
                  }
                });
              } else {
                mediaTypeData[mediaType]['data'].push({
                  mediaType: operator,
                  mediaTypeLable: operator,
                  parent: mediaType,
                  totalInMarket: totalInMarketCount,
                  spots:
                    (this.operatorModulePermission &&
                      plan['measures']['spots']) ||
                    null,
                  trp:
                    (this.operatorModulePermission &&
                      plan['measures']['trp']) ||
                    null,
                  // tslint:disable-next-line:max-line-length
                  reach:
                    effectiveReach === 3
                      ? (this.operatorModulePermission &&
                          plan['measures']['eff_reach_pct']) ||
                        null
                      : (this.operatorModulePermission &&
                          plan['measures']['reach_pct']) ||
                        null,

                  // tslint:disable-next-line:max-line-length
                  reachNet:
                    effectiveReach === 3
                      ? (this.operatorModulePermission &&
                          plan['measures']['eff_reach_net']) ||
                        null
                      : (this.operatorModulePermission &&
                          plan['measures']['reach_net']) ||
                        null,

                  // tslint:disable-next-line:max-line-length
                  frequency:
                    effectiveReach === 3
                      ? (this.operatorModulePermission &&
                          plan['measures']['eff_freq_avg']) ||
                        null
                      : (this.operatorModulePermission &&
                          plan['measures']['freq_avg']) ||
                        null,
                  targetInMarketImp:
                    (this.operatorModulePermission &&
                      plan['measures']['imp_target_inmkt']) ||
                    null,
                  targetImp:
                    (this.operatorModulePermission &&
                      plan['measures']['imp_target']) ||
                    null,
                  totalImp:
                    (this.operatorModulePermission &&
                      plan['measures']['imp']) ||
                    null,
                  id: this.planData['id'],
                  allocationIndex: allocationIndex,
                  editable: (this.operatorModulePermission && true) || false,
                  collapsed: false
                });
                /** If operator available media type is editable false */
                mediaTypeData[mediaType]['editable'] = false;

                if (
                  (!this.operatorModulePermission ||
                    this.isOperatorEmptyorAll) &&
                  currentMediaTypeData
                ) {
                  mediaTypeData[mediaType]['editable'] = true;
                }
              }
              if (typeof this.planData['query']['operators'] === 'undefined') {
                this.filterMarketsInventorynfo(plan['media_type_group'], this.planData.planData.totalMarketInventoryInfo, currentMediaType).map((pl) => {
                  if (pl && !operatorData[pl['operator']]) {
                    operatorData[pl['operator']] = {
                      mediaType: pl['operator'],
                      mediaTypeLable: pl['operator'],
                      parent: pl['operator'],
                      totalInMarket: 0,
                      trp: 0,
                      spots: 0,
                      reach: 0,
                      reachNet: 0,
                      frequency: 0,
                      targetInMarketImp: 0,
                      targetImp: 0,
                      totalImp: 0,
                      data: [],
                      editable: false,
                      collapsed: false
                    };
                  }
                  if (pl) {
                    operatorData[pl['operator']]['totalInMarket'] +=
                      pl['spots'];
                    const oppIndex = operatorData[pl['operator']][
                      'data'
                    ].findIndex(
                      (mTypeData) => mTypeData.mediaType === mediaType
                    );
                    if (oppIndex > -1) {
                      operatorData[pl['operator']]['data'][oppIndex][
                        'totalInMarket'
                      ] += pl['spots'];
                    } else {
                      operatorData[pl['operator']]['data'].push({
                        mediaType: mediaType,
                        mediaTypeLable: mediaTypename,
                        parent: pl['operator'],
                        totalInMarket: pl['spots'],
                        spots: null,
                        trp: null,
                        reach: null,
                        reachNet: null,
                        frequency: null,
                        targetInMarketImp: null,
                        targetImp: null,
                        totalImp: null,
                        id: this.planData['id'],
                        allocationIndex: allocationIndex,
                        editable: false,
                        collapsed: false
                      });
                    }
                  }
                });
              } else {
                const by_operator = Helper.deepClone(
                  this.planData['planData']['summaries']['by_operator']
                );
                if (!operatorData[operator]) {
                  operatorData[operator] = {
                    mediaType: operator,
                    mediaTypeLable: operator,
                    parent: operator,
                    totalInMarket: 0,
                    trp: 0,
                    spots: 0,
                    reach: 0,
                    reachNet: 0,
                    frequency: 0,
                    targetInMarketImp: 0,
                    targetImp: 0,
                    totalImp: 0,
                    data: [],
                    editable: true,
                    collapsed: false
                  };
                }
                let currentOperatorData;
                /* if (!this.operatorModulePermission || this.isOperatorEmptyorAll) {
              } */
                for (let i = 0; i < by_operator.length; i++) {
                  const element = by_operator[i];
                  let isOperatorTypeMatched = false;
                  if (
                    !element['media_type_group']['operator_name_list'] ||
                    element['media_type_group']['operator_name_list']
                      .sort()
                      .join(',') === operator
                  ) {
                    isOperatorTypeMatched = true;
                  }
                  if (isOperatorTypeMatched) {
                    currentOperatorData = element;
                    break;
                  }
                }
                if (!currentOperatorData) {
                  operatorData[operator]['trp'] = 0;
                  operatorData[operator]['totalInMarket'] += totalInMarketCount;
                  operatorData[operator]['spots'] = 0;
                  operatorData[operator]['reach'] = 0;
                  operatorData[operator]['reachNet'] = 0;
                  operatorData[operator]['frequency'] = 0;
                  operatorData[operator]['targetInMarketImp'] = 0;
                  operatorData[operator]['targetImp'] = 0;
                  operatorData[operator]['totalImp'] = 0;
                } else {
                  operatorData[operator]['trp'] =
                    currentOperatorData['measures'] &&
                    currentOperatorData['measures']['trp'];
                  operatorData[operator]['totalInMarket'] += totalInMarketCount;
                  operatorData[operator]['spots'] =
                    currentOperatorData['measures']['spots'];
                  if (effectiveReach === 3) {
                    operatorData[operator]['reach'] =
                      (currentOperatorData['measures']['eff_reach_pct'] &&
                        currentOperatorData['measures']['eff_reach_pct']) ||
                      0;

                    operatorData[operator]['reachNet'] =
                      (currentOperatorData['measures']['eff_reach_net'] &&
                        currentOperatorData['measures']['eff_reach_net']) ||
                      0;

                    operatorData[operator]['frequency'] =
                      (currentOperatorData['measures']['eff_freq_avg'] &&
                        currentOperatorData['measures']['eff_freq_avg']) ||
                      0;
                  } else {
                    operatorData[operator]['reach'] =
                      (currentOperatorData['measures']['reach_pct'] &&
                        currentOperatorData['measures']['reach_pct']) ||
                      0;

                    operatorData[operator]['reachNet'] =
                      (currentOperatorData['measures']['reach_net'] &&
                        currentOperatorData['measures']['reach_net']) ||
                      0;

                    operatorData[operator]['frequency'] =
                      (currentOperatorData['measures']['freq_avg'] &&
                        currentOperatorData['measures']['freq_avg']) ||
                      0;
                  }
                }
                operatorData[operator]['targetInMarketImp'] =
                  (currentOperatorData['measures']['imp_target_inmkt'] &&
                    currentOperatorData['measures']['imp_target_inmkt']) ||
                  0;
                operatorData[operator]['targetImp'] =
                  (currentOperatorData['measures']['imp_target'] &&
                    currentOperatorData['measures']['imp_target']) ||
                  0;
                operatorData[operator]['totalImp'] =
                  (currentOperatorData['measures']['imp'] &&
                    currentOperatorData['measures']['imp']) ||
                  0;

                /* operatorData[operator]['trp'] += plan['measures']['trp'];
              operatorData[operator]['totalInMarket'] += totalInMarketCount;
              operatorData[operator]['spots'] += plan['measures']['spots'];
              if (effectiveReach === 3) {
                operatorData[operator]['reach'] += plan['measures']['eff_reach_pct'] && plan['measures']['eff_reach_pct'] || 0;
                operatorData[operator]['frequency'] += plan['measures']['eff_freq_avg'] && plan['measures']['eff_freq_avg'] || 0;
              } else {
                operatorData[operator]['reach'] += plan['measures']['reach_pct'] && plan['measures']['reach_pct'] || 0;
                operatorData[operator]['frequency'] += plan['measures']['freq_avg'] && plan['measures']['freq_avg'] || 0;
              } */
                operatorData[operator]['id'] = this.planData['id'];
                operatorData[operator]['allocationIndex'] = allocationIndex;
                if (this.isOperatorEmptyorAll) {
                  mediaTypeData[mediaType]['collapsed'] = true;
                  operatorData[operator]['collapsed'] = true;
                }
                operatorData[operator]['data'].push({
                  mediaType: mediaType,
                  mediaTypeLable: mediaTypename,
                  parent: operator,
                  totalInMarket: totalInMarketCount,
                  spots: plan['measures']['spots'],
                  trp: plan['measures']['trp'],
                  reach:
                    effectiveReach === 3
                      ? plan['measures']['eff_reach_pct']
                      : plan['measures']['reach_pct'],
                  reachNet:
                    effectiveReach === 3
                      ? plan['measures']['eff_reach_net']
                      : plan['measures']['reach_net'],
                  frequency:
                    effectiveReach === 3
                      ? plan['measures']['eff_freq_avg']
                      : plan['measures']['freq_avg'],
                  targetInMarketImp: plan['measures']['imp_target_inmkt'],
                  targetImp: plan['measures']['imp_target'],
                  totalImp: plan['measures']['imp'],
                  id: this.planData['id'],
                  allocationIndex: allocationIndex,
                  editable: true
                });
                /** If operator available media type is editable false */
                operatorData[operator]['editable'] = false;
              }
            }
          } // If spots is null or 0 close condition
        }
      );
    }
    Object.keys(mediaTypeData).forEach((media) => {
      mediaTypeData[media]['data'].sort((a, b) => {
        if (a.totalInMarket > b.totalInMarket) {
          return -1;
        }
        if (a.totalInMarket < b.totalInMarket) {
          return 1;
        }
        return 0;
      });
    });
    Object.keys(operatorData).forEach((op) => {
      operatorData[op]['data'].sort((a, b) => {
        if (a.totalInMarket > b.totalInMarket) {
          return -1;
        }
        if (a.totalInMarket < b.totalInMarket) {
          return 1;
        }
        return 0;
      });
    });

    this.mediaTypeData = Object.keys(mediaTypeData).map((key) => {
      return mediaTypeData[key];
    });
    this.operatorData = Object.keys(operatorData).map((key) => {
      return operatorData[key];
    });
    const mediaTypeDataDummy = [];
    this.mediaTypeData.map((medias, i) => {
      if (medias['totalInMarket'] > 0) {
        mediaTypeDataDummy.push(medias);
      }
    });
    this.mediaTypeData = mediaTypeDataDummy;

    // Checking and updating the source based on viewBy Media or Operator
    const planViewstate = this.plansViewState.find(
      (viewState) => viewState.planId === this.planData['id']
    );
    if (planViewstate) {
      this.onViewBY(planViewstate.viewBy);
    } else {
      this.dataSource.data = [...this.mediaTypeData];
    }
    this.updatedMediaTypes = this.marketPlanService.getUpdatedMediaType();
    if (this.selectedViewByType === this.viewByFilter.MEDIA) {
      this.dataSource.data.forEach((data) => {
        if (this.updatedMediaTypes.id === data.id) {
          this.updatedMediaTypes.mediaTypeLable.forEach((data1) => {
            if (data1 === data.mediaTypeLable) {
              data.collapsed = false;
            }
          });
        }
      });
    }
    if (this.dataSource.data.length < 1) {
      this.isNoDataFound = true;
    } else {
      this.isNoDataFound = false;
    }

    this.editPlan$.pipe(takeUntil(this.unSubscribe$)).subscribe((planId) => {
      if (planId && planId === this.planData['id']) {
        this.editPlan();
      }
    });
    this.updatePlan$.pipe(takeUntil(this.unSubscribe$)).subscribe((planId) => {
      if (planId && planId === this.planData['id']) {
        this.onUpdateMediaType();
      }
    });
  }

  private checkMediaPresence(mediaGroup, inventoryGroup) {
    return (
      mediaGroup['frame_media_name_list']?.includes(inventoryGroup['media']) ||
      mediaGroup['media_type_list']?.includes(inventoryGroup['mediaType']) ||
      mediaGroup['classification_type_list']?.includes(
        inventoryGroup['classificationType']
      ) ||
      mediaGroup['operator_name_list']?.includes(inventoryGroup['operator']) ||
      mediaGroup['construction_type_list']?.includes(
        inventoryGroup['constructionType']
      )
    );
  }

  /**
   * This method is to get total inventory count based on selected market, operator and mediatype
   * @param planMediaGroup mediagroup info from plan
   * @param totalMarketInventoryInfo This is data regarding the totalmarkets counts which we gettting from Geopath Summary API
   * @param mediaFilter current mediaFilter group(from loop) from selected Media fitler groups
   */

  private getTotalMarketCount(
    planMediaGroup,
    totalMarketInventoryInfo,
    mediaFilter
  ) {
    if (!totalMarketInventoryInfo) {
      return 0;
    }
    let totalMarketInventoryDetails = Helper.deepClone(
      totalMarketInventoryInfo
    );
    // Filter by Operator
    if (planMediaGroup?.['operator_name_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['operator_name_list'].includes(info.operator)
      );
    }
    // Filter by Digital or Non digital inventory
    if (
      planMediaGroup['digital'] !== null &&
      mediaFilter['selection']?.['material'] &&
      mediaFilter['ids']['material'] !== 'both' &&
      mediaFilter['ids']['material'] !== ''
    ) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter(
        (info) => info.digital === (mediaFilter['ids']['material'] === 'true')
      );
    }
    // Filter by Media types
    if (planMediaGroup?.['media_type_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['media_type_list'].includes(info.mediaType)
      );
    }
    // Filter by Classification types
    if (planMediaGroup?.['classification_type_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['classification_type_list'].includes(
          info.classificationType
        )
      );
    }

    // Filter by Construction Type'
    if (planMediaGroup?.['construction_type_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['construction_type_list'].includes(info.constructionType)
      );
    }
    // Filter by Frame Media
    if (planMediaGroup?.['frame_media_name_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['frame_media_name_list'].includes(info.media)
      );
    }
    return totalMarketInventoryDetails.reduce(
      (totalCount, info) => totalCount + info.spots,
      0
    );
  }

  private filterMarketsInventorynfo(
    planMediaGroup,
    totalMarketInventoryInfo,
    mediaFilter
  ) {
    if (!totalMarketInventoryInfo) {
      return [];
    }
    let totalMarketInventoryDetails = Helper.deepClone(
      totalMarketInventoryInfo
    );
    // Filter by Operator
    if (planMediaGroup?.['operator_name_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['operator_name_list'].includes(info.operator)
      );
    }

    // Filter by Digital or Non digital inventory
    if (
      mediaFilter['selection']?.['material'] &&
      mediaFilter['ids']['material'] !== 'both' &&
      mediaFilter['ids']['material'] !== ''
    ) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter(
        (info) => info.digital === (mediaFilter['ids']['material'] === 'true')
      );
    }
    // Filter by Media types
    if (planMediaGroup?.['media_type_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['media_type_list'].includes(info.mediaType)
      );
    }
    // Filter by Classification types
    if (planMediaGroup?.['classification_type_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['classification_type_list'].includes(
          info.classificationType
        )
      );
    }

    // Filter by Construction Type'
    if (planMediaGroup?.['construction_type_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['construction_type_list'].includes(info.constructionType)
      );
    }
    // Filter by Frame Media
    if (planMediaGroup?.['frame_media_name_list']?.length) {
      totalMarketInventoryDetails = totalMarketInventoryDetails.filter((info) =>
        planMediaGroup['frame_media_name_list'].includes(info.media)
      );
    }
    return totalMarketInventoryDetails;
  }
  updateSelectedMediaType(mediaType) {
    this.selectedMediaTypes = mediaType;
    let selectMediaTypes = [];
    selectMediaTypes = mediaType;
    const setData = {
      id: this.dataSource.data[0].id,
      matchedMediaTypes: this.mediaTypesComparsion(
        selectMediaTypes,
        this.dataSource.data
      )
    };
    // this.marketPlanService.setUpdatedMediaType(setData);
  }

  mediaTypesComparsion(arr1, arr2) {
    const finalArray = [];
    arr1.forEach((e1) =>
      arr2.forEach((e2) => {
        if (e1.data === e2.mediaTypeLable) {
          finalArray.push(e1.data);
        }
      })
    );
    return finalArray;
  }

  onViewBY(selectedViewByType) {
    this.selectedViewByType = selectedViewByType;
    if (this.selectedViewByType === this.viewByFilter.MEDIA) {
      this.dataSource.data = [];
      this.dataSource.data = [...this.mediaTypeData];
    } else {
      this.dataSource.data = [];
      this.dataSource.data = [...this.operatorData];
    }
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }
  onUpdateMediaType() {
    if (this.selectedMediaTypes?.length < 1) {
      this.snackBar.open(
        `Please select atleast one media type in this plan.`,
        'DISMISS',
        {
          duration: 2000
        }
      );
      return true;
    }
    let locks = [];
    if (this.locks && this.locks.length > 0) {
      locks = this.locks;
    } else if (this.planData['query'] && this.planData['query']['locks']) {
      locks = this.planData['query']['locks'];
    }
    this.isLoader = true;
    this.loaderStatus.emit(true); // emit - to handle loader and export button 
    const updatePlan = {
      query: {
        audience: this.planData['query']['audience'],
        market: this.planData['query']['market'],
        goals: this.goalFormData,
        mediaTypeFilters: this.selectedMediaTypes,
        operators: this.planData['query']['operators'],
        locks: locks,
        measureRangeFilters: this.planData['query']['measureRangeFilters']
      }
    };
    if (
      this.planData['query']['operators'] !== undefined &&
      !this.operatorModulePermission
    ) {
      // || this.isOperatorEmptyorAll
      delete updatePlan['query']['operators'];
    }
    this.marketPlanService.updatePlansFromGP(
      updatePlan,
      this.scenarioId,
      this.planData['id']
    );
  }

  onEditFieldValue(value, element, field) {
    let lockFlag = true;
    let locks = [];
    const lock = {
      allocationIndex: element.allocationIndex,
      field: field,
      value: value,
      mediaTypeIndex: element.mediaTypeIndex
    };
    if (
      element.id === this.planData['id'] &&
      this.scenarioId &&
      element.mediaTypeIndex >= 0
    ) {
      this.isSaveingPlan = element;
      this.savingPlanInput = field;
      const allocation = this.planData['planData']['summaries'][
        'by_media_type_group'
      ][element.mediaTypeIndex];
      allocation['measures']['spots'] = null;
      allocation['measures']['trp'] = null;
      allocation['measures']['reach_pct'] = null;
      allocation['measures']['freq_avg'] = null;
      allocation['measures']['eff_reach_pct'] = null;
      allocation['measures']['eff_freq_avg'] = null;
      allocation['measures']['reach_net'] = null;
      allocation['measures']['eff_reach_net'] = null;
      allocation['measures']['imp_target_inmkt'] = null;

      allocation['measures'][field] = Number(value);
      this.planData['planData']['summaries']['by_media_type_group'][
        element.mediaTypeIndex
      ] = allocation;
      if (allocation['media_type_group']) {
        lock['frame_media_name_list'] =
          allocation['media_type_group']['frame_media_name_list'] !== null
            ? allocation['media_type_group']['frame_media_name_list']
            : [];
        lock['operator_name_list'] =
          allocation['media_type_group']['operator_name_list'] !== null
            ? allocation['media_type_group']['operator_name_list']
            : [];
        lock['classification_type_list'] =
          allocation['media_type_group']['classification_type_list'] !== null
            ? allocation['media_type_group']['classification_type_list']
            : [];
        lock['construction_type_list'] =
          allocation['media_type_group']['construction_type_list'] !== null
            ? allocation['media_type_group']['construction_type_list']
            : [];
        lock['media_type_list'] =
          allocation['media_type_group']['media_type_list'] !== null
            ? allocation['media_type_group']['media_type_list']
            : [];
      }
      if (typeof this.planData['query']['locks'] !== 'undefined') {
        locks = this.planData['query']['locks'];
      }

      // Update my plan list TRP Frequency and reach

      const summary = this.planData['planData']['summaries'];
      summary['total']['measures']['trp'] = null;
      summary['total']['measures']['reach_pct'] = null;
      summary['total']['measures']['reach_net'] = null;
      summary['total']['measures']['freq_avg'] = null;
      summary['total']['measures']['eff_reach_pct'] = null;
      summary['total']['measures']['eff_freq_avg'] = null;
      summary['total']['measures']['eff_reach_net'] = null;
      summary['total']['measures']['imp_target_inmkt'] = null;

      this.planData['planData']['summaries'] = summary;
      locks.map((lck) => {
        if (
          this.compare(
            lock['frame_media_name_list'],
            lck['frame_media_name_list']
          ) &&
          this.compare(lock['media_type_list'], lck['media_type_list']) &&
          this.compare(
            lock['classification_type_list'],
            lck['classification_type_list']
          ) &&
          this.compare(
            lock['construction_type_list'],
            lck['construction_type_list']
          )
        ) {
          lck['field'] = lock['field'];
          lck['value'] = lock['value'];
          lck['mediaTypeIndex'] = element.mediaTypeIndex;
          lockFlag = false;
        }
      });
      if (lockFlag) {
        locks.push(lock);
      }

      this.planData['query']['locks'] = locks;

      this.planData['query']['mediaTypeFilters'].map((m, i) => {
        if (m['data'] === element['mediaType']) {
          m['locks'] = { field: field, value: value };
        }
      });

      const updatePlan = {
        query: this.planData['query'],
        plan: this.planData['planData']
      };
      this.marketPlanService
        .updateSinglePlan(this.scenarioId, element.id, updatePlan)
        .pipe(debounceTime(2000))
        .subscribe((response) => {
          this.updateParentPlanTotal.emit(element);
          this.isSaveingPlan = null;
          this.savingPlanInput = null;
          if (this.selectedViewByType === this.viewByFilter.MEDIA) {
            this.mediaTypeData.map((plan) => {
              if (plan['mediaTypeIndex'] === element.mediaTypeIndex) {
                plan['reach'] = '';
                plan['reachNet'] = '';
                plan['spots'] = '';
                plan['frequency'] = '';
                plan['trp'] = '';
                plan['targetInMarketImp'] = '';
                plan['targetImp'] = '';
                plan['totalImp'] = '';
                plan[field] = Number(value);
              }
            });
          } else {
            this.operatorData.map((plan) => {
              if (plan['mediaTypeIndex'] === element.mediaTypeIndex) {
                plan['reach'] = '';
                plan['reachNet'] = '';
                plan['spots'] = '';
                plan['frequency'] = '';
                plan['trp'] = '';
                plan['targetInMarketImp'] = '';
                plan['targetImp'] = '';
                plan['totalImp'] = '';
                plan[field] = Number(value);
              }
            });
          }
        });
    }
  }

  removeMedia(el) {
    if (this.selectedViewByType === this.viewByFilter.OPERATOR) {
      if (this.planData['query']['operators']) {
        this.planData['query']['operators'] = this.planData['query'][
          'operators'
        ].filter((operator) => operator !== el.mediaTypeLable);
      }
    } else {
      if (this.selectedMediaTypes.length === 1) {
        this.snackBar.open(
          `You can not remove all media types, atleast one media type must present in this plan.`,
          'DISMISS',
          {
            duration: 2000
          }
        );
        return true;
      }
      this.selectedMediaTypes = this.selectedMediaTypes.filter(
        (media) => media.data !== el.mediaTypeLable
      );
    }
    this.onUpdateMediaType();
  }
  updatePlanTotal(currentPlan) {
    const plan = currentPlan['plan'];
    this.dataSource.data.map((d) => {
      if (d['id'] === plan['id'] && d['parent'] === plan['parent']) {
        // d['trp'] = null;
        d['spots'] = null;
        d['frequency'] = null;
        d['reach'] = null;
        d['reachNet'] = null;
        d['targetInMarketImp'] = null;
        d['targetImp'] = null;
        d['totalImp'] = null;
        d.data.map((ele) => {
          /* if (ele['trp'] !== '') {
            d['trp'] += Number(ele['trp']);
          } */
          if (ele['spots'] !== '') {
            d['spots'] += Number(ele['spots']);
          }
          /* if (ele['frequency'] !== '') {
            d['frequency'] += Number(ele['frequency']);
          }
          if (ele['reach'] !== '') {
            d['reach'] += Number(ele['reach']);
          } */
        });
      }
    });
    this.locks = currentPlan['locks'];
    this.updateParentPlanTotal.emit(currentPlan);
  }
  // This function logic has some bugs. Here data  won't contain id when viewed by operator
  expandMarketPlanData(data) {
    data.collapsed = !data.collapsed;
    const updateData: any = this.marketPlanService.getUpdatedMediaType();
    if (updateData) {
      if (updateData?.id && updateData.id === data.id) {
        this.mediaTypeLable = updateData.mediaTypeLable;
        if (data.collapsed) {
          const index = this.mediaTypeLable.indexOf(data.mediaTypeLable);
          this.mediaTypeLable.splice(index, 1);
        } else {
          this.mediaTypeLable.push(data.mediaTypeLable);
        }
        this.marketPlanService.setUpdatedMediaType({
          id: data.id,
          mediaTypeLable: this.mediaTypeLable
        });
      } else {
        this.mediaTypeLable = [];
        this.mediaTypeLable.push(data.mediaTypeLable);
        this.marketPlanService.setUpdatedMediaType({
          id: data.id,
          mediaTypeLable: this.mediaTypeLable
        });
      }
    }
  }
  compare(arr1, arr2) {
    if (arr1 && arr2) {
      return arr1.sort().toString() === arr2.sort().toString();
    } else if (arr1 === null && arr2 === null) {
      return;
    }
  }

  public customizeColumn() {
    const currentSortables = this.displayedColumns.map((name) => {
      const obj = { displayname: name, field_name: name };
      return obj;
    });
    currentSortables.splice(currentSortables.length - 1, 1);
    const ref = this.dialog.open(CustomizeColumnComponent, {
      data: {
        sortables: Object.assign([], this.sortable),
        currentSortables: Object.assign([], currentSortables),
        origin: 'workspace'
      },
      width: '700px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container'
    });
    ref.afterClosed().subscribe((res) => {
      if (res && res.action !== 'cancel') {
        const sortableColumn = [];
        const displayedColumns = [...this.duplicateDisplayedColumns];
        displayedColumns.splice(displayedColumns.length - 1, 1);
        res.currentSortables.forEach((data) => {
          sortableColumn.push(data.displayname);
          displayedColumns.forEach((data1, index) => {
            if (data1 === data.displayname) {
              displayedColumns.splice(index, 1);
            }
          });
        });
        const sortable = displayedColumns.map((data) => {
          return { displayname: data, field_name: data };
        });
        this.sortable = sortable;
        sortableColumn.push('actions');
        this.displayedColumns = sortableColumn;
      }
    });
  }
  private getUniqueValues = (value, index, self) => {
    return self.indexOf(value) === index;
  };

  ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  private editPlan() {
    this.bottomSheet
      .open(EditPlanComponent, {
        panelClass: 'edit-plan-bottom-sheet',
        data: {
          measuresRelease: this.planData['measuresRelease'],
          goalsInfo: this.planData['query']['goals'],
          viewBy: this.selectedViewByType
        }
      })
      .afterDismissed()
      .subscribe((responseData) => {
        if (responseData) {
          this.goalFormData = responseData;
          this.onUpdateMediaType();
        }
      });
  }
  public onViewTypeChange(event) {
    this.isViewByOptionsOpen = !this.isViewByOptionsOpen;
    if (!event.option.value) {
      return;
    }
    this.selectedViewByType = event.option.value;
    this.onViewBY(this.selectedViewByType);
    this.updatePlansViewState.emit({
      planId: this.planData['id'],
      viewBy: this.selectedViewByType
    });
  }
  public onHoverRow(index) {
    this.hoveredIndex = index;
  }
  public onHoverOut() {
    this.hoveredIndex = null;
  }
}
