import { Vendor } from './vendors-search.response';
import { MediaType } from './media-types.response';
import { ClassificationType } from './media-class.response';
import { PlaceType } from './place-types.response';
import { ConstructionType } from './structure-types.response';
import { StatusType } from './status-types.interface';
import { IllumnationType } from './illumnation-type.interface';

type MediaClassReadType = 'Left' | 'Right' | 'Center' | 'Parallel';
type MediaClassFacingType = 'Facing' | 'Orientation';

export interface GeneralForm {
  vendor: Vendor;
  vendor_office?: any;
  shipping_address?: any;
  geopath_frame_id?: any,
  geopath_spot_id?: any,
  vendor_frame_id: any,
  vendor_spot_id?: any,
  loc_description: string, // no details about this excel
  lat?: number,
  lng?: number,
  street_address?: string,
  city?: string,
  state?: string,
  zip?: string;
}

export class NameAndAttrForm {
  media_class: ClassificationType;
  media_type: MediaType;
  place_type: PlaceType;
  vendor_media_name: string;
  media_description?: string;
  structure_type?: ConstructionType;
  digital: boolean;
  unit_height?: number;
  unit_width?: number;
  impressions?: number;
  impressions_source?: any;
  category_restrictions?: any;
  unit_grade?: any;
  unit_grade_notes?: any;
  note?: string;
}

export interface MediaClassPlaceForm {
  location_description?: string;
  place_name: string;
  placement_type: {
    id: number;
    name: string;
    description: string;
    updated_desc?: string;
  };
  floor_of_place?: number;
  floors_can_see_unit?: number;
  unit_elevation?: number;
  operational_status?: StatusType;
  construction?: Date;
}

export interface MediaClassRoadSideForm {
  location_description: string;
  primary_street?: string;
  cross_street?: string;
  street_side?: string;
  distance_and_direction?: string;
  read?: MediaClassReadType;
  facing?: MediaClassFacingType;
  unit_elevation?: any;
  operational_status?: any;
  construction?: Date;
}

export interface MaterialDigitalForm {
  full_motion?: boolean;
  partial_motion?: boolean;
  interative?: string;
  audio_enabled?: boolean;
  pixel_height?: number;
  pixel_width?: number;
  ad_share_of_voice?: number;
  spot_share_of_voice?: number;
  avg_spot_length?: number;
  avg_spots_in_loop?: number;
  other_content?: string;
}

export interface MaterialNonDigitalForm {
  materail_requirement: any;
  substrate_type?: any;
  mechanical_rotation?: boolean;
  type_of_illumination?: IllumnationType;
}

export type MediaClassForm = MediaClassPlaceForm & MediaClassRoadSideForm;
export type MaterialForm = MaterialDigitalForm & MaterialNonDigitalForm;

export interface ClosedInventoryFormPayload {
  general: GeneralForm;
  nameAndAttr: NameAndAttrForm;
  mediaClass: MediaClassForm;
  materialDetails: MaterialForm;
}
