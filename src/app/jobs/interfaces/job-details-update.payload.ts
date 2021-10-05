export interface JobDetailsUpdatePayload {
    name: string;
    client: string;
    producer: string;
    project?: string;
    poNumber?: string;
    startDate?: string;
    clientContact?: string;
    oohMediaContact?: string;
    agency?: string;
    creativeAgency?: string;
    totalAuthorizedAmount?: string;
    checkPoints?: string[];
    status?: string;
    jobNote?: string;
    billingCompany?: string;
    billingContact?: string;
    acctgJobId?: string;
    invoiceId?: string;
    invoiceDate?: string;
    dueDate?: string;
    displayCostOption?: string;
    billingNote?: string;
}

