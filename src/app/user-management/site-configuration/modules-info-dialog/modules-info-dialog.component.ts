import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Component,
  ChangeDetectionStrategy,
  Inject,
  OnInit
} from '@angular/core';

@Component({
  selector: 'app-modules-info-dialog',
  templateUrl: './modules-info-dialog.component.html',
  styleUrls: ['./modules-info-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModulesInfoDialogComponent implements OnInit {
  public modules: any;

  constructor(
    public dialogRef: MatDialogRef<ModulesInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.modules = Object.entries(this.data).filter((el: any) => el[1].status);
  }

  public onNoClick() {
    this.dialogRef.close();
  }
}
