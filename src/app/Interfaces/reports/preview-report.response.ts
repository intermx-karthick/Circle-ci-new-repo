
export interface PreviewReportParameters {
  displayName: string;
  costType: string;
  startDate: string;
  endDate: string;
  revisedSince: string;
  enteredSince: string;
  division: string[];
  office: string[];
  clientType: string[];
  contract: { _id: string, contractName: string};
  campaign: string[];
  clientParent: string[];
  agency: string[];
  client: string[];
  product: string[];
  estimate: string[];
  vendor: string[];
  programmaticPartner: string[];
  mediaClass: string[];
  mediaType: string[];
  parentVendor: string[];
  placeType: string[];
  dma: string[];
  digitalOnly: boolean;
  includeDeletedIos: boolean;
  invoiceDate: string;
  dueDate: string;
  invoice: string;
  lineItemIds: string[];
  invoiceNotes: string;
}

interface PreviewReportResult {
}

export interface PreviewReportResponse {
  _id: string;
  name: string;
  status: string;
  isActive: boolean;
  siteId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  type: string;
  parameters: PreviewReportParameters;
  result: PreviewReportResult;
}
