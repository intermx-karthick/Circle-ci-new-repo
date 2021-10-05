export interface VendorContact {
  type?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  workPhone?: string;
  mobilePhone?: string;
  homePhone?: string;
  fax?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

export interface VendorPayload {
  name: string;
  type?: string[];
  parentCompany?: string;
  notes?: string;
  taxIdNumber?: string;
  email?: string;
  businessPhone?: string;
  businessFax?: string;
  businessWebsite?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  currentFlag?: string;
  opsApprovedFlag?: string;
  doNotUseFlag?: string;
  retirementDate?: string;
  parentFlag?: boolean;
  diversityOwnership?: string[];
  pubA_id?: string;
  pubA_edition?: string;
  pubB_id?: string;
  pubB_edition?: string;
  contacts?: VendorContact[];
}


