import { Injectable } from '@angular/core';

export const TabLinkType = {
  VENDOR: 0,
  CLIENT: 1,
  AGENCY: 2,
  CONTACT: 3,
  PRODUCT: 4,
  CAMPAIGN: 5,
  ESTIMATE: 6,
  LINEITEM: 7,
  CONTRACTS: 8,
  JOBS: 9,
  JOBS_PO: 10
};

@Injectable({
  providedIn: 'root'
})
export class TabLinkHandler {
  origin = location.origin;

  public open(type: number, id: string, auxiliaryId = '') {
    let url = '';
    switch (type) {
      case TabLinkType.VENDOR: {
        url = `${this.origin}/records-management-v2/vendors/${id}`;
        break;
      }
      case TabLinkType.CLIENT: {
        url = `${this.origin}/records-management-v2/clients/${id}`;
        break;
      }
      case TabLinkType.AGENCY: {
        url = `${this.origin}/records-management-v2/agencies/${id}`;
        break;
      }
      case TabLinkType.CONTACT: {
        url = `${this.origin}/records-management-v2/contacts/${id}`;
        break;
      }
      case TabLinkType.PRODUCT: {
        url = `${this.origin}/records-management-v2/clients/${id}?tab=products&id=${auxiliaryId}`;
        break;
      }
      case TabLinkType.ESTIMATE: {
        url = `${this.origin}/records-management-v2/clients/${id}?tab=estimates&id=${auxiliaryId}`;   
        break;
      }
      case TabLinkType.CAMPAIGN: {
        url = `${this.origin}/workspace-v3/projects/${id}`;
        break;
      }
      case TabLinkType.LINEITEM: {
        url = `${this.origin}/contracts-management/contracts/${id}?tab=lineitem&id=${auxiliaryId}`;
        break;
      }
      case TabLinkType.CONTRACTS: {
        url = `${this.origin}/contracts-management/contracts/${id}`;
        break;
      }
      case TabLinkType.JOBS_PO: {
        url = `${this.origin}/jobs/${id}?tab=po`;
        break;
      }
    }
    window.open(url, '_blank');
  }
}
