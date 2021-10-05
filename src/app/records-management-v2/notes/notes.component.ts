import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef, Inject, Optional, SkipSelf, EventEmitter, Output, OnChanges } from '@angular/core';
import { Observable , Subject} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecordService } from '../record.service';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import {
  Note,
  NotePagination
} from '@interTypes/notes';
import { CustomValidators } from 'app/validators/custom-validators.validator';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {NoteDialogComponent} from './note-dialog/note-dialog.component';
import { NoteAbstract} from './note-abstract';
import { CkEditorConfig } from '@constants/ckeditor-config';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotesComponent extends NoteAbstract implements  OnInit, OnChanges, OnDestroy {
  @Input() public moduleName: string;
  @Input() public organization: string;
  @Output() public noteUpdateEmit = new EventEmitter();
  
  public parentNoteId:string;
  public organizationId:string;
  @Input() noteParentId$: Observable<any>;
  public noteFormControl = new FormControl([null]);
  public enableCloseChanges = false;

  public noteForm: FormGroup;
  private freeUp$: Subject<void> = new Subject<void>();
  public submitAPI = false;
  public noteList: Note[] = [];
  public enableNoteEdit = false;
  public notePagination: NotePagination = {
    page: 1,
    perPage: 10 // Default perPage size
  };
  @Input() public placeholder = 'Notes';
  @Input() public disableEdit: boolean;
  @Input() public visiblityModule: string;
  public editorConfig = CkEditorConfig;
  public showEditor = false;
  constructor(
    public recordService: RecordService,
    public matSnackBar: MatSnackBar,
    private fb:FormBuilder,
    public cdRef:  ChangeDetectorRef,
    public dialog: MatDialog, @Optional() @SkipSelf() public dialogRef: MatDialogRef<NoteDialogComponent>,
    @Optional() @SkipSelf() @Inject(MAT_DIALOG_DATA) public dialogData: any) {
      super(recordService, matSnackBar, cdRef, dialog, dialogRef, dialogData);
     }

  ngOnInit(): void {
    this.noteForm = this.fb.group({
      note: ['', [Validators.minLength(1), Validators.maxLength(2000), CustomValidators.noWhitespaceValidator(false)]]
    })
    this.noteParentId$
      .pipe(takeUntil(this.freeUp$))
      .subscribe((data) => {
          if(!data?.['type'] && data){
            this.parentNoteId = data;
            const moduleData = {
            moduleName: this.moduleName,
            parentId: this.parentNoteId
            };
            this.initializeNodeData(moduleData);
          }else if(data?.['type'] && data?.['moduleName']){
            this.moduleName = data?.['moduleName'];
            this.parentNoteId = data?.['contactId'];
            this.organizationId = data?.['organizationId'];
            const moduleData = {
            moduleName: this.moduleName,
            parentId: this.parentNoteId,
            organizationId: this.organizationId
            };
            this.initializeNodeData(moduleData);
          }
        }
      );
      if(this.disableEdit) {
        this.noteForm.disable();      
      }
  }

  /* added to watch disable listen when its depends dynamic form values */
  public ngOnChanges(): void {
    if (this.disableEdit && this.noteForm) {
      this.noteForm?.disable();
    }
  }

  public addNote(){
    const noteValue = this.noteForm?.value?.note
    // To make form touched as ckeditor is not making the form touched sometimes.
    this.noteForm.controls?.note.markAllAsTouched();
    this.cdRef.markForCheck();
    if(!noteValue){
      this.noteForm.controls?.note.setErrors({required: true});
      this.cdRef.markForCheck();
      return;
    }else if(this.noteForm.invalid){
      return;
    }
    this.createNote();
  }

  
  public openNoteDialog() {
    const dialogData = {
      moduleName: this.moduleName,
      parentId: this.parentNoteId,
      visiblityModule: this.visiblityModule,
    };
   this.dialog
      .open(NoteDialogComponent, {
        height: '540px',
        data: dialogData,
        width: '540px',
        closeOnNavigation: true,
        panelClass: 'note-dialog-main'
      })
      .afterClosed()
      .subscribe((res) => {
          if(res?.['changes']){
            this.loadNotes(this.parentNoteId);
            this.noteUpdateEmit.emit({'noteUpdated':true});
          }
      });
  }

  public showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }

  public showEditorFunc() {
    this.showEditor = true;
    this.cdRef.markForCheck();
  }

  public ngOnDestroy(): void {
    this.freeUp$.next();
    this.freeUp$.complete();
  }

}
