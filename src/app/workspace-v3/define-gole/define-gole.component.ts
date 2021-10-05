import { Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AppRegularExp } from '@interTypes/enums';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { WorkspaceV3Service } from '../workspace-v3.service';

@Component({
  selector: 'app-define-gole',
  templateUrl: './define-gole.component.html',
  styleUrls: ['./define-gole.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefineGoleComponent implements OnInit, OnDestroy {
  @Input() defineGoleFormGroup: FormGroup;
  @Input() defineGoalFormSubmit$: Subject<any> = new Subject<any>();
  @Input() deliveryGoals;

  private unSubscribe$: Subject<void> = new Subject<void>();
  public effectReaches = [1, 3];
  AppRegularExp: any = AppRegularExp;

  constructor(
    private fb: FormBuilder,
    private workspaceV3Service: WorkspaceV3Service,
    private cdRef: ChangeDetectorRef,
    public matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.defineGoalFormSubmit$?.pipe(takeUntil(this.unSubscribe$)).subscribe(() => {
      this.defineGoleFormGroup.markAllAsTouched();
      this.cdRef.markForCheck();
    });
  }

  ngOnDestroy() {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

}
