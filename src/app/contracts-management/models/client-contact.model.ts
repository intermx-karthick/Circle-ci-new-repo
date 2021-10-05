export interface ClientContact {
  address: Address;
  companyId: Company;
  companyType: string;
  createdAt: string;
  createdBy: string;
  current: boolean;
  email: any[]
  ext: string;
  fax: string;
  firstName: string;
  id: string;
  lastName: string;
  mobile: string;
  note: any;
  office: string;
  updatedAt: string;
  updatedBy: string;
  _id: string;
}

interface Address {
    city: any;
    line: any;
    zipcode: any;
}

interface Company {
    name: string;
    organizationType: string;
    organizationTypeId: string;
    parentCompany: any;
    _id: string;
}