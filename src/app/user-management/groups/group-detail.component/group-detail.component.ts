import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GroupMapper } from 'app/user-management/helpers/group-mapper';
import {
  Group,
  GroupDetailsView
} from 'app/user-management/models/group.model';
import { Role } from 'app/user-management/models/roles.model';
import { User } from 'app/user-management/models/users.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-group-detail',
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.less']
})
export class GroupDetailComponent implements OnInit {
  public group: Group;
  public groupView: GroupDetailsView = <GroupDetailsView>{};

  public filteredRoles: Observable<Role[]>;
  public roles: Role[] = [];
  public users: User[] = [];

  private groupUsers: User[];
  private groupRoles: Role[];

  public rolesToDelete: Role[] = [];
  public usersToDelete: User[] = [];

  public rolesTemp: Role[] = [];
  @Input() disableEdit = false;

  @Input() set groupData(value: Group) {
    if (!value) {
      return;
    }

    this.group = value;

    if (this.group.members) {
      this.getUserValues(this.group.members);
    }

    if (this.group.roles) {
      this.getUserRoles(this.group.roles);
    }
  }

  @Input() set allUsers(value: User[]) {
    if (!value) {
      return;
    }

    this.users = value;

    if (this.group.members) {
      this.getUserValues(this.group.members);
    }
  }

  @Input() set allRoles(value: Role[]) {
    if (!value) {
      return;
    }

    this.roles = value;

    if (this.group.roles) {
      this.getUserRoles(this.group.roles);
    }
  }

  @Output() deleteGroup: EventEmitter<Group> = new EventEmitter<Group>();
  @Output() deleteGroupUsers: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteGroupRoles: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancel: EventEmitter<Group> = new EventEmitter<Group>();
  @Output()
  saveGroup: EventEmitter<GroupDetailsView> = new EventEmitter<GroupDetailsView>();
  disableGroupSelection = false;

  constructor(public dialog: MatDialog) {}

  ngOnInit() {
    this.rolesTemp = this.groupView.roles;
    if(this.disableEdit){
      this.disableGroupSelection = true;
    }

  }

  getUserValues(userIds: string[]) {
    this.groupUsers = this.users.filter((user) =>
      userIds.includes(user.user_id)
    );
    this.groupView = GroupMapper.groupToGroupDetailsViewModel(
      this.group,
      this.groupRoles,
      this.groupUsers
    );
  }

  getUserRoles(userRoleIds: string[]) {
    this.groupRoles = this.roles.filter((value) =>
      userRoleIds.includes(value._id)
    );
    this.groupView = GroupMapper.groupToGroupDetailsViewModel(
      this.group,
      this.groupRoles,
      this.groupUsers
    );
  }

  deleteRoles(role: Role) {
    this.rolesToDelete.push(role);
  }

  deleteUsers(user: User) {
    this.usersToDelete.push(user);
  }

  onDeleteClick() {
    this.deleteGroup.emit(this.group);
  }

  remove(user: User): void {
    const index = this.groupView.members.indexOf(user);

    if (index >= 0) {
      this.usersToDelete = this.groupView.members.splice(index, 1);
    }
  }

  onCancelClick(): void {
    this.cancel.emit(this.group);
  }

  onSubmit() {
    this.usersToDelete = this.usersToDelete.filter(
      (role) => !this.groupView.members.includes(role)
    );

    if (this.rolesToDelete.length) {
      this.deleteGroupRoles.emit({
        group_id: this.group._id,
        roles: this.rolesToDelete
      });
    }

    if (this.usersToDelete.length) {
      this.deleteGroupUsers.emit({
        group_id: this.group._id,
        users: this.usersToDelete
      });
    }

    this.saveGroup.emit(this.groupView);
  }

  onRolesChanged({ value }) {
    this.rolesToDelete = this.rolesTemp.filter((role) => !value.includes(role));
  }
}
