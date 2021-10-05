import { Group, Role, User, UsersViewModel } from '../models';

export class UsersMapper {
  public static usersToUsersViewModel(
    users: User[],
    groups: Group[]
  ): UsersViewModel[] {
    if (!users || !groups || !groups.length || !users.length) {
      return [];
    }

    return users.map((user) => {
      const userGroups = [];

      groups.forEach((group: Group) => {
        if (group.members.includes(user.user_id)) {
          userGroups.push(group);
        }
      });

      return {
        user_id: user.user_id,
        email: user.email,
        nickname: user.nickname,
        groups: userGroups,
        name:
          user.app_metadata?.contacts?.length &&
          user.app_metadata?.contacts[0]?.firstName &&
          user.app_metadata?.contacts[0]?.lastName
            ? `${user.app_metadata.contacts[0].firstName} ${user.app_metadata?.contacts[0]?.lastName}`
            : user.name,
        given_name: user.given_name,
        family_name: user.family_name,
        blocked: user.blocked,
        office:
          (user.app_metadata?.contacts?.length &&
            user.app_metadata?.contacts[0]?.officeId?.name) ||
          '',
        app_metadata: user.app_metadata
      };
    });
  }

  public static userToUserViewModel(
    user: User,
    groups: Group[] = [],
    roles: Role[]
  ): UsersViewModel {
    if (!user) {
      return;
    }

    const userGroups: Group[] = [];

    groups.forEach((group: Group) => {
      if (group.members.includes(user.user_id)) {
        userGroups.push(group);
      }
    });

    const userRoles: Role[] = [];

    roles.forEach((role: Role) => {
      if (!role.users) {
        return;
      }

      if (role.users.includes(user.user_id)) {
        userRoles.push(role);
      }
    });

    return {
      user_id: user.user_id,
      email: user.email,
      nickname: user.nickname,
      roles: userRoles,
      groups: userGroups,
      name: user.name,
      given_name: user.given_name,
      family_name: user.family_name,
      blocked: user.blocked,
      app_metadata: user.app_metadata
    };
  }
}
