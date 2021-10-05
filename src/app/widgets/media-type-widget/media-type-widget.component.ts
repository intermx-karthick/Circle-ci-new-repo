import { Component, OnInit, Input, Output ,EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MediaTypesBuilderDialogComponent } from '@shared/components/media-types-builder-dialog/media-types-builder-dialog.component';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import {Helper} from '../../classes';

@Component({
  selector: 'app-media-type-widget',
  templateUrl: './media-type-widget.component.html',
  styleUrls: ['./media-type-widget.component.less'],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaTypeWidgetComponent implements OnInit {

  @Input() public selectedMediaTypes = [];
  @Input() public editFlag = true;
  @Output() applyMediaType = new EventEmitter();
  constructor(private matDialog: MatDialog) { }

  ngOnInit() {
  }

  public addMediaType(mediaTypeData?, index?) {
    const dialogRef = this.matDialog.open(MediaTypesBuilderDialogComponent, {
      data: {status: true, editData: mediaTypeData, index: index }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.selectedMediaTypes === undefined) {
          this.selectedMediaTypes = [];
        }
        if (result.data && result.data.state && result.data.state === 'individual') {
          if (result.data.ids) {
            if (result.data.ids.medias) {
              const medias = result.data.ids.medias;
              medias.map(val => {
                if (!this.mediaTypeSelectedExitsOrNot(val)) {
                  const mediaData = Helper.deepClone(result.data);
                  mediaData.data = val;
                  mediaData.ids.construction = [];
                  mediaData.ids.medias = [val];
                  mediaData.ids.environments = [];
                  mediaData.ids.mediaTypes = [];
                  mediaData.ids.material = '';
                  mediaData.ids.material_medias = [];
                  mediaData.selection = {
                    classification: false,
                    construction: false,
                    medias: true,
                    mediaTypes: false,
                    material: false
                  };
                  this.selectedMediaTypes.push(mediaData);
                }
              });
              this.applyMediaType.emit(this.selectedMediaTypes);
            }
            if (result.data.ids.mediaTypes) {
              const mediaTypes = result.data.ids.mediaTypes;
              mediaTypes.map(val => {
                if (!this.mediaTypeSelectedExitsOrNot(val)) {
                  const mediaTypesData = Helper.deepClone(result.data);
                  mediaTypesData.data = val;
                  mediaTypesData.ids.construction = [];
                  mediaTypesData.ids.medias = [];
                  mediaTypesData.ids.environments = [];
                  mediaTypesData.ids.mediaTypes = [val];
                  mediaTypesData.ids.material = '';
                  mediaTypesData.ids.material_medias = [];
                  mediaTypesData.selection = {
                    classification: false,
                    construction: true,
                    medias: false,
                    mediaTypes: false,
                    material: false
                  };
                  this.selectedMediaTypes.push(mediaTypesData);
                }
              });
              this.applyMediaType.emit(this.selectedMediaTypes);
            }
            if (result.data.ids.environments) {
              const environments = result.data.ids.environments;
              environments.map(env => {
                if (!this.mediaTypeSelectedExitsOrNot(env)) {
                  const envData = Helper.deepClone(result.data);
                  envData.data = env;
                  envData.ids.environments = [env];
                  envData.ids.medias = [];
                  envData.ids.construction = [];
                  envData.ids.mediaTypes = [];
                  envData.ids.material = '';
                  envData.ids.material_medias = [];
                  envData.selection = {
                    classification: true,
                    construction: false,
                    medias: false,
                    mediaTypes: false,
                    material: false
                  };
                  this.selectedMediaTypes.push(envData);
                }
              });
              this.applyMediaType.emit(this.selectedMediaTypes);
            }
            if (result.data.ids.construction) {
              const construction = result.data.ids.construction;
              construction.map(cons => {
                if (!this.mediaTypeSelectedExitsOrNot(cons)) {
                  const consData = Helper.deepClone(result.data);
                  consData.data = cons;
                  consData.ids.construction = [cons];
                  consData.ids.medias = [];
                  consData.ids.environments = [];
                  consData.ids.mediaTypes = [];
                  consData.ids.material = '';
                  consData.ids.material_medias = [];
                  consData.selection = {
                    classification: false,
                    construction: true,
                    medias: false,
                    mediaTypes: false,
                    material: false
                  };
                  this.selectedMediaTypes.push(consData);
                }
              });
              this.applyMediaType.emit(this.selectedMediaTypes);
            }
            if (result.data.ids.material !== '') {
              const material = result.data.ids.material;
              let label = '';
              if (material === 'true') {
                label = 'Digital Only';
              } else if (material === 'false') {
                label = 'Printed/Mesh Only';
              } else {
                label = 'Digital & Printed/Mesh';
              }
              if (!this.mediaTypeSelectedExitsOrNot(label)) {
                const materialData = Helper.deepClone(result.data);
                materialData.data = label;
                materialData.ids.construction = [];
                materialData.ids.medias = [];
                materialData.ids.environments = [];
                materialData.ids.mediaTypes = [];
                materialData.ids.material = material;
                materialData.ids.material_medias = [];
                materialData.selection = {
                  classification: false,
                  construction: false,
                  medias: true,
                  mediaTypes: false,
                  material: false
                };
                this.selectedMediaTypes.push(materialData);
                this.applyMediaType.emit(this.selectedMediaTypes);
              }
            }
          }
        } else if (!this.mediaTypeSelectedExitsOrNot(result.data.data)) {
          if (result.data.edit) {
              if (result.data.data === '') {
                this.selectedMediaTypes.splice(result.data.index, 1);
              } else {
                this.selectedMediaTypes[result.data.index] = result.data;
              }
              this.applyMediaType.emit(this.selectedMediaTypes);
            } else {
              /** To check empty selection */
              if (result.data.data !== '') {
                this.selectedMediaTypes.push(result.data);
                this.applyMediaType.emit(this.selectedMediaTypes);
              }
            }
        } else {
          this.showError('Media type already exits', 'warning');
        }
      }
    });
  }

  /* checking whether media types exits or not */
  mediaTypeSelectedExitsOrNot(mediaName) {
    let mactingMediaType = false;
    this.selectedMediaTypes.forEach((data) => {
      if (data.data === mediaName) {
        return mactingMediaType = true;
      }
    });
    return mactingMediaType;
  }

  /* Deleting the media types */
  removeMediaTypeCard(index) {
      this.selectedMediaTypes.splice(index, 1);
      this.applyMediaType.emit(this.selectedMediaTypes);
  }

  /**
   * 
   * @param message error message
   */
  private showError(message, confirmTitle='Error') {
    const dialog: ConfirmationDialog = {
      notifyMessage: true,
      confirmTitle: 'Error',
      messageText: message,
    };
    this.matDialog.open(ConfirmationDialogComponent, {
      data: dialog,
      width: '400px'}).afterClosed();
  }
}
