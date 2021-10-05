import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateProjectReq, DuplicateProjectReq } from '@interTypes/workspaceV2';
import { WorkspaceV3Service } from '../workspace-v3.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Helper } from '../../classes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomValidators } from '../../validators/custom-validators.validator'

@Component({
  selector: 'app-workspace-project-add',
  templateUrl: './workspace-project-add.component.html',
  styleUrls: ['./workspace-project-add.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceProjectAddComponent implements OnInit {
  public projectForm: FormGroup;
  public labels = this.workspaceApi.workSpaceLabels;
  public nameValidError: String = `Please enter a valid ${this.labels.project[0]} name.`;
  private project = null;
  public pageTitle = `Create ${this.labels.project[0]}`;
  constructor(
    public dialogRef: MatDialogRef<WorkspaceProjectAddComponent>,
    private fb: FormBuilder,
    private workspaceApi: WorkspaceV3Service,
    @Inject(MAT_DIALOG_DATA) public data,
    public snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    let projectName = '';
    if (this.data?.project !== null) {
      this.project = this.data.project;
      projectName = 'Copy of ' + this.project.name;
      this.pageTitle = `Duplicate ${this.labels.project[0]}`;
    }
    this.projectForm = this.fb.group({
      name: [projectName, [Validators.required, CustomValidators.noWhitespaceValidator(true)]],
      description: this.project?.description || ''
    });
  }
  onSubmit(projectForm) {
    const data = { type: 'saved', parentId: null, response: {} };
    if (this.projectForm.valid) {
      if (this.project === null) {
        const newProject: CreateProjectReq = Helper.deepClone(
          projectForm.value
        );
        if (newProject['description'] === '') {
          delete newProject['description'];
        }
        this.workspaceApi.createProject(newProject).subscribe((res) => {
          if (res['error']) {
            this.showAlertMsg(res.error.message);
          }else{
            data['response'] = res;
            data['name'] = projectForm.value?.name ?? '';
            this.dialogRef.close(data);
          }
        });
      } else {
        const dupProject: DuplicateProjectReq = {
          name: projectForm.value['name'],
          _id: this.project['_id']
        };
        if (projectForm.value['description'] !== '') {
          dupProject['description'] = projectForm.value['description'];
        }
        this.workspaceApi.duplicateProjects(dupProject).subscribe((res) => {
          if (!res['error']) {
            data['response'] = res;
            this.dialogRef.close(data);
          } else {
            const message = res?.['error']?.message ?? 'Something went wrong,  please try again.';
            this.showAlertMsg(message);
          }
        });
      }
    }
  }

  private showAlertMsg(msg: string){
    this.snackBar.open(msg, 'DISMISS', {
      duration: 2000
    });
  }

}
