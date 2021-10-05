export interface Note {
    _id?: string;
    notes?: string;
    owner?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface NotePagination {
  total?: number;
  page?: number;
  perPage?: number;
}

export enum NoteMessage {
    vendor = 'Vendor',
    contact = 'Contact',
    vendorContact = 'Vendor contact',
    clientContact = 'Client contact',
    agencyContact = 'Agency contact',
    client = 'Client',
    agency = 'Agency',
    clientAccounting = 'Client accounting'
}