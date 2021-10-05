import { Pagination } from '@interTypes/pagination';


interface AccountingDept {
  _id: string;
  name: string;
}

interface FileSystemId {
  _id: string;
  name: string;
}

interface PubIdType {
  _id: string;
  name: string;
}

interface InvoiceFormat {
  _id: string;
  name: string;
}

interface InvoiceDelivery {
  _id: string;
  name: string;
}

interface UploadCostType {
  _id: string;
  name: string;
}

interface BillingCompany {
  _id: string;
  name: string;
  billingEmail: string;
  type: string;
  phone: string;
  fax: string;
}

interface BillingContact {
  _id: string;
  name: string;
}

export interface ClientsAccountDetails {
  clientName?: string;
  _id: string;
  accountingDept: AccountingDept;
  fileSystemId: FileSystemId;
  pubIdType: PubIdType;
  invoiceFormat: InvoiceFormat;
  invoiceDelivery: InvoiceDelivery;
  uploadCostType: UploadCostType;
  clientCodeRequired: boolean;
  clientCode: string;
  billingCompany: BillingCompany;
  billingContact: BillingContact;
  billingNotes: string;
  vendorPayableCompany: BillingCompany;
  vendorPayableContact: BillingContact;
}

export interface ClientsAccountingResponse {
  pagination: Pagination;
  results: ClientsAccountDetails[];
}



