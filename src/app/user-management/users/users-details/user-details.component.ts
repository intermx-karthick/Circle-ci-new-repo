import { differenceBy } from 'lodash/differenceBy';
import { SnackbarService } from '@shared/services';
import { MatDialog } from '@angular/material/dialog';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { ReplaySubject, forkJoin, Subscription, of } from 'rxjs';

import { UserDetailsDialogComponent } from '../user-details-dialog/user-details-dialog.component';
import { MultiSelectGroupDetailsComponent } from '../../groups/multi-select-group-details.component/multi-select-group-details.component';
import { UsersMapper } from '../../helpers';
import {
  ContactsService,
  GroupsService,
  OfficesService,
  UserContactsService,
  UsersService,
  DivisionsService,
  AddressServiceService,
  ClientsService
} from '../../services';
import { Group, Role, User, UsersViewModel } from '../../models';
import { clientAccessPerPageLimit } from '../../consts';
import { ClientAccessDialogComponent } from '../client-access-dialog/client-access-dialog.component';
import { RecordsPagination } from '@interTypes/pagination';
import { Helper } from '../../../classes';
import { CustomValidators } from 'app/validators/custom-validators.validator';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.less']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  public allGroups: Group[] = [];
  public groupsToDelete: Group[] = [];
  public allRoles: Role[] = [];
  public rolesToDelete: Role[] = [];
  public id: string;
  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);

  public user: User;
  public userView: UsersViewModel;

  public userGroups: Group[] = [];
  public userRoles: Role[] = [];

  public rolesSubscription: Subscription;

  public states = [];

  @Input() connection: string;
  @Input() organizationId: string;
  @Input() userContactsAccess: any;
  @Input() clientAccess: any;
  public userOfficeId: any;

  @Input() set groups(value: Group[]) {
    if (!value) {
      return;
    }

    this.allGroups = value;
    this.userView = UsersMapper.userToUserViewModel(
      this.user,
      this.allGroups,
      this.allRoles
    );
  }

  @Input() set roles(value: Role[]) {
    if (!value) {
      return;
    }

    this.allRoles = value;
    this.userView = UsersMapper.userToUserViewModel(
      this.user,
      this.allGroups,
      this.allRoles
    );
  }

  @Input() set userId(value: string) {
    if (!value) {
      return;
    }

    this.id = value;

    this._getUserData(value);
  }

  @Input() userRow: any;

  @Output()
  saveUser: EventEmitter<UsersViewModel> = new EventEmitter<UsersViewModel>();
  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteUser: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteUserRoles: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteUserGroups: EventEmitter<any> = new EventEmitter<any>();
  @Output() updateTable: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('#multiSelectGroups')
  multiSelectGroups: MultiSelectGroupDetailsComponent;
  @ViewChild('#multiSelectRoles')
  multiSelectRoles: MultiSelectGroupDetailsComponent;

  public userContactForm: FormGroup;

  public isOfficesComplete = false;
  public isOfficesLoading = false;
  public officesLimit = 50;
  public officcesOffset = 0;
  public offices = [];

  public contactInfo: any;
  public contactTypes = [];
  public contactTypePagination: RecordsPagination = {
    perPage: 10,
    page: 1
  };
  public isContactTypesLoading = false;

  constructor(
    private usersService: UsersService,
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private contactsService: ContactsService,
    private userContactsService: UserContactsService,
    private formBuilder: FormBuilder,
    private officesService: OfficesService,
    private divisionsService: DivisionsService,
    private addressServiceService: AddressServiceService,
    private clientsService: ClientsService,
    private snackbarService: SnackbarService,
    public userService: UsersService
  ) {
    this.userContactForm = formBuilder.group({
      'firstName': [
        null,
        [
          Validators.required,
          CustomValidators.noWhitespaceValidator(true),
          Validators.maxLength(64)
        ]
      ],
      'lastName': [
        null,
        [
          Validators.required,
          CustomValidators.noWhitespaceValidator(true),
          Validators.maxLength(64)
        ]
      ],
      'email': [null, Validators.email],
      'title': null,
      'mobile': ['', [CustomValidators.telephoneInputValidator]],
      'office': [null, [CustomValidators.telephoneInputValidator]],
      'officeNum': [''],
      'fax': ['', [CustomValidators.telephoneInputValidator]],
      'parentCompany': null,
      'address': [null],
      'companyType': ['User'],
      'note': null,
      'type': null,
      'fullAccess': false
    });

    this.addressServiceService
      .getStateSearch()
      .pipe(takeUntil(this.destroy))
      .subscribe(({ results }) => {
        this.states = results;
      });

    this.loadContactTypes();
  }

  get isUserContactActive() {
    return this.userContactsAccess?.status === 'active';
  }

  get isClientAccessActive() {
    return this.clientAccess?.status === 'active';
  }

  public groupsTemp = [];

  public clientAccessObj: any;

  ngOnInit() {
    this.usersService
      .getUserGroups(this.id)
      .pipe(
        switchMap((res) => {
          this.userGroups = res;
          this.groupsTemp = res;

          return forkJoin(
            res.map(({ _id }) => this.groupsService.getGroupRoles(_id))
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe((res) => {
        this.userRoles = res
          .flat()
          .filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);
      });

    if (this.isClientAccessActive) {
      this.userContactsService
        .getClientAccessList(this.connection, this.id)
        .subscribe(({ clientAccess }) => {
          this.userContactForm.controls['fullAccess'].setValue(
            clientAccess.fullAccess
          );
        });
    }

    if (this.isUserContactActive) {
      this.getOfficesList();
      this.usersService
        .getUser(this.id)
        .pipe(takeUntil(this.destroy))
        .subscribe((data: User) => {
          let contact: any;

          if (data?.app_metadata?.contacts?.length) {
            contact = data?.app_metadata?.contacts[0];
          }
          this.contactInfo = contact;

          if (contact) {
            this.updateContact(contact);
          } else {
            this.userContactForm.patchValue({
              firstName: data.given_name,
              lastName: data.family_name,
              email: data.email
            });
          }
        });
    }
    this.userContactsService
      .getClientAccessList(this.connection, this.id)
      .subscribe((res) => {
        this.clientAccessObj = res;
      });
  }

  private updateContact(contact): void {
    if (contact) {
      this.userOfficeId = contact.officeId?._id;
      this.userContactForm.patchValue({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email[0],
        title: contact.title,
        mobile: Helper.splitValuesInMyTelFormat(contact.mobile),
        office: contact.officeId?._id,
        officeNum: Helper.splitValuesInMyTelFormat(contact.office),
        fax: Helper.splitValuesInMyTelFormat(contact.fax),
        type: contact.type?._id,
        address: {
          address: contact?.address?.line,
          zipCode: contact?.address?.zipcode,
          city: contact?.address?.city,
          state: contact?.address?.state
        },
        companyType: 'User',
        parentCompany: contact.officeId?.division?.name,
        note: contact.note?.notes
      });
    }
  }

  public getGroupRoles(groups: Group[]) {
    this.rolesSubscription = forkJoin(
      groups.map(({ _id }) => this.groupsService.getGroupRoles(_id, true))
    )
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.userRoles = res
          .flat()
          .filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);
      });
  }

  public onOfficeChange({ value }) {
    const divisionId = this.offices.find((el) => el._id === value)?.division
      ?._id;

    if (divisionId) {
      this.divisionsService
        .retriveDivisionById(divisionId)
        .pipe(takeUntil(this.destroy))
        .subscribe((res) => {
          this.userContactForm.controls['parentCompany'].setValue(res.name);
        });
    } else {
      this.userContactForm.controls['parentCompany'].setValue('');
    }
  }

  public onClientAccess() {
    this.userContactsService
      .getClientAccessList(this.connection, this.id)
      .pipe(
        switchMap((res) => {
          return forkJoin({
            fullAccess: of(res.clientAccess.fullAccess),
            restrictedClientByOffice: this.contactInfo?.officeId &&  res.clientAccess?.restricted?.length
            ? this.clientsService.clientSearchList(
                res.clientAccess?.restricted?.length
                  ? res.clientAccess?.restricted
                  : undefined,
                [this.contactInfo.officeId._id],
                undefined,
                String(Number.MAX_SAFE_INTEGER),
                []
              )
            : of([]),
            allClients: this.clientsService.clientSearchList(
              undefined,
              undefined,
              undefined,
              String(Number.MAX_SAFE_INTEGER),
              [...res.clientAccess.allowed, ...res.clientAccess.restricted]
                .length
                ? [...res.clientAccess.allowed, ...res.clientAccess.restricted]
                : []
            ),
            userClientAccess: res.clientAccess.allowed.length
              ? this.clientsService.clientSearchList(
                  res.clientAccess.allowed,
                  undefined,
                  undefined,
                  String(Number.MAX_SAFE_INTEGER),
                  []
                )
              : of([]),
            accessByOffice: this.contactInfo?.officeId
              ? this.clientsService.clientSearchList(
                  undefined,
                  [this.contactInfo.officeId._id],
                  undefined,
                  String(Number.MAX_SAFE_INTEGER),
                  [...res.clientAccess.allowed, ...res.clientAccess.restricted]
                    .length
                    ? [...res.clientAccess.allowed, ...res.clientAccess.restricted]
                    : undefined
                )
              : of([])
          });
        }),
        switchMap((res) => {
          return this.dialog
            .open(ClientAccessDialogComponent, {
              width: '1000px',
              height: '555px',
              data: {
                ...res,
                connection: this.connection,
                userId: this.id,
                officeName: this.contactInfo?.officeId?.name || 'Office'
              }
            })
            .afterClosed();
        }),
        takeUntil(this.destroy)
      )
      .subscribe((res) => {
        if (res) {
          this.cancel.emit();
        }
      });
  }

  public onSaveButtonClick() {

    if (this.userContactForm.invalid) {
      this.userContactForm.markAllAsTouched();
      this.userContactForm.markAsDirty();
      return;
    }
    if (this.groupsToDelete.length) {
      this.deleteUserGroups.emit({
        user_id: this.id,
        groups: this.groupsToDelete
      });
    }
    if (this.userOfficeId !== this.userContactForm.controls['office']?.value) {

    }
    if (this.isClientAccessActive) {
      this.userContactsService
        .getClientAccessList(this.connection, this.id)
        .pipe(
          switchMap(({ clientAccess }) => {
            let restricted = clientAccess?.restricted;
            if (this.userOfficeId !== this.userContactForm.controls['office']?.value) {
              restricted = [];
            }

            return this.userContactsService.updateClientAccessList(
              this.connection,
              this.id,
              {
                clientAccess: Object.assign(clientAccess, {
                  restricted: restricted,
                  fullAccess: this.userContactForm.controls['fullAccess']
                    .value
                })
              }
            );
          })
        )
        .subscribe();

      /* if (this.userContactForm.controls['fullAccess'].value) {
        this.clientsService
          .clientSearchList(
            undefined,
            undefined,
            undefined,
            String(Number.MAX_SAFE_INTEGER)
          )
          .pipe(
            switchMap(({ results }) => {
              return this.userContactsService.updateClientAccessList(
                this.connection,
                this.id,
                {
                  clientAccess: {
                    fullAccess: this.userContactForm.controls['fullAccess']
                      .value,
                    allowed: results
                      .map((item) => item._id)
                      .filter((item) => {
                        return !this.clientAccessObj.clientAccess.restricted.includes(
                          item
                        );
                      }),

                    restricted: this.clientAccessObj.clientAccess.restricted
                  }
                }
              );
            })
          )
          .subscribe();
      } else {
        this.userContactsService
          .getClientAccessList(this.connection, this.id)
          .pipe(
            switchMap(({ clientAccess }) => {
              return this.userContactsService.updateClientAccessList(
                this.connection,
                this.id,
                {
                  clientAccess: Object.assign(clientAccess, {
                    fullAccess: this.userContactForm.controls['fullAccess']
                      .value
                  })
                }
              );
            })
          )
          .subscribe();
      } */
    }

    if (this.contactInfo) {
      this.saveUser.emit({
        ...({
          family_name: this.userContactForm.controls['lastName'].value,
          given_name: this.userContactForm.controls['firstName'].value,
          email: this.userContactForm.controls['email'].value,
          user_id: this.id
        } as UsersViewModel),
        groups: this.userView.groups
      });
      const address = this.userContactForm.controls['address'].value;
      const updateContactPayload = {
        firstName: this.userContactForm.controls['firstName'].value,
        lastName: this.userContactForm.controls['lastName'].value,
        email: [this.userContactForm.controls['email'].value],
        companyType: 'User',
        isActive: true,
        title: this.userContactForm.controls['title'].value,
        companyId: this.organizationId,
        officeId: this.userContactForm.controls['office']?.value,
        mobile: Helper.parseMyTelFCValue(this.userContactForm.controls['mobile'].value),
        office: Helper.parseMyTelFCValue(this.userContactForm.controls['officeNum'].value),
        fax: Helper.parseMyTelFCValue(this.userContactForm.controls['fax'].value),
        note: this.userContactForm.controls['note'].value,
        type: this.userContactForm.controls['type'].value,
        address: {
          line: address?.address,
          zipcode: address?.zipCode?.ZipCode ?? address?.zipCode,
          city: address?.city,
          state: address.state?._id,
          stateCode: address.state?.short_name
        }
      };

      this.contactsService
        .updateContact(this.contactInfo._id, updateContactPayload)
        .pipe(takeUntil(this.destroy))
        .subscribe();
    } else {
      if (this.isUserContactActive) {
        this.saveUser.emit({
          ...({
            family_name: this.userContactForm.controls['lastName'].value,
            given_name: this.userContactForm.controls['firstName'].value,
            email: this.userContactForm.controls['email'].value,
            user_id: this.id
          } as UsersViewModel),
          groups: this.userView.groups
        });
      } else {
        this.saveUser.emit({
          ...this.userView,
          groups: this.userView.groups
        });
      }
    }
  }


  public loadMoreContactTypes() {
    const currentSize =
      this.contactTypePagination.page * this.contactTypePagination.perPage;
    if (currentSize > this.contactTypePagination.total) {
      this.isContactTypesLoading = false;
      return;
    }
    this.contactTypePagination.total += 1;
    this.loadContactTypes();
  }

  public loadContactTypes() {
    this.isContactTypesLoading = true;
    this.userContactsService
      .getContactTypes(this.contactTypePagination)
      .pipe(filter((res) => !!res.results))
      .subscribe((res) => {
        this.contactTypes = res.results;
        this.contactTypePagination.total = res.pagination.total;
        this.isContactTypesLoading = false;
      });
  }

  public onCancelClicked() {
    this.cancel.emit();
  }

  public onDelete() {
    this.deleteUser.emit({
      id: this.userView.user_id,
      name: this.userView.name
    });
  }

  public groupsChanged({ value }) {
    this.groupsToDelete = this.groupsTemp.filter(
      ({ _id: id1 }) => !value.some(({ _id: id2 }) => id2 === id1)
    );

    if (!value?.length) {
      this.rolesSubscription.unsubscribe();
      this.userRoles = [];
      return;
    }
    this.getGroupRoles(value);
  }

  public deleteGroups(group: Group) {
    this.groupsToDelete.push(group);

    if (!this.userGroups.length) {
      this.userRoles = [];
      return;
    }

    this.getGroupRoles(this.userGroups.filter((g) => g._id !== group._id));
  }

  public onReset() {
    this.usersService
      .resetPassword(this.connection, {
        email: this.userView.email
      })
      .subscribe(({ message }) => {
        this.snackbarService.showsAlertMessage(message);
      });
  }

  public onRevoke() {
    this.saveUser.emit({ ...this.userView, blocked: !this.userView.blocked });
  }

  public onContactDetails() {
    const searchPayload = {
      filter: {
        firstName: this.userContactForm.controls['firstName'].value,
        lastName: this.userContactForm.controls['lastName'].value,
        email: this.userContactForm.controls['email'].value,
        companyTypes: ['User']
      }
    };

    this.contactsService
      .contactsSearch(searchPayload)
      .pipe(
        switchMap(({ results }) => {
          return this.dialog
            .open(UserDetailsDialogComponent, {
              width: '640px',
              data: {
                ...this.userView,
                userContacts: results,
                connection: this.connection,
                organizationId: this.organizationId,
                isUnlink: !!this.contactInfo
              }
            })
            .afterClosed();
        }),
        takeUntil(this.destroy)
      )
      .subscribe((data) => {
        if (data?.isUpdateOnLinking) {
          this.updateTable.emit();
        }
      });
  }

  private _getUserData(userId: string) {
    this.usersService.getUser(userId).subscribe((data: User) => {
      this.user = data;

      this.userView = UsersMapper.userToUserViewModel(
        this.user,
        this.allGroups,
        this.allRoles
      );
    });
  }

  public getOfficesList(onScroll?: boolean, noLoader = false) {
    if (onScroll) {
      this.isOfficesLoading = true;
    }

    this.officesService
      .getOfficesList(
        undefined,
        undefined,
        String(this.officcesOffset + this.officesLimit),
        undefined,
        noLoader
      )
      .subscribe((res) => {
        const { results } = res;
        if (onScroll) {
          this.isOfficesLoading = false;
        }
        this.offices = results;
        this.officcesOffset += this.officesLimit;
        this.isOfficesLoading = this.officcesOffset >= res.pagination.total;
      });
  }

  ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
