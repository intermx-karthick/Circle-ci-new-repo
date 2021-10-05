import { ContractsPagination } from "app/contracts-management/models";


export interface Contract {
    _id: string;
    contractId: number;
    contractName: string;
}

export interface Vendor {
    _id: string;
    billingEmail: string;
    email: string;
    name: string;
    organizationId: string;
    parentCompany: string;
    parentCompanyId: string;

}
export interface VendorRepDetails {
    _id: string
    companyType: string;
    email: string[];
    firstName: string;
    lastName: string;
    mobile: string;
    office: string;
    title: string;
}
export interface vendorRep {
    primary: VendorRepDetails;
    secondary: VendorRepDetails;
}

export interface vendorContractRef {
    contractId: string;
    contractVendor: string;
    vendorContractRep: string;
}

export interface VendorContractResult {
    _id: vendorContractRef;
    createdDate: Date;
    endDate: Date;
    issueDate: Date;
    startDate: Date;
    updatedDate: Date;
    totalLineItems: number;
    contract: Contract;
    vendor: Vendor[];
    parentVendor: Vendor[];
    vendorRep: vendorRep[];
    displayVendor: string;
    displayVendorName: string;
    displayVendorEmail: string;
}

export interface VendorContractsResponse {
    pagination: ContractsPagination;
    results: VendorContractResult[];
}