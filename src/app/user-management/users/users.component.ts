import {
  AuthenticationService,
  SnackbarService,
  ThemeService
} from '@shared/services';
import { DOCUMENT } from '@angular/common';
import { Component, ViewChild, OnDestroy, Inject } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, ReplaySubject, of } from 'rxjs';
import { take, takeUntil, catchError, switchMap } from 'rxjs/operators';
import {
  GroupsService,
  UsersService,
  SitesService,
  ModuleAccessesService,
  ContactsService,
  UserContactsService
} from '../services';
import {
  Group,
  User,
  UsersViewModel,
  Site,
  SiteApiModel,
  Role
} from '../models';
import { SitesMapper, UsersMapper } from '../helpers';
import { AddUserDialogComponent } from './add-user-dialog/add-user-dialog.component';
import { perPageLimit } from '../consts';
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.less']
})
export class UsersComponent implements OnDestroy {
  public isDetailsSelect = false;
  public isOfficeDetailsSelect = false;

  public rows: UsersViewModel[] = [];
  public temp: UsersViewModel[] = [];
  public expanded: any = {};
  public timeout: any;

  public roles: Role[];
  public groups: Group[];
  public users: User[];
  public sites: Site[];

  public selectedSite: Site;

  public pageLimitOptions: number[] = [10, 20, 50, 100];
  public currentPageLimit = perPageLimit;
  public limit: number = perPageLimit;
  public offset = 0;

  public ColumnMode = ColumnMode;

  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);

  public actionsList = ['Edit', 'Revoke', 'Delete', 'Reset PWD'];

  public isComplete = false;
  public isSitesListLoading = false;

  public mouseOverRow: any = undefined;

  public isDetailExpanded = false;
  public expandedRow = undefined;

  public themeSettings: any;

  public userContactsAccess: any;
  public clientAccess: any;

  public isUpdate = false;
  public isUpdateOnLinking = false;

  public updateFilterValue: string;
  public updateOfficeFilterValue: string;

  @ViewChild('usersTable') table: any;

  public isSiteAdmin = false;

  constructor(
    private usersService: UsersService,
    private groupsService: GroupsService,
    public dialog: MatDialog,
    private sitesService: SitesService,
    private moduleAccessesService: ModuleAccessesService,
    private contactsService: ContactsService,
    private userContactsService: UserContactsService,
    private snackbarService: SnackbarService,
    @Inject(DOCUMENT) private document: Document,
    private theme: ThemeService,
    private authenticationService: AuthenticationService
  ) {
    this.authenticationService
      .getUserDetailsUsingAuth0Token()
      .subscribe(({ permissions }) => {
        this.isSiteAdmin = permissions?.site_admin?.write;
        this.getSitesList();
      });
    this.themeSettings = this.theme.getThemeSettings();
  }

  public openAddUsersDialog() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '640px',
      position: { bottom: '0' },
      panelClass: 'add-user-dialog',
      data: {
        groups: this.groups,
        roles: this.roles,
        siteName: this.selectedSite.siteName,
        userContactsAccess: this.userContactsAccess
      }
    });
    dialogRef
      .afterClosed()
      .pipe(
        switchMap((data) => {
          if (data) {
            const { firstName, lastName, email, password, groups } = data;

            const payload = {
              given_name: firstName,
              family_name: lastName,
              name: `${firstName} ${lastName}`,
              email,
              connection: this.selectedSite.auth0.connections,
              password
            };

            const contactPayload = {
              firstName,
              lastName,
              email: [email],
              officeId: data.office?._id,
              division: data.division?.name,
              address: {
                line: data.line,
                zipcode: data.zipcode,
                city: data.city,
                state: data.state?.state,
                stateCode: data.state?.short_name
              },
              office: data.business,
              mobile: data.mobile,
              companyId: this.selectedSite.organizationId,
              companyType: 'User',
              isActive: true
            };

            this.isUpdate = data.isUpdate;

            if (data.isSaveAsContact) {
              return this.contactsService.createContact(contactPayload).pipe(
                switchMap((res) => {
                  return this.usersService.createUser(payload).pipe(
                    switchMap((resUser) => {
                      this.snackbarService.showsAlertMessage(
                        `User "${firstName} ${lastName}" created and saved as contact record successfully`
                      );

                      return this.userContactsService
                        .sync(this.selectedSite.auth0.connections, {
                          identities: [
                            {
                              connection: this.selectedSite.auth0.connections,
                              user_id: resUser?.user_id,
                              provider: 'auth0',
                              isSocia: false
                            }
                          ],
                          email,
                          emailVerified: resUser.email_verified,
                          name: `${firstName} ${lastName}`,
                          nickName: email.split('@')[0],
                          userId: resUser.user_id,
                          picture:
                            // tslint:disable-next-line:max-line-length
                            'https://s.gravatar.com/avatar/218227314bde5b05f6e1ca702263265d?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fc2.png'
                        })
                        .pipe(
                          switchMap(() => {
                            return this.userContactsService.linkContactWithUser(
                              this.selectedSite.auth0.connections,
                              resUser.user_id,
                              res.data.id
                            );
                          }),
                          switchMap(() => {
                            if (groups?.length) {
                              return this.usersService.addUserGroups(
                                resUser?.user_id,
                                groups
                              );
                            } else {
                              return of([]);
                            }
                          })
                        );
                    })
                  );
                }),
                takeUntil(this.destroy)
              );
            } else {
              return this.usersService.createUser(payload).pipe(
                switchMap((res) => {
                  this.snackbarService.showsAlertMessage(
                    `User "${firstName} ${lastName}" created`
                  );

                  this.userContactsService
                    .sync(this.selectedSite.auth0.connections, {
                      identities: [
                        {
                          connection: this.selectedSite.auth0.connections,
                          user_id: res?.user_id,
                          provider: 'auth0',
                          isSocia: false
                        }
                      ],
                      email,
                      emailVerified: res.email_verified,
                      name: `${firstName} ${lastName}`,
                      nickName: email.split('@')[0],
                      userId: res.user_id,
                      picture:
                        // tslint:disable-next-line:max-line-length
                        'https://s.gravatar.com/avatar/218227314bde5b05f6e1ca702263265d?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fc2.png'
                    })
                    .subscribe();

                  if (groups?.length) {
                    return this.usersService.addUserGroups(
                      res?.user_id,
                      groups
                    );
                  } else {
                    return of([]);
                  }
                }),
                catchError(({ error }) => {
                  this.snackbarService.showsAlertMessage(error.message);
                  return of(null);
                })
              );
            }
          } else {
            return of(null);
          }
        }),
        takeUntil(this.destroy)
      )
      .subscribe(() => {
        if (this.isUpdate) {
          this._getAllUsers(this.selectedSite.auth0.connections);
          this._getAllGroups();
          this.isUpdate = false;
        }
      });
  }

  updateFilter(event: any) {
    const val = event?.target?.value?.toLowerCase() ?? event;
    this.updateFilterValue = val;

    const temp = this.temp.filter((d) => {
      return d.name.toLowerCase().indexOf(val) !== -1 || !val;
    });

    this.rows = temp;
    this.table.offset = 0;
  }

  updateOfficeFilter(event: any) {
    const val = event?.target?.value?.toLowerCase() ?? event;
    this.updateOfficeFilterValue = val;

    const temp = this.temp.filter((d) => {
      return d.office.toLowerCase().indexOf(val) !== -1 || !val;
    });

    this.rows = temp;
    this.table.offset = 0;
  }

  onTableUpdate() {
    this._getAllUsers(this.selectedSite.auth0.connections);
    this._getAllGroups();
  }

  onPage(event) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {}, 100);
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(expanded) {
    this.expandedRow = expanded;
    this.isDetailExpanded = !this.isDetailExpanded;
  }

  onDetailsSelectToggle() {
    this.isOfficeDetailsSelect = false;
    this.isDetailsSelect = !this.isDetailsSelect;
    if (!this.isDetailsSelect) {
      this.updateFilter('');
    }
  }

  onOfficeDetailsSelectToggle() {
    this.isDetailsSelect = false;
    this.isOfficeDetailsSelect = !this.isOfficeDetailsSelect;
    if (!this.isOfficeDetailsSelect) {
      this.updateOfficeFilter('');
    }
  }

  onSaveUser(event: UsersViewModel) {
    const {
      user_id,
      family_name,
      given_name,
      nickname,
      blocked,
      email,
      groups
    } = event;
    forkJoin({
      users: this.usersService.updateUser(user_id, {
        family_name,
        given_name,
        nickname,
        name: `${given_name} ${family_name}`,
        email,
        blocked
      }),
      groups: groups.length
        ? this.usersService.addUserGroups(user_id, groups)
        : of([])
    })
      .pipe(
        catchError(() => {
          return of(null);
        }),
        takeUntil(this.destroy)
      )
      .subscribe(
        () => {},
        () => {},
        () => {
          this.snackbarService.showsAlertMessage(
            `User "${given_name} ${family_name}" updated successfully`
          );
          this._getAllUsers(this.selectedSite.auth0.connections);
          this._getAllGroups();
          this.isDetailExpanded = false;
        }
      );
  }

  public onDeleteUser({ id, name }) {
    this.usersService
      .deleteUser(id)
      .pipe(take(1))
      .subscribe(() => {
        this.snackbarService.showsAlertMessage(
          `User "${name}" deleted successfully`
        );
        this._getAllUsers(this.selectedSite.auth0.connections);
        this._getAllGroups();
        this.isDetailExpanded = false;
      });
  }

  public onTableMouseOver(row: any) {
    this.mouseOverRow = row;
  }

  public onTableMouseLeave(event: any) {
    const tableCard = this.document.querySelector('.table-card');

    if (
      tableCard !== this.document.elementFromPoint(event.clientX, event.clientY)
    ) {
      return;
    }

    this.mouseOverRow = undefined;
  }

  public async onDeleteUserGroups({ user_id, groups }) {
    const groupsPromise: Promise<Group>[] = [];

    for await (const group of groups) {
      groupsPromise.push(
        await this.groupsService
          .deleteGroupMembers(group._id, [{ user_id }])
          .toPromise()
      );
    }

    Promise.all(groupsPromise).finally(() => {
      this._getAllUsers(this.selectedSite.auth0.connections);
      this._getAllGroups();
      this.isDetailExpanded = false;
    });
  }

  public onLimitChange({ value }) {
    this.limit = value;
  }

  public onActionChange(event, row) {
    switch (true) {
      case event.target.innerText === 'Edit':
        this.table.rowDetail.toggleExpandRow(row);
        break;
      case event.target.innerText === 'Revoke':
        this.usersService
          .getUser(row.user_id)
          .pipe(
            switchMap((res) => {
              const {
                user_id,
                family_name,
                given_name,
                nickname,
                blocked,
                email
              } = res;

              return this.usersService.updateUser(user_id, {
                family_name,
                given_name,
                nickname,
                name: `${given_name} ${family_name}`,
                email,
                blocked: !blocked
              });
            }),
            takeUntil(this.destroy)
          )
          .subscribe(() => {
            this.snackbarService.showsAlertMessage(
              `User "${row.name}" updated successfully`
            );
            this._getAllUsers(this.selectedSite.auth0.connections);
            this._getAllGroups();
          });
        break;
      case event.target.innerText === 'Delete':
        this.onDeleteUser({ id: row.user_id, name: row.name });
        break;
      case event.target.innerText === 'Reset PWD':
        this.usersService
          .resetPassword(this.selectedSite.auth0.connections, {
            email: row.email
          })
          .subscribe(({ message }) => {
            this.snackbarService.showsAlertMessage(message);
          });
    }
  }

  private _getAllGroups() {
    this.groupsService
      .getAllGroups()
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.groups = res['groups'];
        this._initRows(this.users, this.groups);
      });
  }

  private _getAllUsers(connections: string) {
    this.usersService
      .getAllUsers(connections)
      .pipe(takeUntil(this.destroy))
      .subscribe((res: User[]) => {
        this.users = res;
        this._initRows(this.users, this.groups);
        if (this.updateFilterValue) {
          this.updateFilter(this.updateFilterValue);
        }
        if (this.updateOfficeFilterValue) {
          this.updateFilter(this.updateOfficeFilterValue);
        }
      });
  }

  private _initRows(users: User[], groups: Group[]) {
    this.rows = UsersMapper.usersToUsersViewModel(users, groups);
    this.temp = [...this.rows];
  }

  public getSitesList(onScroll?: boolean, noLoader = false) {
    if (!this.isSiteAdmin) {
      this.onSelectSiteChange(this.themeSettings._id);
    } else {
      if (onScroll) {
        this.isSitesListLoading = true;
      }

      this.sitesService
        .getSitesList(this.offset + this.limit, noLoader)
        .pipe(takeUntil(this.destroy))
        .subscribe((res) => {
          const { results } = res;
          if (onScroll) {
            this.isSitesListLoading = false;
          }
          this.sites = SitesMapper.sitesApiToSites(results);
          this.offset += this.limit;
          this.isComplete = this.offset >= res.pagination.total;
          if (!onScroll) {
            this.onSelectSiteChange(results[0]._id);
          }
        });
    }
  }

  public onSelectSiteChange(id: string): void {
    this.sitesService
      .getSite(id)
      .pipe(takeUntil(this.destroy))
      .subscribe((site: SiteApiModel) => {
        const [mappedSite] = SitesMapper.sitesApiToSites([site]);
        this.selectedSite = mappedSite;
        this._getAllUsers(site.auth0.connections);
        this._getAllGroups();
      });

    this.moduleAccessesService
      .getModuleAccesses(id)
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.userContactsAccess = res?.userManagement?.features?.userContacts;
        this.clientAccess = res?.userManagement?.features?.clientAccess;
      });
  }

  ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
