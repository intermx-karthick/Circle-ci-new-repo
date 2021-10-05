import { ActionType } from './../../Interfaces/timepicker';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef, OnChanges, SimpleChanges, ViewChild
} from '@angular/core';
import { Filter } from '@interTypes/filter';
import { AuthenticationService, InventoryService } from '@shared/services';
import { ActivatedRoute } from '@angular/router';
import { MarketThresholdFilter } from '@interTypes/threshold';
import { BehaviorSubject, Subject } from 'rxjs';
import { ScenarioDetails } from '@interTypes/scenario.response';
import { Helper } from 'app/classes';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-filter',
  templateUrl: './inventory-filter.component.html',
  styleUrls: ['./inventory-filter.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryFilterComponent implements OnInit, OnChanges {
  /** Media type input data */
  public mediaTypesDataForEdit: {
    status: true;
    editData: undefined;
    index: undefined;
  };
  public selectedOperatorOptions: Filter[] = [];
  projectOwnerEmail: any;
  projectOwnerName: any;
  userEmail: string;
  /** Operator input data */
  public operatorsData = {
    optionsData: [],
    selectedOptions: []
  };

  /** Threshold Input data */
  public measureRangeFilters: MarketThresholdFilter = {
    inMarketCompIndex: [10, 210],
    targetImp: [0, 150000]
  };

  public measureRangeFilters$ = new BehaviorSubject(this.measureRangeFilters);
  public mediaAttributes$ = new BehaviorSubject(null);
  private filters = {};
  @Input() operators;
  @Input() scenario = {} as ScenarioDetails;
  @Input() showInventoryFilters: boolean;
  @Output() applyInventoryFilter = new EventEmitter();
  @Output() mediaPanelExpand = new EventEmitter();
  @Output() removeLocationEmit = new EventEmitter();
  @Input() public includeType = 'dialog';
  @Input() public isOnlyOperatorFilter;
  @Input() public hideOperatorFilter;
  @Input() public closeAllExpansionPanel;
  /** Location input data */
  public locationData = {
    selectedLocations: []
  };
  private unsubscribe = new Subject();
  public mediaTypeFilters$ = new BehaviorSubject([]);
  private projectPermission: any;
  public operatorModulePermission = false;
  thresholdPanelOpen = false;
  locationPanelOpen = false;
  mediaAttributePanelOpen = false;
  MediaPlacementPanelOpen = false;

  constructor(
    private auth: AuthenticationService,
    private activeRoute: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private inventoryService: InventoryService,
    private workspaceV3Service: WorkspaceV3Service,
  ) {}

  ngOnInit(): void {
    const userData = this.auth.getUserData();
    this.userEmail = userData['email'] ? userData['email'] : '';
    this.setOperatorData();
    this.listenForClearFilters();
    this.projectPermission = this.auth.getModuleAccess('v3workspace');
    this.operatorModulePermission = (this.projectPermission?.['scenarios']?.['operators']?.['status'] === 'active');
    if (this.scenario?.mediaTypeFilters?.data) {
      this.mediaTypeFilters$.next(this.scenario?.mediaTypeFilters?.data);
      this.setMediaTypeData(this.scenario?.mediaTypeFilters?.data);
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.closeAllExpansionPanel && this.closeAllExpansionPanel) {
      this.thresholdPanelOpen = false;
      this.locationPanelOpen = false;
      this.mediaAttributePanelOpen = false;
      this.MediaPlacementPanelOpen = false;
    }
    if (changes.operators) {
      this.setOperatorData();
    }
    if (changes.scenario) {
      if (this.scenario?.locationFilters?.data?.length) {
        this.locationData.selectedLocations = this.scenario.locationFilters.data;
        // For triggering changes in child comp
        this.locationData = Helper.deepClone(this.locationData);
        this.applyLocation(this.scenario?.locationFilters);
      }
      if (this.scenario?.measureRangeFilters?.data?.length) {
        const thresholds = this.scenario['measureRangeFilters']['data'];
        thresholds.forEach((value) => {
          if (value['type'] === 'index_comp_target') {
            this.measureRangeFilters['inMarketCompIndex'] = [
              value['min'],
              value['max']
            ];
          } else if (value['type'] === 'imp_target') {
            this.measureRangeFilters['targetImp'] = [
              value['min'],
              value['max']
            ];
          }
        });
        this.measureRangeFilters$.next(this.measureRangeFilters);
        this.applyThresholds(this.measureRangeFilters);
      }
      if (this.scenario?.mediaAttributes?.data) {
        const data = Helper.deepClone(this.scenario?.mediaAttributes?.data);
        const formattedData = this.reverseMediaAttributeFormat(data);
        this.mediaAttributes$.next(formattedData);
      }
      if (this.scenario?.mediaTypeFilters?.data) {
        this.mediaTypeFilters$.next(this.scenario?.mediaTypeFilters?.data);
        this.setMediaTypeData(this.scenario?.mediaTypeFilters?.data);
      }
      if (this.scenario?.operators?.data?.length > 0) {
        this.setOperatorData();
      }
    }
  }

  removeLocation(event){
    this.removeLocationEmit.emit(event);
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

    this.filters['operator'] = this.operatorsData;
    this.operatorsData = Helper.deepClone(this.operatorsData);
  }

  reverseMediaAttributeFormat(mediaAttribute) {
    if (mediaAttribute) {
      let data = {};
      const media = mediaAttribute;
      if (media['orientation']) {
        data['orientationList'] = media['orientation'];
      }
      // We are multiplying with 12 to convert feets to inches as API expecting inches
      if (media['frame_width']) {
        data['panelSizeWidthRange'] = [media['frame_width']['min'], media['frame_width']['max']];
      }
      if (media['spot_length']) {
        data['spotLength'] = media['spot_length'];
      }
      if (media['frame_height']) {
        data['panelSizeHeightRange'] = [
          media['frame_height']['min'],
          media['frame_height']['max']
        ];
      }
      if (
        media['rotating'] !== undefined &&
        media['rotating'] !== null &&
        media['rotating'] !== ''
      ) {
        data['rotating'] = media['rotating'];
      }
      if (media['illumination_start_time'] && media['illumination_end_time']) {
        data['illuminationHrsRange'] = [
          media['illumination_start_time'],
          media['illumination_end_time']
        ];

        /* data['illuminationHrsRange'] = [
          Number(
            media['illumination_start_time'] !== '23:59:59'
              ? media['illumination_start_time'].substr(0, 2)
              : 24
          ),
          Number(
            media['illumination_end_time'] !== '23:59:59'
              ? media['illumination_end_time'].substr(0, 2)
              : 24
          )
        ]; */
      }
      if (media['status_type_name_list'] && media['status_type_name_list'].length) {
        data['auditStatusList'] = media['status_type_name_list'];
      }

      if (
        media['spot_audio'] !== undefined &&
        media['spot_audio'] !== null &&
        media['spot_audio'] !== ''
      ) {
        data['spotAudio'] = media['spot_audio'];
      }
      if (
        media['spot_full_motion'] !== undefined &&
        media['spot_full_motion'] !== null &&
        media['spot_full_motion'] !== ''
      ) {
        data['spotFullMotion'] = media['spot_full_motion'];
      }
      if (
        media['spot_partial_motion'] !== undefined &&
        media['spot_partial_motion'] !== null &&
        media['spot_partial_motion'] !== ''
      ) {
        data['spotPartialMotion'] = media['spot_partial_motion'];
      }
      if (
        media['spot_interactive'] !== undefined &&
        media['spot_interactive'] !== null &&
        media['spot_interactive'] !== ''
      ) {
        data['spotInteractive'] = media['spot_interactive'];
      }
      return data;
    }
  }


  public setMediaTypeData(data) {
    this.filters['mediaTypeFilters'] = data;
    this.applyFilters();
  }

  public applyMediaAttribute(data) {
    this.filters['mediaAttributes'] = data;
    this.applyFilters();
  }

  public applyOperators(data) {
    this.filters['operator'] = data;
    this.applyFilters();
  }

  public applyLocation(data) {
    this.filters['location'] = data;
    this.applyFilters();
  }

  public applyThresholds(data) {
    this.filters['thresholds'] = data;
    this.applyFilters();
  }

  private applyFilters() {
    this.applyInventoryFilter.emit(this.filters);
  }

  private listenForClearFilters(){
    this.workspaceV3Service.clearScenarioFilters$.pipe(
      takeUntil(this.unsubscribe)
    ).subscribe(()=>{
      this.filters = {
        operator: this.operatorsData
      };
      this.mediaTypesDataForEdit = {
        status: true,
        editData: undefined,
        index: undefined,
      };
      this.mediaTypeFilters$.next([]);
      this.cdRef.detectChanges();
    })
  }
  /**
    This emit used to identified the media & placement panel expand and collapse for used to set the selected media type height
   */
  onExpandMediaPlacement(mediaPanelRef, currentPanel){
    const panelRef = {
      mediaPanel: mediaPanelRef,
      otherPanel: currentPanel
    }
    this.mediaPanelExpand.emit(panelRef);
  }
}
