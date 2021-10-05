import { User } from "./users.model";
import { Role } from "./roles.model";

export interface Group {
  _id: string,
  name?: string,
  description?: string,
  mappings?: GroupMapping[],
  members?: string[],
  nested?: string[],
  roles?: string[]
}

export interface GroupMapping {
  _id: string,
  groupName: string,
  connectionName: string
}

export interface GroupUserRole {
  name?: string;
  role?: string;
  user?: string;
}

export interface GroupDetailsView {
  _id?: string;
  name?: string;
  description?: string,
  members?: User[];
  roles?: Role[];
  mappings?: GroupMapping[];
}