import { Component, OnInit, EventEmitter, ChangeDetectionStrategy, Output, Input, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MediaAttributeDialogComponent } from '../media-attribute-dialog/media-attribute-dialog.component';
import { Orientation } from 'app/classes/orientation';
import { FiltersService } from 'app/explore/filters/filters.service';
import {Helper} from '../../classes';
@Component({
  selector: 'app-media-attribute-widget',
  templateUrl: './media-attribute-widget.component.html',
  styleUrls: ['./media-attribute-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaAttributeWidgetComponent implements OnInit {
 
  @Input() public appliedMediaAttributes: Observable<any>;
  @Input() public editFlag = true;
  @Output() submitMediaAttributes = new EventEmitter();
  public selectedMediaAttribute = {};
  constructor(private cd: ChangeDetectorRef, private matDialog: MatDialog, private filterService: FiltersService,) { }

  ngOnInit() {
    this.appliedMediaAttributes.subscribe( media => {
      this.selectedMediaAttribute = media;
      if (this.selectedMediaAttribute['orientationList']) {
        if(!(this.selectedMediaAttribute['orientationList']['option'] && this.selectedMediaAttribute['orientationList']['option'] === 'All')){
          const option = this.degreeToDirection(this.selectedMediaAttribute['orientationList']);
          this.selectedMediaAttribute['orientationList']['option'] = option;
        }
      }
      if (this.selectedMediaAttribute['spotLength']){
        this.selectedMediaAttribute['spotLength'] = {
          min: this.selectedMediaAttribute['spotLength'][0],
          max: this.selectedMediaAttribute['spotLength'][1]
        }
      }
      this.cd.markForCheck();
    });
  }

  public addMediaAttribute() {
    const dialogRef = this.matDialog.open(MediaAttributeDialogComponent, {
      data: { data: this.selectedMediaAttribute}
    });
    dialogRef.afterClosed().subscribe( media => {
      if (media && media['data']) {
        this.selectedMediaAttribute = media['data'];
        if (this.selectedMediaAttribute['orientationList']) {
          if(!(this.selectedMediaAttribute['orientationList']['option'] && this.selectedMediaAttribute['orientationList']['option'] === 'All')){
            const option = this.degreeToDirection(this.selectedMediaAttribute['orientationList']);
            this.selectedMediaAttribute['orientationList']['option'] = option;
          }
        }
        this.submitMediaAttributes.emit(
          Helper.deepClone(this.selectedMediaAttribute)
        );
      }
      this.cd.markForCheck();
    });
  }

  degreeToDirection(orientation) {
    if (orientation) {
      const orientationData = new Orientation();
      return orientationData.degreeToDirection(orientation);
    }
  }
  formatTimeLable(time ): string {
    return this.filterService.timeConvert( time + ':00:00');
  }

  /* Deleting the media types */
    removeMediaAttribute(mediaAttribute) {
      if (mediaAttribute) {
        delete this.selectedMediaAttribute[mediaAttribute];
        this.submitMediaAttributes.emit(Helper.deepClone(this.selectedMediaAttribute));
      }
  }

}
