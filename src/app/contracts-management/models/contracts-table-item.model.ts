export interface ContractsTableItem {
    id: string; 
    contractId: number;
    clientName: string;
    contractName: string;
    totalNet: number | string;
    totalGross: number | string;
    totalTax: number | string;
    totalFee: number | string;
    totalClientNet: number | string;
    fromDate: string;
    endDate: string;
    contractStatus: string;
    office: string;
    buyer: string;
    dateCreated: string;
    lastModified: string;
  }
  
  export interface DisplayedColumns {
    displayname: string;
    name: string;
  }