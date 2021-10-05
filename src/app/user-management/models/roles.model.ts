export interface Role {
  _id?: string
  name?: string;
  applicationType?: string;
  applicationId?: string;
  description?: string;
  permissions?: string [];
  users: string[];
}