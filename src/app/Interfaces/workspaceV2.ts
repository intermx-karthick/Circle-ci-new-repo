import {Filter} from '@interTypes/filter';
import {ILocationFilters} from '@interTypes/ILocationFilters';
import {MarketThresholdFilter} from '@interTypes/threshold';

export interface Folder {
  folderId: string;
  scenarioId: string[];
}
export interface Customer {
  name?: string;
  notes?: string;
  email?: string;
}
export interface Project {
  _id: string;
  name: string;
  description: string;
  notes?: string;
  tags?: string[];
  customer?: Customer;
  scenarios?: Scenario[];
  subProjects?: any[];
  folders?: Folder[];
  isSubProject?: boolean;
  parentId?: string;
  owner?: string;
  createdAt: Date;
  updatedAt: Date;
  scenarioCount?: number;
  subProjectCount?: number;
  foldersCount?: number;
  packageCount?: number;
  ownerEmail?: string;
  ownerName?: string;
  accountId?: number;
  isDraft?: boolean;
}
export interface SubProject {
  _id: string;
  name: string;
  description?: string;
  notes?: string;
  tags?: string[];
  customer?: Customer;
  scenarios?: Scenario[];
  subProjects?: any[];
  folders?: Folder[];
  isSubProject?: boolean;
  parentId?: string;
  owner?: string;
  createdAt: Date;
  updatedAt: Date;
  scenarioCount?: number;
  subProjectCount?: number;
  foldersCount?: number;
  packageCount?: number;
}
export interface Scenario {
  _id: string;
  name: string;
  description: string;
  units: number;
  unitIds: any;
  audience: any;
  audienceKey: any;
  market: any;
  marketId: any;
  date: string;
  impressions: any;
  trp: any;
  reach: any;
  frequency: any;
  start: any;
  end: any;
}

export interface ProjectsList {
  projects: Project[];
}

export interface CreateProjectReq {
  name: string;
  description?: string;
  tags?: string[];
  notes?: string;
  customer?: Customer;
  scenarios?: string[];
  subProjects?: string[];
  parentId?: string;
  folders?: Folder[];
}
export interface NewProjectDialog {
  subProjectLabel?: string;
  isProject: boolean;
  dialogTitle: string;
  projectName?: string;
  projectDesc?: string;
  namePlaceHolder: string;
  descPlaceHolder: string;
  parents?: any;
  parentName?: string;
  parentId?: string;
  projectId?: string;
}
export interface ScenarioDialog {
  subProjectLabel?: string;
  dialogTitle: string;
  scenarioName?: string;
  scenarioDesc?: string;
  namePlaceHolder: string;
  descPlaceHolder: string;
  projectPlaceHolder: string;
  buttonLabel: String;
  projectId: string;
}
export interface DuplicateProjectReq {
  _id: string;
  name: string;
  description?: string;
}
export interface DuplicateScenarioReq {
  scenario: {
    name: string;
  };
}
export interface ConfirmationDialog {
  notifyMessage?: boolean;
  confirmTitle?: string;
  confirmDesc?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  messageText?: string;
  headerCloseIcon?: boolean;
  disableCancelBtn?: boolean;
  secondayCancelBtnText?: string;
}
export interface DeleteProject {
  _id: string;
}

export interface NewSubProjectDialog {
  isProject: boolean;
  dialogTitle: string;
  subProjectName?: string;
  subProjectDesc?: string;
  namePlaceHolder: string;
  nameValidError: string;
  descPlaceHolder: string;
  subProjectLabel?: string;
  parents?: any;
  parentName?: string;
  parentId?: string;
  projectId?: string;
}
export interface WorkflowLables {
  project: string[];
  folder: string[];
  scenario: string[];
  subProject: string[];
}

export interface Duration {
  _id?: string;
  duration: number;
  unit: string;
  isDefault: boolean;
}
export interface Goals {
  trp: number;
  reach: number;
  frequency: number;
  duration: number;
  imp: number;
  type: string;
  effectiveReach: number;
  allocationMethod?: string;
}

export interface Query {
  audience: Filter;
  market: Market;
  operators?: string[];
  goals: Goals;
  mediaTypeFilters: any[];
  locks?: any;
  measureRangeFilters: any [];
  mediaAttributes?: any;
  locationFilters?: any;

}
export interface GeopathQuery {
  audience: string;
  market: string;
  goals: Goals;
  mediaTypeFilters: any[];
}
export interface MarketPlanTargets {
  audiences: Filter[];
  markets: Market[];
  // to send to API
  operators?: string[];
  // To be used within the UI
  operatorsArray?: Filter[];
  goals: Goals;
  mediaTypeFilters?: any[];
  measureRangeFilters?: MarketThresholdFilter[];
  locationFilters?:  ILocationFilters[] ;
}

export interface Market {
  id?: any;
  name: string;
  marketsGroup?: Filter[];

}
export interface Plan {
  query: Query;
  // TODO Need to update the interface here for the result from GP API
  // TODO Need to find out how to map the plan value when the data is sent and returned from the GP API with the query value
  plan?: any;
  totalMarketInventoryInfo?: any;
  _id?: string;
}
export interface MarketPlan {
  targets: MarketPlanTargets;
  plans?: Plan[];
}

export interface IntAttachments {
  id: string;
  title: string;
  data: [];
  attachments: [];
}

export interface GeopathSummaryQuery {
  plan_id?: any;
  target_geography_list?: string[];
  inventory_market_list?: string[];
  summary_level_list: string[];
  frame_media_name_list?: string[];
  classification_type_list?: string[];
  operator_name_list?: string[];
  construction_type_list?: string[];
  media_type_list?: string[];
  digital?: boolean;
  measures_range_list?: any[];
  status_type_name_list?: string[];
}

export interface MarketTotalInventory {
  marketId: string;
  spots: number;
  media: string;
  operator: string;
  classificationType: string;
}
export declare module GeopathInventoryPlan {
  export interface Goal {
    period_days: number;
    measure: string;
    value: number;
  }

  export interface MediaTypeGroupList {
    classification_type_list: string[];
    construction_type_list: any[];
    media_type_list: string[];
    frame_media_name_list: any[];
    digital: boolean;
  }

  export interface PlanQuery {
    target_segment: string;
    target_geography_list?: string[];
    allocation_method: string;
    goal: Goal;
    media_type_group_list: MediaTypeGroupList[];
    measures_release?: any;
  }
}
export interface FilterPosition {
  index: number;
  newPosition: Postion;
}

interface Postion {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ProjectListQueryParams {
  perPage?: number;
  page?: number;
  sortField?: string;
  sortOrder?: string;
  q?: string;
  fieldSet?: string
}

export interface PlanViewState {
  planId: string;
  viewBy: ViewByType;
}

export type ViewByType = 'Media' | 'Operator';
