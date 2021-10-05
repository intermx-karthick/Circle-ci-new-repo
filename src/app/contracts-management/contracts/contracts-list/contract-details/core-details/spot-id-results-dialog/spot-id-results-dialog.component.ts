import { forkJoin } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import { AddLineItemDialogComponent } from '../add-line-item-dialog/add-line-item-dialog.component';
import { MediaDetailsService } from '../../../../../services/media-details.service';

@Component({
  selector: 'app-spot-id-results-dialog',
  templateUrl: './spot-id-results-dialog.component.html',
  styleUrls: ['./spot-id-results-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpotIdResultsDialogComponent implements OnInit {
  public resultsList: any[] = [];
  public respresentation: any;
  public selectedSpotId: any;

  constructor(
    public dialogRef: MatDialogRef<AddLineItemDialogComponent>,
    private mediaDetailsService: MediaDetailsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.getInventoryDetails();
  }

  /**
   * @description
   * methos to get spot ids from framelist
   * first 10 spot ids attached to get inventory details
   */
  public getInventoryDetails() {
    const spotIds =  this.data.frameList.map(each => each.spot_id_list).flat(); 
    this.mediaDetailsService.getInventoryDetails$({
      id_list: spotIds.splice(0,10),
      id_type: 'spot_id',
      status_type_name_list: ['*'],
      measures_required: false
    }).subscribe((res: any) => {
        this.resultsList = res.inventory_items;
        this.cdRef.detectChanges();
    });
  }

  public findRespresentationWithNameOwn(item) {
    return item.representations.find(
      (i: any) => i.representation_type.name === 'Own'
    );
  }

  public addSelected() {
    if (this.selectedSpotId) {
      this.dialogRef.close(this.selectedSpotId);
    }
  }

  public onClose() {
    this.dialogRef.close();
  }
}
