export interface InvoicePagination {
    total?: number;
    found?: number;
    page: number;
    perPage: number;
    pageSize?: number;
}

export interface Dma {
    id: string;
    name: string;
}

export interface Type {
    _id: string;
    name: string;
}
export interface Agency {
    id: string;
    name: string;
    type: Type
    _id: string;
}
export interface BillingCompany{
    fax: string; 
    name: string;
    organizationType: string;
    organizationTypeId: string;
    parentCompany: string;
    parentCompanyId: string;
    phone: string;
    _id: string;
}
export interface CheckPoints {
    _id: string;
    name: string;
}
export interface Division{
    _id: string;
    name: string;
}
export interface MediaAgency{
    _id: string;
    id: string;
    name: string;
    organizationId: string;
}
export interface Office{
    _id: string;
    name: string;
}
export interface ParentClient{
    clientName: string;
    _id: string;
    id: string;
    
}
export interface Client{
    clientName: string;
    creativeAgency: string;
    division: Division;
    id: string;
    mediaAgency: MediaAgency;
    mediaClientCode: string;
    office: Office;
    oiClientCode: string;
    parentClient: ParentClient;
    _id: string;
}
export interface ParentCompany{
    name: string;
    organizationType: string;
    _id: string;
}
export interface CompanyId{
    name: string;
    organizationType: string;
    organizationTypeId: string;
    _id: string;
    parentCompany: ParentCompany;

}
export interface ClientContact{
    companyId: CompanyId;
    companyType: string;
    email: string[]
    firstName: string;
    id: string;
    lastName: string;
    mobile: string;
    note: string;
    office: string;
    type: Type;
    _id: string;
}
export interface CreativeAgency{
    id: string;
    name: string;
    type: Type;
    _id: string;
}
export interface LineItems{
    cancelledAt: string;
    clientCostTotal: number;
    clientMaterialCost: number;
    clientNotes: string;
    clientProduct: string;
    contact: string;
    createdAt: string;
    createdBy: string;
    deletedAt: string;
    designQty: number;
    designator: string;
    dma: Dma;
    filesDate: string;
    installCost: number;
    internalNotes: string;
    itemStatus: Type;
    jobId: string;
    lineItemId: string;
    materialDeliveryDate: string;
    materialShippingDate: string;
    materials: number;
    mediaType: Type;
    noOfPeriods: number;
    oiCommissionAmt: number;
    oiCommissionPercentage: number
    periodLength: string;
    printer: string;
    printerNetTotal: number;
    productionNotes: string;
    proofsApprovedDate: string;
    proofsDate: string;
    revisedAt: string;
    revisedBy: string;
    salesTax: number;
    shippingCost: number;
    shippingType: Type;
    siteId: string;
    startDate: string;
    state: string;
    stateCode: string;
    substrateType: Type;
    unitHeight: string;
    unitQty: number;
    unitWidth: string;
    updatedAt: string;
    updatedBy: string;
    vendor: string;
    vendorNotes: string;
    venueType: Type;
    _id: string;
}
export interface Record {
    acctgJobId: string;
    agency: Agency;
    billingCompany: BillingCompany;
    billingContact: string;
    billingNote: string;
    checkPoints: CheckPoints[];
    client: Client;
    clientContact: ClientContact;
    createdAt: string;
    createdBy: string;
    creativeAgency: CreativeAgency;
    displayCostOption: Type;
    dueDate: string
    installationTotal: number;
    invoiceDate: string;
    invoiceId: string;
    jobId: string;
    jobTotal: number;
    lineItems: LineItems[];
    materialsTotal: number;
    name: string;
    oohMediaContact: string;
    poNumber: string;
    producer: Type;
    project: string;
    receivableAddress: string;
    shippingTotal: number;
    siteId: string;
    startDate: string;
    status: Type;
    totalAuthorizedAmount: number;
    totalCommission: number;
    totalFee: number;
    totalTax: number;
    updatedAt: string;
    updatedBy: string;
    _id: string;

}
export interface InvoiceResponse{
    record: Record;
    pagination: InvoicePagination;
}