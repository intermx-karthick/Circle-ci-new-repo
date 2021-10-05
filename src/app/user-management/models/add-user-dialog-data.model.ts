import { Group } from './group.model';
import { Role } from './roles.model';

export interface AddUserDialogData {
  roles: Role[];
  groups: Group[];
  siteName: string;
  userContactsAccess: any;
}
