export interface Views {
  defaultViewId: number;
}

export interface UserMetadata {
  views: Views;
}

export interface Identity {
  user_id: string;
  provider: string;
  connection: string;
  isSocial: boolean;
}

export interface Features {
  gpAudience: Role;
  gpInventory: Role;
}

export interface Explore {
  features: Features;
  status: string;
  view: boolean;
}

export interface Role extends Support{
  edit: boolean;
}

export interface Places {
  status: string;
  edit: boolean;
  view: boolean;
  marker: string;
  features: Role;
}

export interface Help extends Role{
  url: string;
}

export interface Support {
  status: string;
  view: boolean;
}

export interface UserModuleAccess {
  gpAudience: Role;
  projects: Role;
  explore: Explore;
  markets: Role;
  places: Places;
  reports: Role;
  share: Role;
  help: Help;
  profile: Role;
  settings: Role;
  support: Support;
}

export interface Permission {
  read: string;
  write: boolean;
  view: boolean;
}

export interface Permissions {
  vendor: Permission;
  inventory: Permission;
  site_config: Permission;
  site_admin: Permission;
}

export interface V2UserDetailsRepsonse {
  email: string;
  emailVerified: boolean;
  name: string;
  nickName: string;
  picture: string;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  legacyUserId: string;
  'given-name': string;
  accountIds: number[];
  user_metadata: UserMetadata;
  identities: Identity[];
  user_module_access: UserModuleAccess;
  permissions: Permissions;
}


