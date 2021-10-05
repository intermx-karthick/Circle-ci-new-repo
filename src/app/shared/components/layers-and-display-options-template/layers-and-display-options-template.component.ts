import { Component, OnInit, Input } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ExploreDataService } from '@shared/services';
import { LayersService } from 'app/explore/layer-display-options/layers.service';

@Component({
  selector: 'app-layers-and-display-options-template',
  templateUrl: './layers-and-display-options-template.component.html',
  styleUrls: ['./layers-and-display-options-template.component.less']
})
export class LayersAndDisplayOptionsTemplateComponent implements OnInit {

  constructor(
    private layersService: LayersService,
    public dialog: MatDialog,
    private exploreDataService: ExploreDataService
  ) { }
  public dualMapSections = [];
  private primaryMapSession: any;
  private secondaryMapSession: any;
  public isEnableSecondaryMap = false;
  public selectedMapIndex = 0;
  private mapViewPostionState = '';
  private unSubscribe: Subject<void> = new Subject<void>();

  @Input() displayOptionsList = [
    'Map Legends',
    'Map Controls',
    'Custom Logo',
    'Custom Text',
    'Base Maps'
  ];
  @Input() layersOptionsList = [
    'inventory collection',
    'place collection',
    'geopathId',
    'place',
    'geography',
    'geo sets',
  ];

  ngOnInit() {
    this.primaryMapSession = this.layersService.getlayersSession();
    this.secondaryMapSession = this.layersService.getlayersSession('secondary');

    if (this.primaryMapSession && this.primaryMapSession['title']) {
      this.dualMapSections.push({
        name: this.primaryMapSession['title'],
        isEdit: false
      });
    } else {
      this.dualMapSections.push({
        name: 'Primary Map',
        isEdit: false
      });
      this.setLocalStorage('Primary Map');
    }

    if (this.secondaryMapSession && this.secondaryMapSession['title']) {
      this.dualMapSections.push({
        name: this.secondaryMapSession['title'],
        isEdit: false
      });
      this.isEnableSecondaryMap = true;
    } else {
      this.dualMapSections.push({
        name: 'Secondary Map',
        isEdit: false
      });
    }
    // Need to check what to do with this
    // this.exploreDataService
    //   .getMapViewPositionState()
    //   .pipe(takeUntil(this.unSubscribe))
    //   .subscribe(state => {
    //     this.mapViewPostionState = state;
    // });

    this.layersService.getApplyLayers().pipe(takeUntil(this.unSubscribe)).subscribe((value) => {
      if (value['type'] === 'secondary') {
        this.secondaryMapSession = this.layersService.getlayersSession('secondary');
        if (!value['flag']) {
          this.clearSecondaryMap();
          if (value['closeTab']) {
            this.selectedMapIndex = 0;
            this.isEnableSecondaryMap = false;
          }
        } else {
          this.dualMapSections[1] = {
            name: this.secondaryMapSession && this.secondaryMapSession['title'] || 'Secondary Map',
            isEdit: false
          };
          this.isEnableSecondaryMap = true;
        }
      } else {
        if (!value['flag']) {
          this.dualMapSections[0] = {
            name: 'Primary Map',
            isEdit: false
          };
          this.setLocalStorage('Primary Map');
        }
      }
    });
  }

  handleInput(event: KeyboardEvent) {
    event.stopPropagation();
  }

  onTitleEdit(sectionIndex) {
    this.dualMapSections[sectionIndex]['isEdit'] = true;
    this.dualMapSections[sectionIndex]['previousName'] = this.dualMapSections[sectionIndex]['name'];
  }


  onTitleSave(sectionIndex) {
    if (this.dualMapSections[sectionIndex]['name'].length > 0) {
      this.dualMapSections[sectionIndex]['isEdit'] = false;
      this.dualMapSections[sectionIndex]['previousName'] = this.dualMapSections[sectionIndex]['name'];
      this.setLocalStorage(this.dualMapSections[sectionIndex]['name'], (sectionIndex !== 0 ? 'secondary' : 'primary'));
    }
  }

  onTitleClose(sectionIndex) {
    this.dualMapSections[sectionIndex]['isEdit'] = false;
    this.dualMapSections[sectionIndex]['name'] = this.dualMapSections[sectionIndex]['previousName'];
  }

  setLocalStorage(data, type = 'primary') {
    if (type === 'primary') {
      const primaryMapSession = Object.assign({}, JSON.parse(localStorage.getItem('layersSession')));
      primaryMapSession['title'] = data;
      localStorage.setItem('layersSession', JSON.stringify(primaryMapSession));
      this.primaryMapSession = primaryMapSession;
    } else {
      const secondaryMapSession = Object.assign({}, JSON.parse(localStorage.getItem('secondaryLayersSession')));
      secondaryMapSession['title'] = data;
      localStorage.setItem('secondaryLayersSession', JSON.stringify(secondaryMapSession));
      this.secondaryMapSession = secondaryMapSession;
    }
  }

  public enableSecondaryMap() {
    this.dualMapSections[1] = {
      name: 'Secondary Map',
      isEdit: false
    };
    this.setLocalStorage('Secondary Map', 'secondary');
    this.isEnableSecondaryMap = true;
    setTimeout(() => {
      this.selectedMapIndex = 1;
    }, 100);
    this.layersService.setApplyLayers({
      'type': 'secondary',
      'flag': true
    });
  }
  public clearSecondaryMap() {
    this.dualMapSections[1] = {
      name: 'Secondary Map',
      isEdit: false
    };
    setTimeout(() => {
      this.selectedMapIndex = 0;
    }, 100);
  }
  public closeSecondaryMap() {
    const dialogueData: ConfirmationDialog = {
      notifyMessage: false,
      confirmDesc: '<h4 class="confirm-text-icon">Are you sure you want to close the secondary map?</h4>',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      headerCloseIcon: false
    };
    this.dialog.open(ConfirmationDialogComponent, {
      data: dialogueData,
      width: '586px',
      panelClass: 'exploreLayer'
    }).afterClosed().subscribe(result => {
      if (result && result['action']) {
        this.selectedMapIndex = 0;
        this.layersService.saveLayersSession({}, 'secondary');
        this.layersService.setApplyLayers({
          'type': 'secondary',
          'flag': false,
          'closeTab' : true
        });
        this.clearSecondaryMap();
        this.isEnableSecondaryMap = false;
      }
    });
  }
  ngOnDestroy() {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
