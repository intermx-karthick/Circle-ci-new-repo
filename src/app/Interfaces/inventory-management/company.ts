export interface Address {
  name?: string;
  street?: string;
  stateCode?: string;
  city?: string;
  state?: string;
  line?:string;
}
export interface Company {
    address?: Address;
    deletedAt?: any;
    _id: string;
    organizationType: string;
    name: string;
    parentCompany?: any;
    phone?: any;
    fax?: any;
    ext?: any;
    companyEmail?: any;
    billingEmail?: any;
    companyWebsite?: any;
    isActive: boolean;
    isParent: boolean;
    siteId: string;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    parentCompanyId?: any;
    office?:string;
}