import { Component, OnInit, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { AudienceBrowserDialogComponent } from '@shared/components/audience-browser-dialog/audience-browser-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-audience-widget',
  templateUrl: './audience-widget.component.html',
  styleUrls: ['./audience-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudienceWidgetComponent implements OnInit {
  @Input() public selectedAudiences = [];
  @Input() public defaultAudience: any;
  @Output() applyAudience = new EventEmitter();
  @Input() public editFlag = true;
  constructor(public dialog: MatDialog) { }

  ngOnInit() {
    let audienceIdArray = [];
    this.selectedAudiences.filter(selected => {
      audienceIdArray.push(selected.id);
    });

    this.selectedAudiences.filter(options => {
      const isExist = audienceIdArray.includes(options.id);
      if (!isExist) {
        this.selectedAudiences.push(options);
      }
    });
    audienceIdArray = [];
  }
  openAudienceDialog() {
    this.dialog.open(AudienceBrowserDialogComponent, {
      height: '550px',
      data: { isScenario: true },
      width: '700px',
      closeOnNavigation: true,
      panelClass: 'audience-browser-container'
    }).afterClosed().subscribe(result => {
      if (result) {
        // this.loaderService.display(true);
        if (result.targetAudience) {
          const resultAudience = [];
          result.targetAudience.map((aud) => {
            const index = this.selectedAudiences.findIndex(x => x.id === aud.audience);
            if (index < 0 ) {
              resultAudience.push({ name: aud.name, id: aud.audience });
            }
          });
          this.selectedAudiences = [...this.selectedAudiences, ...resultAudience] ;
          this.applyAudience.emit(this.selectedAudiences);
        }
      }
    });
  }

  /**
   *
   * @param removeOperator selected market to be removed
   */
  removeAudience(removeAudience) {
    const index = this.selectedAudiences.findIndex(x => x.id === removeAudience.id);
    if (index !== -1) {
      this.selectedAudiences.splice(index, 1);
      this.applyAudience.emit(this.selectedAudiences);
    }
  }

}
