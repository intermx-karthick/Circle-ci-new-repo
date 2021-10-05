import { Role } from './roles.model';
import { User } from './users.model';

export class AddUpdateGroupBaseApiModel {
  _id?: string;
  name: string;
  description?: string;
}

export class AddUpdateGroupApiResponseModel extends AddUpdateGroupBaseApiModel {
  members: string[];
  roles: string[];
  message?: string;
}

export class AddUpdateGroupApiModel extends AddUpdateGroupBaseApiModel {
  users?: User[];
  roles?: Role[];
}
