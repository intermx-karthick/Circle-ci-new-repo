export interface JobDetailsCheckPoint {
    _id: string;
    name: string;
}

export interface JobDetailsDivision {
    _id: string;
    name: string;
}

export interface JobDetailsOffice {
    _id: string;
    name: string;
}

export interface JobDetailsMediaAgency {
    _id: string;
    name: string;
    organizationId: string;
    id: string;
}

export interface JobDetailsCreativeAgency {
    _id: string;
    name: string;
    organizationId: string;
    id: string;
}

export interface JobDetailsClient {
    _id: string;
    clientName: string;
    parentClient?: any;
    division: JobDetailsDivision;
    office: JobDetailsOffice;
    mediaAgency: JobDetailsMediaAgency;
    creativeAgency: JobDetailsCreativeAgency;
    organizationId: string;
    mediaClientCode?: any;
    id: string;
}

export interface JobDetailsAgencyType {
    _id: string;
    name: string;
}

export interface JobDetailsAgency {
    _id: string;
    name: string;
    type: JobDetailsAgencyType;
    id: string;
}

export interface JobDetailsBillingCompany {
    _id: string;
    organizationType: string;
    name: string;
    parentCompany?: any;
    phone?: any;
    fax?: any;
    billingEmail?: any;
    parentCompanyId?: any;
    organizationTypeId: string;
}

export interface JobDetailsBillingContactCompanyId {
    _id: string;
    organizationType: string;
    name: string;
    parentCompany?: any;
    organizationTypeId: string;
}

export interface JobDetailsBillingContact {
    email: any[];
    _id: string;
    firstName: string;
    lastName: string;
    companyId: JobDetailsBillingContactCompanyId;
    companyType: string;
    mobile?: any;
    office?: any;
    note?: any;
    id: string;
}

export interface JobDetailsClientContactType {
    _id: string;
    name: string;
}

export interface JobDetailsClientContactCompanyId {
    _id: string;
    organizationType: string;
    name: string;
    parentCompany?: any;
    organizationTypeId: string;
}

export interface JobDetailsClientContact {
    email: string[];
    _id: string;
    firstName: string;
    lastName: string;
    type: JobDetailsClientContactType;
    companyId: JobDetailsClientContactCompanyId;
    companyType: string;
    mobile: string;
    office: string;
    note?: any;
    id: string;
}

export interface JobDetailsCreativeAgencyType {
    _id: string;
    name: string;
}

export interface JobDetailsCreativeAgency {
    _id: string;
    name: string;
    type: JobDetailsCreativeAgencyType;
    id: string;
}

export interface JobDetailsDisplayCostOption {
    _id: string;
    name: string;
}

export interface JobDetailsProducer {
    _id: string;
    name: string;
}

export interface JobDetailsProject {
    _id: string;
    name: string;
}

export interface JobDetailsRecordStatus {
    _id: string;
    name: string;
}

export interface JobDetails {
    jobTotal: number;
    materialsTotal: number;
    shippingTotal: number;
    installationTotal: number;
    totalTax: number;
    totalFee: number;
    _id: string;
    checkPoints: JobDetailsCheckPoint[];
    client: JobDetailsClient;
    name: string;
    siteId: string;
    updatedBy: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    jobId: string;
    acctgJobId: string;
    agency: JobDetailsAgency;
    billingCompany: JobDetailsBillingCompany;
    billingContact: JobDetailsBillingContact;
    billingNote: string;
    jobNote: string;
    clientContact: JobDetailsClientContact;
    creativeAgency: JobDetailsCreativeAgency;
    displayCostOption: JobDetailsDisplayCostOption;
    dueDate: string;
    invoiceDate: string;
    invoiceId: string;
    oohMediaContact: string;
    poNumber: string;
    producer: JobDetailsProducer;
    project: JobDetailsProject;
    startDate: string;
    status: JobDetailsRecordStatus;
    totalAuthorizedAmount: number;
    totalCommission: string;
}

