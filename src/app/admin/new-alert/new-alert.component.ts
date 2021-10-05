import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  Link,
  Notification,
  NotificationTypeGenericForm,
  Site,
  SiteNotification
} from '@interTypes/Notifications';
import { Observable, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  takeUntil,
  tap,
  switchMap
} from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialog } from '@interTypes/workspaceV2';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CanExit } from '@interTypes/canExit';
import { CommonService } from '@shared/services';
import { UserData } from '@interTypes/User';

@Component({
  selector: 'app-new-alert',
  templateUrl: './new-alert.component.html',
  styleUrls: ['./new-alert.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewAlertComponent implements OnInit, CanExit, OnDestroy {
  public alertCategories$: Observable<NotificationTypeGenericForm[]>;
  public alertTypes$: Observable<NotificationTypeGenericForm[]>;
  public sites$: Observable<SiteNotification[]>;
  private urlValidate: RegExp = new RegExp(
    /(https)?:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  );
  private unsubscribe: Subject<void> = new Subject();
  public audienceTypes = [
    { id: 'all', name: 'All Users' },
    { id: 'site', name: 'Specific Site' },
    { id: 'user', name: 'Specific User' }
  ];
  public urlSegment: string;
  public alertForm: FormGroup;
  public editedNotification: Notification;
  filteredUserList: UserData[];
  isUserLoading = false;
  pagination = {
    page: 1,
    perPage: 10,
    total: 0
  };
  panelContainer = '';
  constructor(
    private fb: FormBuilder,
    private notificationsService: NotificationsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private commonService: CommonService,
    private cdRef: ChangeDetectorRef
  ) {
    if (this.activatedRoute.snapshot.data['notification']) {
      this.editedNotification = this.activatedRoute.snapshot.data[
        'notification'
      ];
    }
    this.alertForm = this.fb.group({
      notificationType: ['', Validators.required],
      title: [''],
      message: ['', Validators.required],
      links: new FormGroup({
        url: new FormControl('', Validators.pattern(this.urlValidate)),
        label: new FormControl('')
      }),
      alertType: ['', Validators.required],
      audience: new FormGroup({
        type: new FormControl('', Validators.required),
        site: new FormControl(''),
        recipient: new FormControl('')
      }),
      status: ['']
    });
  }

  ngOnInit() {
    if (this.editedNotification) {
      this.setFormValuesOnEdit();
    }
    this.alertCategories$ = this.notificationsService
      .getNotificationCategories$()
      .pipe(
        map((response) => {
          return response.filter((item) => item.name !== 'job');
        })
      );
    this.alertTypes$ = this.notificationsService.getNotificationTypes$();
    this.sites$ = this.notificationsService.getSitesList();
    /*this.users$ =*/
    this.alertForm
      .get('audience.recipient')
      .valueChanges.pipe(
        debounceTime(500),
        filter((searchTerm) => typeof searchTerm === 'string'),
        switchMap((searchStr: string) => {
          this.isUserLoading = true;
          this.cdRef.detectChanges();
          this.pagination = {
            page: 1,
            perPage: 10,
            total: 0
          };
          return this.notificationsService.getUsersFromAPI(this.pagination, searchStr).pipe(
            catchError((error) => {
              this.isUserLoading = false;
              this.cdRef.detectChanges();
              return of({ result: {} });
            })
          )
        })
      ).subscribe((response) => {
        this.isUserLoading = false;
        this.pagination = response['pagination'];
        this.filteredUserList = this.filterUsersList(response);
        this.cdRef.detectChanges();
    });
    this.handleAudienceValidations();
    this.handleLinkValidations();
  }
  private filterUsersList(users) {
    const filtered = users['result'].map((user: UserData) => {
      user.displayName = this.notificationsService.getUserDisplayName(user);
      return user;
    });
    return filtered;
  }
  private setFormValuesOnEdit() {
    // links comes as an array from API, don't exactly know why this is designed this way.
    const links: Link =
      this.editedNotification.links.length > 0
        ? this.editedNotification.links[0]
        : ({ label: '', url: '' } as Link);
    const category: NotificationTypeGenericForm = this.editedNotification
      .notificationType
      ? this.editedNotification.notificationType
      : ({} as NotificationTypeGenericForm);
    const alerType: NotificationTypeGenericForm = this.editedNotification
      .alertType
      ? this.editedNotification.alertType
      : ({} as NotificationTypeGenericForm);
    let recipient;
    let siteId;
    let user;
    // Checking recipient value and setting it
    if (
      this.editedNotification.recipient === null &&
      this.editedNotification.siteId === null
    ) {
      // This means the notification is for all users
      recipient = 'all';
    } else if (
      this.editedNotification.recipient === null &&
      this.editedNotification.siteId !== null
    ) {
      recipient = 'site';
      siteId = this.editedNotification.siteId;
    } else {
      recipient = 'user';
      user = this.editedNotification.recipient;
    }
    this.alertForm.patchValue({
      title: this.editedNotification.title,
      message: this.editedNotification.message,
      links: {
        url: links.url,
        label: links.label
      },
      // category field in form
      notificationType: category.name,
      // Type field in form
      alertType: alerType.name,
      audience: {
        type: recipient,
        site: siteId,
        recipient: user
      }
    });
  }
  private handleLinkValidations() {
    const urlField = this.alertForm.get('links.url');
    const labelField = this.alertForm.get('links.label');
    // When URL is entered enable label as mandatory
    urlField.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(400),
        takeUntil(this.unsubscribe)
      )
      .subscribe((url) => {
        if (url !== '') {
          labelField.setValidators(Validators.required);
        } else {
          labelField.clearValidators();
        }
        // Change detection for form validation and values
        labelField.updateValueAndValidity();
      });
    // When label is added trigger URL field validation to required.
    labelField.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(400),
        takeUntil(this.unsubscribe)
      )
      .subscribe((label) => {
        if (label !== '') {
          // Enable required.
          urlField.setValidators([
            Validators.required,
            Validators.pattern(this.urlValidate)
          ]);
        } else {
          // Reset URL validator to default pattern validation for URLs
          urlField.setValidators(Validators.pattern(this.urlValidate));
        }
        // Change detection for URL field.
        urlField.updateValueAndValidity();
      });
  }
  private handleAudienceValidations() {
    this.alertForm
      .get('audience.type')
      .valueChanges.pipe(takeUntil(this.unsubscribe))
      .subscribe((selectedAudience) => {
        if (selectedAudience === 'user') {
          this.alertForm.get('audience.site').clearValidators();
          this.alertForm
            .get('audience.recipient')
            .setValidators([Validators.required]);
        } else if (selectedAudience === 'site') {
          this.alertForm.get('audience.recipient').clearValidators();
          this.alertForm
            .get('audience.site')
            .setValidators([Validators.required]);
        } else {
          this.alertForm.get('audience.site').clearValidators();
          this.alertForm.get('audience.recipient').clearValidators();
        }
        this.alertForm.get('audience.site').updateValueAndValidity();
        this.alertForm.get('audience.recipient').updateValueAndValidity();
      });
  }

  canDeactivate(): Promise<any> | boolean {
    return this.commonService.confirmExit(
      this.alertForm,
      'Your changes will be lost.'
    );
  }

  public setStatus(status: string) {
    this.alertForm.controls.status.patchValue(status);
  }
  public onSubmit(alertFormData): void {
    if (this.alertForm.valid) {
      // Setting title as UI doesn't have title to display but API needs title as a mandatory field.
      alertFormData.title = alertFormData.message;
      // handling audience data formation
      if (alertFormData.audience.type === 'site') {
        alertFormData.audience.recipient = '';
        delete alertFormData.audience.type;
      } else if (alertFormData.audience.type === 'user') {
        alertFormData.audience.site = '';
        alertFormData.audience.recipient =
          alertFormData.audience.recipient['_id'];
        delete alertFormData.audience.type;
      } else {
        alertFormData.audience = null;
      }
      // Formatting links based on API format array of objects.
      let link = [];
      if (
        alertFormData.links &&
        alertFormData.links.url !== '' &&
        alertFormData.links.label !== ''
      ) {
        link = alertFormData.links = [alertFormData.links];
      }
      alertFormData.links = link;
      let saveAction$: Observable<any> = this.notificationsService.createNotification(
        alertFormData
      );
      if (this.editedNotification) {
        saveAction$ = this.notificationsService.updateNotification(
          this.editedNotification._id,
          alertFormData
        );
      }
      saveAction$.subscribe(
        (res) => {
          this.alertForm.markAsUntouched();
          this.alertForm.markAsPristine();
          const dialog: ConfirmationDialog = {
            notifyMessage: true,
            confirmTitle: 'Success',
            messageText: 'Alert saved successfully.'
          };
          this.dialog
            .open(ConfirmationDialogComponent, {
              data: dialog,
              width: '586px'
            })
            .afterClosed()
            .subscribe((res1) => {
              this.router.navigateByUrl('admin/alerts/list');
            });
        },
        (error) => {
          this.handleError(error);
        }
      );
    } else {
      this.alertForm.markAllAsTouched();
    }
  }
  public trackCategories(
    index: number,
    item: NotificationTypeGenericForm | Site
  ): string {
    return item._id;
  }
  public displayUser(user: UserData) {
    if (!user) {
      return '';
    }
    return `${user.displayName} (${user.email})`;
  }
  public loadMoreUserWithSearch() {
    if (this.pagination.page * this.pagination.perPage > this.pagination.total) {
      return;
    }
    this.isUserLoading = true;
    this.pagination.page++;
    this.notificationsService.getUsersFromAPI(this.pagination).subscribe((res) => {
        this.isUserLoading = false;
        this.filteredUserList.push(...this.filterUsersList(res));
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  private handleError(error) {
    let message = 'Something went wrong, Alert is not saved.';
    if (error.error && error.error.message) {
      message = error.error.message;
    }
    const dialog: ConfirmationDialog = {
      notifyMessage: true,
      confirmTitle: 'Error',
      messageText: message
    };
    this.dialog.open(ConfirmationDialogComponent, {
      data: dialog,
      width: '586px'
    });
  }
  public updateContainer() {
    this.panelContainer = '.user-list-dd';
  }
}
