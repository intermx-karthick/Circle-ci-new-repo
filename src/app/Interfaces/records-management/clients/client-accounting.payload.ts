export interface ClientAccountingPayload {
  clientName: string;
  accountingDept: string;
  fileSystemId: string;
  pubIdType: string;
  invoiceFormat: string;
  invoiceDelivery: string;
  uploadCostType: string;
  clientCodeRequired: boolean;
  clientCodeNotes: string[];
  billingCompany: string;
  billingContact: string;
  billingNotes: string[];
}



