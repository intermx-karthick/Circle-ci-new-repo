import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkspaceV3Service } from '../workspace-v3.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import {
  ConfirmationDialog,
  DuplicateScenarioReq
} from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomValidators } from 'app/validators/custom-validators.validator';

@Component({
  selector: 'app-duplicate-scenario-v3',
  templateUrl: './duplicate-scenario-v3.component.html',
  styleUrls: ['./duplicate-scenario-v3.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateScenarioV3Component implements OnInit {
  public scenarioForm: FormGroup;
  public labels = this.workspaceApi.workSpaceLabels;
  public nameValidError: String = `${this.labels.scenario[0]} Name can't be blank`;
  public nameWhiteSpaceValidError: String =
    `Please enter a valid ${this.labels.scenario[0]} Name.`;
  public pageTitle = `Duplicate ${this.labels.scenario[0]}`;
  constructor(
    public dialogRef: MatDialogRef<DuplicateScenarioV3Component>,
    private fb: FormBuilder,
    private workspaceApi: WorkspaceV3Service,
    @Inject(MAT_DIALOG_DATA) public data,
    private matDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.scenarioForm = this.fb.group({
      name: ['', [Validators.required, CustomValidators.noWhitespaceValidator(true)]]
    });
  }
  onSubmit(scenarioForm) {
    if (this.scenarioForm.valid) {
      const data: DuplicateScenarioReq = {
        scenario: {
          name: scenarioForm.value['name']
        }
      };
      this.workspaceApi
        .duplicateScenario(data, this.data['scenario']['_id'])
        .subscribe(
          (res) => {
            if (!res['error']) {
              data['response'] = res;
              this.dialogRef.close(data);
            }
          },
          (error) => {
            const message = error?.error?.message ??
                `Something went wrong. ${this.labels.scenario[0]} is not created.`;
            this.snackBar.open(message, 'DISMISS', {
                duration: 2000
            });
          }
        );
    }
  }
}
