import { Role } from "@interTypes/user/v2-user-details.repsonse";
import { User } from "./users.model";

export interface AddGroupDialogModel {
    users: User[]
    roles: Role[]
}