import {
  AbstractCreateInventoryPayload,
  Construction,
  IlluminationType,
  Layouts,
  Representation3,
  PlacementType,
  Location,
  MediaType,
  StatusType,
  ClassificationType
} from './abstract-create-inventory-payload';

export class CreateInventoryPayload implements AbstractCreateInventoryPayload {
  id: number;
  audio: boolean;
  notes?: any;
  digital: boolean;
  layouts: Layouts;
  location: Location;
  rotating: boolean;
  max_width: number;
  max_height: number;
  media_name: string;
  media_type: MediaType;
  created_dtm: Date;
  current_ind: boolean;
  description?: any;
  full_motion: boolean;
  interactive: boolean;
  status_type: StatusType;
  updated_dtm: Date;
  construction: Construction;
  partial_motion: boolean;
  placement_type: PlacementType;
  plant_frame_id: string;
  representations: Representation3[];
  construction_date: Date;
  illumination_type: IlluminationType;
  classification_type: ClassificationType;
  max_pixel_width?: any;
  illumination_end_time: string;
  max_pixel_height?: any;
  illumination_start_time: string;
  photos: any[];
  place_name?: string; // not in json
}
