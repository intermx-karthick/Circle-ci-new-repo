import { TimeStamp } from '@interTypes/time-stamp';
import { Contract, ContractDetails, ContractsTableItem, CreateContractResultDialog } from "app/contracts-management/models";
import { BillingExportItem, BillingExportItemsTable } from 'app/contracts-management/models/billing-export.model';
import { ContractLineItem, ContractsLineItemsTable } from 'app/contracts-management/models/contract-line-item.model';
import { CreateUpdateContract } from "app/contracts-management/models/create-contract.model";

export class ContractsMapper {

  public static ToTableViewModel(incoming: Contract[]): ContractsTableItem[] {
    if(!incoming || !incoming.length) {
      return [];
    }

    const contractsTableItems: ContractsTableItem[] = incoming.map((item: Contract): ContractsTableItem => {
      const contractsTableItem: ContractsTableItem = {
        id: item._id,
        contractId: item.contractId,
        clientName: item.client?.clientName,
        contractName: item.contractName,
        totalNet: item.summary?.total?.net,
        totalGross: item.summary?.total?.gross,
        totalTax: item.summary?.total?.tax,
        totalFee: item.summary?.total?.fee,
        totalClientNet: item.summary?.total?.clientNet,
        fromDate: item.startDate,
        endDate: item.endDate,
        contractStatus: item.status?.name,
        office: item.client?.office?.name,
        buyer: item.buyer?.name,
        dateCreated: item.createdAt,
        lastModified: item.updatedAt
      }

      return contractsTableItem;
    })

    return contractsTableItems;
  }

  public static ToDetailsView(incoming: Contract): ContractDetails {
    const contractDetails: ContractDetails = {
      id: incoming._id,
      contractId: incoming.contractId,
      contractName: incoming.contractName,
      startDate: new Date(incoming.startDate),
      endDate: new Date(incoming.endDate),
      mediaClientCode: incoming.client?.mediaClientCode,
      status: incoming.status,
      summary: incoming.summary,
      contractEvents: incoming.contractEvents,
      totalAuthorizedAmount:  incoming.totalAuthorizedAmount === null ? "" : incoming.totalAuthorizedAmount?.toString(),
      poNumber: incoming.poNumber,
      campaign: {
        id: incoming.project?._id,
        value: incoming.project?.name
      },
      buyer: incoming?.buyer,
      client: {
        id: incoming.client?._id,
        value: incoming.client?.clientName
      },
      clientContact: {
        id: incoming.clientContact?._id,
        value: incoming.clientContact?.firstName + ' ' + incoming.clientContact?.lastName /* auto-complete mapper have last name so details mapper changed respect to that  */
      }
    }

    return contractDetails;
  }

  public static ToCreateContractModel(incoming: CreateContractResultDialog): CreateUpdateContract {
    const createContract: CreateUpdateContract = {
      client: incoming.client.id,
      buyer: incoming.buyer?._id,
      project: incoming.campagin,
      contractName: incoming.name,
      poNumber: incoming.number
    }

    return createContract;
  }

  public static getTimeStamp(incoming: Contract): TimeStamp {
    const timeStamp: TimeStamp = {
      createdAt: new Date(incoming.createdAt),
      createdBy: incoming.createdBy,
      updatedAt: new Date(incoming.updatedAt),
      updatedBy: incoming.updatedBy,
    }

    return timeStamp;
  }

  public static toLineItemsTable(incoming: ContractLineItem[]): ContractsLineItemsTable[]  {
    const contractsLineItemsTableElements: ContractsLineItemsTable[] = incoming.map((item: ContractLineItem) => {


      const contractsLineItemsTableElement: ContractsLineItemsTable = {
        clientNet: `$ ${item.net || '0'}.00`,
        description: item.spotDetails?.mediaDescription,
        endDate: item.endDate,
        updatedAt: item.updatedAt,
        lineItemId: item.lineItemId,
        market: item.media?.dma?.name,
        mediaType: item.spotDetails?.mediaType,
        startDate: item.startDate,
        lineItemType: item.lineItemType,
        lineItemStatus: item.itemStatus?.name,
        vendor: item.vendor?.name,
        _id: item._id,
        importskipStatus: item?.import?.skipStatus,
        clientNetTotal:item.clientNet,
        gross: item.totalSummary.gross,
        fee: item.totalSummary.fee,
        tax: item.totalSummary.tax,
        net: item.totalSummary.net,
      }

      return contractsLineItemsTableElement;
    })

    return contractsLineItemsTableElements;
  }

  public static toBillingExportTable(incoming: BillingExportItem[]): BillingExportItemsTable[]  {
    const billingExportItemsTableElements: BillingExportItemsTable[] = incoming.map((item: BillingExportItem) => {


      const billingExportItemsTableElement: BillingExportItemsTable = {
        IODateId: item.IODateId,
        accountingDept: item.accountingDept,
        clientName: item.clientName,
        clientCode: item?.clientCode,
        deletedAt: item.deletedAt,
        deletedStatus: item.deletedStatus,
        doNotExport: item.doNotExport,
        LIdoNotExport: item.LIdoNotExport,
        estimateName: item.estimateName,
        estimateNumber: item.estimateNumber,
        exportedAt: item.exportedAt,
        exportedStatus: item.exportedStatus,
        insertionDate: item.insertionDate,
        lineItemId: item.lineItemId,
        mediaDescription: item.mediaDescription,
        netCost: `${item.netCost || '0'}.00`,
        parentVendor: item.parentVendor?.name,
        productCode: item.productCode,
        productName: item.productName,
        revisedAt: item.revisedAt,
        vendor: item.vendor?.name,
        pubId: item.vendor?.pubA?.id,
        _id: item._id,
      }

      return billingExportItemsTableElement;
    })

    return billingExportItemsTableElements;
  }

}
