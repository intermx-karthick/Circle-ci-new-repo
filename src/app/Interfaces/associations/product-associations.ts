export interface ContractLineItem {
    _id: string;
    lineItemId: string;
    clientProduct: string;
}

export interface JobLineItem {
    _id: string;
    lineItemId: string;
}

export interface ProductAssociations {
    contract_line_items: ContractLineItem[]; 
    job_line_items?: JobLineItem[]; // it wont be available for estimates
}