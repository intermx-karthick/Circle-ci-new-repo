import { Component, OnInit, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog} from '@angular/material/dialog';
import { NoteAbstract} from '../note-abstract';
import { RecordService } from '../../record.service';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import {
  Note,
  NotePagination
} from '@interTypes/notes';
import { FormControl, FormGroup} from '@angular/forms';
import { CkEditorConfig } from '@constants/ckeditor-config';

@Component({
  selector: 'app-note-dialog',
  templateUrl: './note-dialog.component.html',
  styleUrls: ['./note-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteDialogComponent extends NoteAbstract implements OnInit {
  public notePagination: NotePagination = {
    page: 1,
    perPage: 10 // Default perPage size
  };
  public noteList: Note[] = [];
  public enableNoteEdit = null;
  public myFormGroup:FormGroup
  public enableCloseChanges = false;
  public panelContainer:string;
  public editorConfig = CkEditorConfig;
  constructor(
    public recordService: RecordService,
    public matSnackBar: MatSnackBar,
    public cdRef:  ChangeDetectorRef,
    public dialog:MatDialog,
    public dialogRef: MatDialogRef<NoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any) {
      super(recordService, matSnackBar, cdRef, dialog, dialogRef, dialogData);
     }

  ngOnInit(): void {
    this.dialogRef.backdropClick().subscribe(_ => {  
      this.dialogRef.close({'changes':this.enableCloseChanges});
    });
  }

  public closeDialogBox() {
    this.dialogRef.close({'changes':this.enableCloseChanges});
  }
  public updateContainer() {
    this.panelContainer = '.note-dialog-scroll-container';
  }

}
