export interface CreateUpdateContract {
  client?: {},
  buyer?: {},
  contractName?:  string,
  project?:  string,
  poNumber?:  string,
  clientContact?:  string,
  totalAuthorizedAmount?: number,
  cancellationPrivilege?:  string,
  status?:  string,
  contractEvents?: string[]
}