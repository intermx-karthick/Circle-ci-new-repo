import { State } from './contacts';

export interface ShippingAddress {
  _id: string;
  deletedAt: null;
  designator: string;
  businessName: string;
  email: string;
  phoneNumber: string;
  contactName: string;
  address: string;
  city: string;
  state: string | State;
  zipcode: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingAddressPayload {
  designator?: string;
  businessName?: string;
  email?: string;
  phoneNumber?: string;
  contactName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}
