import { SiteStatuses } from '../enums';
import { Auth0 } from './auth0';

export interface Site {
  _id: string;
  siteName: string;
  site: string;
  accountOwner: string;
  ownerEmail: string;
  siteUrl: string;
  url: string;
  logo: Logo;
  clientId: string;
  status?: Status;
  acAdministrator: string;
  administratorEmail: string;
  createdAt: string;
  retiredDate: string;
  auth0: Auth0;
  organizationId: string;
  auth0Connections: string;
}

export interface SiteApiModel {
  auth0: Auth0;
  auth0Connections: string;
  authenticationFlowV2: boolean;
  background: any;
  basemaps: any;
  clientId: string;
  color_sets: any;
  customize: any;
  gpLogin: boolean;
  home: string;
  homepage: string;
  inventoryStatuses: any;
  landingPage: string;
  legal: string;
  logo: Logo;
  orientation: string;
  productName: string;
  publicSite: boolean;
  retiredDate: any;
  sameAsOwner: boolean;
  site: string;
  siteName: string;
  status: Status;
  title: string;
  version: string;
  welcome: string;
  workflow: any;
  _id: string;
  acAdministrator: string;
  administratorEmail: string;
  createdAt: string;
  ownerEmail: string;
  accountOwner: string;
  url: string;
  organizationId: string;
  siteUrl: string;
}

export interface SitesApiResponce {
  pagination: Pagination;
  results: SiteApiModel[];
}

interface Pagination {
  total: number;
  page: number;
  perPage: number;
  pageSize: number;
}

interface Logo {
  mini_logo: string;
  full_logo: string;
}

export type LogoType = keyof Logo;

type Status =
  | SiteStatuses.active
  | SiteStatuses.creating
  | SiteStatuses.disabled
  | SiteStatuses.retired;
