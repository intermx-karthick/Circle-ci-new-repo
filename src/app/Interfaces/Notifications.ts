import {UserData} from '@interTypes/User';

export interface NotificationTypeGenericForm {
  _id: string;
  name: string;
  label: string;
  icon?: string;
}
export interface NotificationCategoryResponse {
  notificationTypes: NotificationTypeGenericForm[];
}

export interface Link {
  _id?: string;
  label: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleData {
  module?: any;
  model?: any;
  id?: any;
  scenarioId?: string;
  projectId?: string;
  entityType: 'ScenarioInventoryPlans' | 'ScenarioReports' | 'InventoryReports';
}

export interface Notification {
  _id: string;
  recipient?: string | UserData;
  siteId?: any;
  isRead: boolean;
  links: Link[];
  title: string;
  message: string;
  icon?: string;
  alertType: NotificationTypeGenericForm;
  status: NotificationTypeGenericForm;
  notificationType: NotificationTypeGenericForm;
  moduleData: ModuleData;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  jobs?: Job;
  recipientObj?: object;
}

export interface Job {
  _id: string;
  status: string;
}
export interface NotificationType {
  _id: string;
  name: string;
  notifications: Notification[];
  count: number;
  page: number;
  perPage: number;
  jobStatus?: 'completed' | 'inProgress';
}
export interface NotificationsState {
  initial: boolean;
  reset: boolean;
  notifications: NotificationType[];
}

export interface NotificationsListResponse {
  types: NotificationType[];
}
export interface NotificationTypesResponse {
  alertTypes: NotificationTypeGenericForm[];
}
export interface UnreadNotificationsCount {
  count: number;
  lastModified: string;
}
export interface Site {
  domains: string[];
  restricted: string[];
  allowed: string[];
  default: boolean;
  _id: string;
  environment: string;
  siteId: string;
  siteName: string;
}

export interface SiteNotification {
  domains: string[];
  restricted: string[];
  allowed: string[];
  default: boolean;
  siteId: string;
  environment: string;
  site: string;
  siteName: string;
}
export interface SitesList {
  accessControls: SiteNotification[];
}
export interface Audience {
  site: string;
  recipient: string;
}

export interface NotificationCreateRequest {
  audience: Audience;
  alertType: string;
  notificationType: string;
  status: string;
  title: string;
  message: string;
  links: Link[];
}
export interface Pagination {
  total: number;
  page: number;
  perPage: number;
}
export interface NotificationResults {
  pagination: Pagination;
  results: Notification[];
}
export interface IconState {
  isEmpty: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
}
