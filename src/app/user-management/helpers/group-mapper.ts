import { Group, GroupDetailsView } from "../models/group.model";
import { Role } from "../models/roles.model";
import { User } from "../models/users.model";

export class GroupMapper {
    public static groupToGroupDetailsViewModel(group: Group, roles: Role[] = [], users: User[] = []): GroupDetailsView {
        let groupDetailView: GroupDetailsView = {
            _id: group._id,
            name: group.name,
            roles,
            members: users,
            description: group.description
        }

        return groupDetailView;
    }
}