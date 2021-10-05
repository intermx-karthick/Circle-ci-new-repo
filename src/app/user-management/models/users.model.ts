import { Group } from './group.model';
import { Role } from './roles.model';

export interface User {
  email?: string;
  email_verified?: boolean;
  user_id?: string;
  picture?: string;
  nickname?: string;
  identities?: UserIdentities[];
  updated_at?: string;
  created_at?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  // app_metadata?: {
  //   authorization?: {
  //     roles?: UserGroups[];
  //     permissions?: string[];
  //   };
  // };
  last_ip?: string;
  last_login?: string;
  logins_count?: number;
  blocked?: boolean;
  app_metadata?: any;
  office?: string;
}

export interface UserIdentities {
  user_id?: string;
  provider?: string;
  connection?: string;
  isSocial?: boolean;
}

export interface UserGroups {
  _id: string;
  name?: string;
  description?: string;
}

export interface UsersViewModel {
  email?: string;
  nickname?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  user_id?: string;
  organization?: string;
  address?: string;
  groups?: Group[];
  roles?: Role[];
  blocked?: boolean;
  userContacts?: any;
  connection?: string;
  organizationId?: string;
  isUnlink?: boolean;
  app_metadata?: any;
  office?: string;
}
