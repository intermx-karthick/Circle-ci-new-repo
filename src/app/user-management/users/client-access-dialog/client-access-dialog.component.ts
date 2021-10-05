import { SnackbarService } from '@shared/services';
import { ReplaySubject, of } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import differenceBy from 'lodash/differenceBy';
import { delay, takeUntil, switchMap, catchError } from 'rxjs/operators';
import { ClientsService, UserContactsService } from '../../services';
import { clientAccessPerPageLimit } from '../../consts';

@Component({
  templateUrl: './client-access-dialog.component.html',
  styleUrls: ['./client-access-dialog.component.less']
})
export class ClientAccessDialogComponent implements OnInit, OnDestroy {
  public allClientsList = [];
  public userClientAccess = [];
  public officesAccess = [];
  public restrictedOfficesAccess = [];

  public searchName = '';
  public limit = clientAccessPerPageLimit;
  public offset = clientAccessPerPageLimit;
  public isComplete = false;

  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);
  clientSearchAPI = null;

  constructor(
    public dialogRef: MatDialogRef<ClientAccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userContactsService: UserContactsService,
    private clientsService: ClientsService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit() {
    this.allClientsList =
      differenceBy(
        this.data.allClients?.results || [],
        this.data.accessByOffice?.results || [],
        '_id'
      ) || [];
    this.userClientAccess = this.data.userClientAccess?.results || [];
    this.officesAccess =
      (this.data.accessByOffice?.results?.length &&
        this.data.accessByOffice?.results.map((item) =>
          Object.assign(item, (item.isOfficeItem = true))
        )) ||
      [];
    this.restrictedOfficesAccess =
      (this.data.restrictedClientByOffice?.results?.length &&
        this.data.restrictedClientByOffice?.results.map((item) =>
          Object.assign(item, (item.isOfficeItem = true))
        )) ||
      [];

  }

  public drop(event: CdkDragDrop<any>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else if (
      !(
        event.previousContainer.id === 'allClientsDragList' &&
        event.container.id === 'officeAccessDragList'
      ) &&
      !(
        event.previousContainer.id === 'officeAccessDragList' &&
        event.container.id === 'allClientsDragList'
      )
    ) {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  public onAddingAccess(id) {
    this.userClientAccess.unshift(...this.allClientsList.splice(id, 1));
  }

  public searchClients(value: string, isOnScroll = false): void {
    if (this.clientSearchAPI !== null) {
      this.clientSearchAPI.unsubscribe();
    }
    this.searchName = value;
    this.clientSearchAPI = this.clientsService
      .clientSearchList(
        undefined,
        undefined,
        value || undefined,
        String(Number.MAX_SAFE_INTEGER),
        this.userClientAccess.map((item) => item._id)
      )
      .pipe(delay(isOnScroll ? 0 : 300), takeUntil(this.destroy))
      .subscribe((res) => {
        if (isOnScroll) {
          this.offset += this.limit;
          this.isComplete = this.offset >= res.pagination.total;
        }

        if (this.data.fullAccess) {
          this.userClientAccess = this.userClientAccess.concat(
            differenceBy(res.results || [], this.officesAccess || [], '_id') ||
              []
          );
        } else {
          this.allClientsList =
            differenceBy(res.results || [], this.officesAccess || [], '_id') ||
            [];
        }
      });
  }

  public onSubmit(): void {
    const userClientAccess = this.userClientAccess.map((item) => item._id);
    const restrictedOfficesAccess = this.restrictedOfficesAccess.map((item) => item._id);
    const restricted = restrictedOfficesAccess.filter(function(val) {
      return userClientAccess.indexOf(val) === -1;
    });
    this.userContactsService
      .updateClientAccessList(this.data.connection, this.data.userId, {
        clientAccess: {
          fullAccess: !this.allClientsList.length,
          allowed: this.userClientAccess.map((item) => item._id),
          restricted: restricted
        }
      })
      .pipe(
        catchError(({ error }) => {
          this.snackbarService.showsAlertMessage(error.message);
          return of(null);
        }),
        takeUntil(this.destroy)
      )
      .subscribe(({ message }) => {
        this.snackbarService.showsAlertMessage(message);
        this.dialogRef.close(true);
      });
  }

  public resetToDefault(): void {
    this.userContactsService
      .updateClientAccessList(this.data.connection, this.data.userId, {
        clientAccess: {
          allowed: [],
          fullAccess: false,
          restricted: this.restrictedOfficesAccess.map((item) => item._id)
        }
      })
      .pipe(
        switchMap(() => {
          return this.clientsService.clientSearchList();
        }),
        takeUntil(this.destroy)
      )
      .subscribe(({ results }) => {
        this.allClientsList =
          differenceBy(results || [], this.officesAccess || [], '_id') || [];
        this.userClientAccess = [];
      });
  }

  public removeDragItem(
    id: number,
    dragList: 'users' | 'offices',
    isOfficeItem?: boolean
  ): void {
    if (dragList === 'users') {
      if (isOfficeItem) {
        this.officesAccess.unshift(...this.userClientAccess.splice(id, 1));
      } else {
        this.allClientsList.unshift(...this.userClientAccess.splice(id, 1));
      }
    } else if (dragList === 'offices') {
      const offices = this.officesAccess.splice(id, 1);
      this.restrictedOfficesAccess.unshift(...offices);
    }
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
