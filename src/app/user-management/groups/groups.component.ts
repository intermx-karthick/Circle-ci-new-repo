import { Component, ViewChild, OnDestroy } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { MatDialog } from '@angular/material/dialog';
import {
  AuthenticationService,
  SnackbarService,
  ThemeService
} from '@shared/services';

import { forkJoin, ReplaySubject, of } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import {
  GroupsService,
  UsersService,
  RolesService,
  SitesService
} from '../services';
import { AddGroupDialog } from './add-group-dialog/add-group-dialog';
import {
  User,
  Role,
  AddUpdateGroupApiModel,
  AddUpdateGroupApiResponseModel,
  Group,
  GroupDetailsView,
  Site,
  SiteApiModel
} from '../models';
import { SitesMapper } from '../helpers';
import { perPageLimit } from '../consts';
import { UserRole } from '@interTypes/user-permission';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.less']
})
export class GroupsComponent implements OnDestroy {
  public sites: Site[];
  public selectedSite: Site;
  public isDetailsSelect = false;

  public destroy: ReplaySubject<any> = new ReplaySubject<any>(1);

  @ViewChild('myTable') table: any;

  rows: Group[];
  temp: Group[] = [];
  expanded: any = {};
  timeout: any;

  ColumnMode = ColumnMode;

  public roles: Role[] = [];
  public users: User[] = [];

  public pageLimitOptions: number[] = [10, 20, 50, 100];
  public currentPageLimit = perPageLimit;

  public limit: number = perPageLimit;
  public offset = 0;
  public isComplete = false;
  public isSitesListLoading = false;

  public userGroups = [];

  public isSiteAdmin = false;

  public themeSettings: any;
  disableEdit = false;
  constructor(
    private groupsService: GroupsService,
    private usersService: UsersService,
    private rolesServise: RolesService,
    public dialog: MatDialog,
    public authService: AuthenticationService,
    public sitesService: SitesService,
    private snackbarService: SnackbarService,
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
    this.checkForEditPermission();
  }

  private checkForEditPermission() {
    const userPermission  = this.authenticationService.getUserPermission(UserRole.GROUPS);
    if (userPermission?.edit) {
      this.disableEdit = true;
    }
  }

  public onPage(event) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {}, 100);
  }

  public toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  public onLimitChange({ value }) {
    this.limit = value;
  }

  public onDeleteGroupUsers({ group_id, users }) {
    this.groupsService
      .deleteGroupMembers(group_id, users)
      .pipe(takeUntil(this.destroy))
      .subscribe();
  }

  public onDeleteGroupRoles({ group_id, roles }) {
    this.groupsService
      .deleteGroupRoles(false, roles, group_id)
      .pipe(takeUntil(this.destroy))
      .subscribe();
  }

  public onDetailToggle(event) {}

  public updateFilter(event: any) {
    const val = event?.target?.value?.toLowerCase() ?? event;

    const temp = this.temp.filter((d) => {
      return d.name.toLowerCase().indexOf(val) !== -1 || !val;
    });

    this.rows = temp;
    this.table.offset = 0;
  }

  public onDeleteGroup(event: Group) {
    this.groupsService
      .deleteGroup(false, event._id)
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.snackbarService.showsAlertMessage(
          `Group "${event.name}" deleted successfully`
        );
        this._getAllGroups(this.selectedSite.auth0.connections);
      });
  }

  public onDetailsSelectToggle() {
    this.isDetailsSelect = !this.isDetailsSelect;
    if (!this.isDetailsSelect) {
      this.updateFilter('');
    }
  }

  public openAddGroupDialog(): void {
    const dialogRef = this.dialog.open(AddGroupDialog, {
      width: '640px',
      position: { bottom: '0' },
      panelClass: 'add-group-dialog',
      data: {
        users: this.users,
        roles: this.roles
      }
    });

    dialogRef.afterClosed().subscribe((result: AddUpdateGroupApiModel) => {
      if (!result || !result.name || !result.description) {
        return;
      }

      const group: AddUpdateGroupApiModel = Object.assign(
        {},
        { name: result.name, description: result.description }
      );

      this.groupsService.createGroup(false, group).subscribe((res: any) => {
        forkJoin({
          members: result.users?.length
            ? this.groupsService.addGroupMembers(false, result.users, res._id)
            : of([]),
          roles: result.roles?.length
            ? this.groupsService.addGroupRoles(false, result.roles, res._id)
            : of([])
        }).subscribe(() => {
          this.getSitesList();
        });
      });
    });
  }

  public onSaveGroup(group: GroupDetailsView) {
    const updateGroup: AddUpdateGroupApiModel = {
      _id: group._id,
      name: group.name,
      description: group.description
    };

    this.groupsService
      .updateGroup(false, updateGroup)
      .subscribe((res: AddUpdateGroupApiResponseModel) => {
        forkJoin({
          members: group?.members?.length
            ? this.groupsService.addGroupMembers(false, group.members, res._id)
            : of([]),
          roles: group?.roles?.length
            ? this.groupsService.addGroupRoles(false, group.roles, res._id)
            : of([])
        }).subscribe(() => {
          this.snackbarService.showsAlertMessage(
            `Group "${group.name}" updated successfully`
          );
          this.onSelectSiteChange(this.selectedSite._id);
        });
      });
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

  private _getUserValues(connection: string, groups) {
    this.usersService
      .getAllUsers(connection)
      .pipe(
        switchMap((res) => {
          this.users = res;
          return forkJoin(
            res.map((user: User) => this.getUserGroups(user.user_id))
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe((res) => {
        groups.map((group: Group) => {
          this.userGroups.push(
            res.flat().filter((userGroup) => userGroup.name === group.name)
          );
        });
      });
  }

  public getRowIndex(row: any): number {
    return this.table.bodyComponent.getRowIndex(row);
  }

  private _getUserRoles() {
    this.rolesServise
      .getAllRoles()
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        this.roles = res['roles'];
      });
  }

  private _getAllGroups(connection) {
    this.groupsService
      .getAllGroups()
      .pipe(
        switchMap((res) => {
          this.rows = res['groups'].map((item) =>
            Object.assign(item, {
              membersCount: item?.members?.length ? item.members.length : 0,
              rolesCount: item?.roles?.length ? item.roles.length : 0
            })
          );
          this.temp = [...this.rows];
          return of(res['groups']);
        }),
        takeUntil(this.destroy)
      )
      .subscribe((res) => {
        this._getUserValues(connection, res);
      });
  }

  public onSelectSiteChange(id: string): void {
    this.sitesService
      .getSite(id)
      .pipe(takeUntil(this.destroy))
      .subscribe((site: SiteApiModel) => {
        const [mappedSite] = SitesMapper.sitesApiToSites([site]);
        this.selectedSite = mappedSite;
        this._getAllGroups(site.auth0.connections);
        this._getUserRoles();
      });
  }

  public getUserGroups(id) {
    return this.usersService.getUserGroups(id);
  }

  ngOnDestroy() {
    this.destroy.next(null);
    this.destroy.complete();
  }
}
