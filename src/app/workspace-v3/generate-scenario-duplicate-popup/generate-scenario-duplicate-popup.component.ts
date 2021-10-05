import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import { WorkspaceV3Service } from '../workspace-v3.service';

@Component({
  selector: 'app-generate-scenario-duplicate-popup',
  templateUrl: './generate-scenario-duplicate-popup.component.html',
  styleUrls: ['./generate-scenario-duplicate-popup.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateScenarioDuplicatePopupComponent implements OnInit {

  public scenarioForm: FormGroup;
  public labels = this.workspaceApi.workSpaceLabels;
  public nameValidError: String = `Enter new Name for ${this.labels.scenario[0]}`;
  public nameWhiteSpaceValidError: String =
    `Please enter a valid ${this.labels.scenario[0]} Name.`;
  public pageTitle = `Duplicate ${this.labels.scenario[0]}`;
  constructor(
    public dialogRef: MatDialogRef<GenerateScenarioDuplicatePopupComponent>,
    private fb: FormBuilder,
    private workspaceApi: WorkspaceV3Service,
    @Inject(MAT_DIALOG_DATA) public data,
  ) {}

  ngOnInit(): void {
    this.scenarioForm = this.fb.group({
      name: ['', [Validators.required, CustomValidators.noWhitespaceValidator(true)]]
    });
  }
  onSubmit(scenarioForm) {
    if (this.scenarioForm.valid) {
      const data: any = {name: scenarioForm.value['name']};
      this.dialogRef.close(data);
    }
  }

}
