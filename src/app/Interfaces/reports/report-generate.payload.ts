
export interface GenerateReportFilterParameters {
    costType: string;
    reportDisplayName: string;
    startDate: string;
    endDate: string;
    revisedSince?: string;
    enteredSince?: string;
    division?: string[];
    office?: string[];
    clientType?: string[];
    contractNumber?: string;
    contractName?: string;
    campaign?: string[];
    clientParent?: string[];
    agency?: string[];
    clientCode?: string;
    client?: string;
    productCode?: string;
    product?: string[];
    vendor?: string[];
    parentVendor?: string[];
    mediaClass?: string[];
    placeType?: string[];
    digitalOnly?: boolean;
    mediaType?: string[];
    displayName?: string;
    estimate?: string;
    estimateName?: string[];
    programmaticPartner?: string[];
    dma?: string[];
    invoiceDate?: string;
    dueDate?: string;
    invoice?: string;
    invoiceNotes?: string;
    includeDeletedIos?: boolean;
    lineItemIds?: string;
}

export interface GenerateReportFilters {
    category: string;
    type: string;
    parameters: GenerateReportFilterParameters;
}
