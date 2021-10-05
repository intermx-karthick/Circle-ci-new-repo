import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-save-geo-set',
  templateUrl: './save-geo-set.component.html',
  styleUrls: ['./save-geo-set.component.less']
})
export class SaveGeoSetComponent implements OnInit {
  public geoSetForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialogRef<SaveGeoSetComponent>,
  ) { }

  ngOnInit() {
    this.geoSetForm = this.fb.group({
      'name': ['', [Validators.required]],
      'description': [''],
    });
  }
  public onSubmit(geoSetForm: FormGroup) {
    if (geoSetForm.valid) {
      this.dialog.close(geoSetForm.value);
    }
  }

}
