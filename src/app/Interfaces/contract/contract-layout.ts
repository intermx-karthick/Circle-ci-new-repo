export interface Contract {
    _id: string;
    contractName: string;
    contractId: number;
}

export interface ContractVendor {
    _id: string;
    name: string;
}

export interface ContractHeaderFooter {
    _id: string;
    contract: Contract;
    siteId: string;
    vendor: ContractVendor;
    createdAt: Date;
    createdBy: string;
    footer: string;
    header: string;
    updatedAt: Date;
    updatedBy: string;
    vendorRep?: any;
    version?: any;
    id: string;
    styles?:string;
}

export interface ContractTerms {
    _id: string;
    contract: Contract;
    siteId: string;
    vendor: ContractVendor;
    backTerm: string;
    createdAt: Date;
    createdBy: string;
    frontTerm: string;
    updatedAt: Date;
    updatedBy: string;
    vendorRep?: any;
    version?: any;
    id: string;
}

