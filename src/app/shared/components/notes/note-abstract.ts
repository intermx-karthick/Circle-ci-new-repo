import {
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  Component,
  Inject,
  EventEmitter,
  Output
} from '@angular/core';
import { Note, NotePagination, NoteMessage } from '@interTypes/notes';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, of } from 'rxjs';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { NoteDialogComponent } from './note-dialog/note-dialog.component';
import { FormControl, FormGroup } from '@angular/forms';
import { DeleteConfirmationDialogComponent } from '@shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import {
  debounceTime,
  map,
  tap,
  filter,
  takeUntil,
  catchError
} from 'rxjs/operators';
import { RecordService } from 'app/records-management-v2/record.service';

@Component({
  template: ``
})
export abstract class NoteAbstract implements OnDestroy {
  public noteList: Note[] = [];
  public enableNoteEdit = null;
  public submitAPI = false;
  private unSubscribe$: Subject<void> = new Subject<void>();
  public notePagination: NotePagination = {
    page: 1,
    perPage: 10 // Default perPage size
  };
  public myFormGroup: FormGroup;
  public moduleName: string;
  public parentNoteId: string;
  public noteFormControl = new FormControl([null]);
  private formNote = {};
  public enableCloseChanges = false;
  public isLoadingNote = false;
  public organizationId = null;
  public noteForm: FormGroup;
  @Output() public noteUpdateEmit = new EventEmitter();

  constructor(
    public recordService: RecordService,
    public matSnackBar: MatSnackBar,
    public cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<NoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    if (this.dialogData) {
      this.moduleName = this.dialogData?.moduleName ?? null;
      this.parentNoteId = this.dialogData?.parentId ?? null;
      if (this.moduleName && this.parentNoteId) {
        this.loadNotes(this.parentNoteId);
      }
    }
  }
  ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  public initializeNodeData(data) {
    this.moduleName = data?.['moduleName'] ?? null;
    this.parentNoteId = data?.['parentId'] ?? null;
    this.organizationId = data?.['organizationId'] ?? null;
    this.loadNotes(this.parentNoteId);
  }

  // TODO:  Load note based on module
  /** Load more note */
  public loadMoreNote() {
    this.loadMoreNoteData(this.parentNoteId);
  }

  loadMoreNoteData(parentNoteId) {
    if (
      this.notePagination.page * this.notePagination.perPage >
      this.notePagination.total
    ) {
      this.isLoadingNote = false;
      this.cdRef.markForCheck();
      return;
    }
    this.notePagination.page += 1;
    this.isLoadingNote = true;
    this.cdRef.markForCheck();
    this.recordService
      .getNoteDetailsId(
        parentNoteId,
        this.notePagination,
        this.moduleName,
        this.organizationId,
        true
      )
      .pipe(
        takeUntil(this.unSubscribe$),
        filter((res) => !!res?.['results']),
        catchError((error) => {
          this.notePagination.page -= 1;
          this.isLoadingNote = false;
          return of({ results: [] });
        })
      )
      .subscribe((res) => {
        this.isLoadingNote = false;
        const noteData = res['results'] ?? [];
        noteData.forEach((note) => {
          this.formNote[note._id] = new FormControl('');
          this.formNote[note._id].patchValue(note.notes ?? null);
        });
        this.noteList = this.noteList.concat(res['results']);
        this.setNotePaginationFromRes(res);
        this.cdRef.markForCheck();
      });
  }

  loadNotes(parentId) {
    this.isLoadingNote = true;
    this.cdRef.markForCheck();
    this.recordService
      .getNoteDetailsId(
        parentId,
        this.notePagination,
        this.moduleName,
        this.organizationId,
        true
      )
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(
        (response) => {
          this.isLoadingNote = false;
          if (response) {
            this.noteList = response?.['results'] ?? [];
            if (
              this.noteList.length < 1 &&
              this.dialogRef?._containerInstance?._config?.panelClass ===
                'note-dialog-main'
            ) {
              this.dialogRef?.close({ changes: true });
            }
            this.formNote = {};
            this.noteList.forEach((note) => {
              this.formNote[note._id] = new FormControl('');
              this.formNote[note._id].patchValue(note.notes ?? null);
            });
            this.setNotePaginationFromRes(response);
            this.cdRef.markForCheck();
          } else {
            let message = 'Something went wrong, Please try again later';
            if (response?.['error']?.message) {
              message = response['error']['message'];
            }
            this.showsAlertMessage(message);
          }
        },
        (error) => {
          this.isLoadingNote = false;
          let message = 'Something went wrong, Please try again later';
          if (error?.['error']?.message) {
            message = error['error']['message'];
          } else if (error?.['error']?.error) {
            message = error['error']['error'];
          }
          this.showsAlertMessage(message);
          this.cdRef.markForCheck();
        }
      );
  }

  setNotePaginationFromRes(result) {
    if (result?.pagination?.total) {
      this.notePagination.total = result['pagination']['total'];
    }
    this.cdRef.markForCheck();
  }

  public onEnableNoteEdit(note) {
    this.enableNoteEdit = note?._id;
    this.formNote[note._id].patchValue(note.notes ?? null);
  }
  public onCancelNoteEdit(note) {
    this.formNote[note._id].patchValue(note.notes ?? null);
    this.enableNoteEdit = null;
  }

  public updateNote(note) {
    // Check dynamic note field validation
    const noteValue = this.formNote[note._id].value;
    // To make form touched as ckeditor is not making the form touched sometimes.
    this.formNote[note._id]?.markAllAsTouched();
    if (
      noteValue &&
      typeof noteValue === 'string' &&
      noteValue.trim().length < 1
    ) {
      this.formNote[note._id].setErrors({ invalid: true });
      this.cdRef.markForCheck();
      return;
    } else if (
      noteValue &&
      typeof noteValue === 'string' &&
      noteValue.trim().length > 2000
    ) {
      this.formNote[note._id].setErrors({ max: true });
      this.cdRef.markForCheck();
      return;
    } else if (!noteValue) {
      this.formNote[note._id].setErrors({ min: true });
      this.cdRef.markForCheck();
      return;
    }

    this.updateNoteById(note, this.formNote[note._id].value);
    this.enableCloseChanges = true;
  }

  public createNote() {
    const formValue = this.noteForm.value;
    formValue.note = formValue.note.trim();
    this.submitAPI = true;
    this.recordService
      .createNoteByModuleName(
        this.parentNoteId,
        formValue,
        this.moduleName,
        this.organizationId
      )
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(
        (response) => {
          this.submitAPI = false;
          if (response) {
            this.showsAlertMessage(
              `${NoteMessage[this.moduleName]} note created successfully!`
            );
            this.noteUpdateEmit.emit({ noteUpdated: true });
            this.resetNotePagination();
            this.loadNotes(this.parentNoteId);
            this.noteForm.reset();
            this.noteForm.markAsPristine();
            this.noteForm.markAsUntouched();
          }
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.submitAPI = false;
          let message = 'Something went wrong, Please try again later';
          if (errorResponse?.error?.message) {
            message = errorResponse['error']['message'];
          } else if (errorResponse?.error?.error) {
            message = errorResponse['error']['error'];
          }
          this.showsAlertMessage(message);
          this.cdRef.markForCheck();
        }
      );
  }

  public deleteNote(note) {
    if (note !== null) {
      this.dialog
        .open(DeleteConfirmationDialogComponent, {
          width: '340px',
          height: '260px',
          panelClass: 'imx-mat-dialog'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res['action']) {
            this.onDeleteNote(note);
            this.enableCloseChanges = true;
          }
        });
    }
  }

  onDeleteNote(note: Note) {
    this.recordService
      .deleteNoteByModuleName(
        this.parentNoteId,
        note._id,
        this.moduleName,
        this.organizationId
      )
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(
        (response) => {
          this.submitAPI = false;
          if (response) {
            this.showsAlertMessage(
              `${NoteMessage[this.moduleName]} note deleted successfully!`
            );
            this.noteUpdateEmit.emit({ noteUpdated: true });
            this.resetNotePagination();
            this.loadNotes(this.parentNoteId);
          }
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.submitAPI = false;
          let message = 'Something went wrong, Please try again later';
          if (errorResponse?.error?.message) {
            message = errorResponse['error']['message'];
          } else if (errorResponse?.error?.error) {
            message = errorResponse['error']['error'];
          }
          this.showsAlertMessage(message);
          this.cdRef.markForCheck();
        }
      );
  }

  public updateNoteById(note: Note, noteValue) {
    const payload = {
      note: noteValue
    };
    this.recordService
      .updateNoteByModuleName(
        this.parentNoteId,
        note._id,
        payload,
        this.moduleName,
        this.organizationId
      )
      .pipe(takeUntil(this.unSubscribe$))
      .subscribe(
        (response) => {
          this.submitAPI = false;
          if (response) {
            this.showsAlertMessage(
              `${NoteMessage[this.moduleName]} note updated successfully!`
            );
            this.resetNotePagination();
            this.loadNotes(this.parentNoteId);
            this.noteUpdateEmit.emit({ noteUpdated: true });
            note['notes'] = noteValue;
            this.onCancelNoteEdit(note);
          }
          this.cdRef.markForCheck();
        },
        (errorResponse) => {
          this.submitAPI = false;
          let message = 'Something went wrong, Please try again later';
          if (errorResponse?.error?.message) {
            message = errorResponse['error']['message'];
          } else if (errorResponse?.error?.error) {
            message = errorResponse['error']['error'];
          }
          this.showsAlertMessage(message);
          this.cdRef.markForCheck();
        }
      );
  }

  resetNotePagination() {
    if (this.notePagination?.total) {
      this.notePagination = {
        page: 1,
        perPage: 10,
        total: this.notePagination?.total
      };
    } else {
      this.notePagination = { page: 1, perPage: 10 };
    }
  }

  public showsAlertMessage(msg) {
    const config = {
      duration: 3000
    } as MatSnackBarConfig;
    this.matSnackBar.open(msg, '', config);
  }
}
