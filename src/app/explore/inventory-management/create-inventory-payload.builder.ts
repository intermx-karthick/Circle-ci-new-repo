import {
  ClosedInventoryFormPayload,
  ConstructionType,
  GeneralForm,
  MaterialForm,
  MediaClassForm,
  NameAndAttrForm,
} from '@interTypes/inventory-management';
import {
  Construction,
  Representation,
  Location,
  Geometry,
} from './abstract-create-inventory-payload';
import { CreateInventoryPayload } from './create-inventory.payload';

/**
 * @description
 * CreateInventoryPayload object builder
 */
export class CreateInventoryPayloadBuilder extends CreateInventoryPayload {

  setValuesFromGeneralForm(generalForm: GeneralForm) {
    return this;
  }

  setValuesFromNameAndAttrForm(nameAndAttrForm: NameAndAttrForm) {
    this.setValueWithoutUpdateDesc('media_type', nameAndAttrForm.media_type);
    this.media_name = nameAndAttrForm.vendor_media_name;
    this.digital = nameAndAttrForm.digital;
    this._notes = nameAndAttrForm.note;
    this.max_width = + (nameAndAttrForm.unit_width['feet'] * 12 + (+nameAndAttrForm.unit_width['inches']));
    this.max_height = + (nameAndAttrForm.unit_height['feet'] * 12 + (+nameAndAttrForm.unit_height['inches']));
    this.setValueWithoutUpdateDesc('classification_type', nameAndAttrForm?.media_class);
    return this;
  }

  setValuesFromMediaClassForm(mediaClassForm: MediaClassForm) {
    this.setValueWithoutUpdateDesc('placement_type', mediaClassForm?.placement_type);
    this.setValueWithoutUpdateDesc('status_type', mediaClassForm?.operational_status);
    return this;
  }

  setValuesFromMaterialForm(materialDigitalForm: MaterialForm) {
    this.setValueWithoutUpdateDesc('illumination_type', materialDigitalForm?.type_of_illumination);
    this._max_pixel_height = materialDigitalForm?.pixel_height;
    this._max_pixel_width = materialDigitalForm?.pixel_width;
    this.rotating = materialDigitalForm?.mechanical_rotation;
    return this;
  }

  setLocation(inventoryForm: ClosedInventoryFormPayload) {
    this.location = this.location ?? {} as Location;
    this._location_latitude = +inventoryForm.general.lat;
    this._location_longitude = +inventoryForm.general.lng;
    this._location_elevation = inventoryForm.mediaClass?.unit_elevation;
    this._location_zip_code = inventoryForm.general.zip;
    this._location_state = inventoryForm.general.state;
    this._location_primary_read = inventoryForm.general.street_address;
    this._location_geometry = inventoryForm.general;
    return this;
  }

  setConstruction(inventoryForm: ClosedInventoryFormPayload) {
    this.construction = {} as Construction;
    this._construction_created_dtm = inventoryForm.mediaClass?.construction;
    this._construction_type = inventoryForm.nameAndAttr?.structure_type;
    this._construction_description = inventoryForm.nameAndAttr?.media_description;
    return this;
  }

  setRepresentations(inventoryForm: ClosedInventoryFormPayload) {
    this.representations = new Array(1);
    this.representations[0] = { account: {} } as Representation;
    this.representations[0].account.parent_account_id = inventoryForm.general.vendor.accountId;
    this.representations[0].account.parent_account_name = inventoryForm.general.vendor.name;
    return this;
  }

  setLayouts(inventoryForm: ClosedInventoryFormPayload) {
    this.full_motion = inventoryForm.materialDetails?.full_motion;
    this.partial_motion = inventoryForm.materialDetails?.partial_motion;
    this.interactive = inventoryForm.materialDetails?.interative as any;
    this.audio = inventoryForm.materialDetails?.audio_enabled;
    return this;
  }

  build(): CreateInventoryPayload {
    return this;
  }

  private setValueWithoutUpdateDesc(field: string, value: any) {
    if(!value) return;
    this[field] = {
      id: value.id,
      name: value.name,
      description:value.description
    };
  }

  private set _construction_type(data: ConstructionType) {
    if (!data) {
      return;
    }
    this.construction.construction_type = {
      id: data.id,
      name: data.name,
      description: data.description
    };
  }

  private set _notes(val: string){
    if(!val) return;
    this.notes = val;
  }

  private set _construction_created_dtm(date: Date){
    if(!date) return;
    this.construction.created_dtm = date;
  }

  private set _location_geometry(generalForm: GeneralForm){
    if(!generalForm.lat || !generalForm.lng) return;
    this.location.geometry = {} as Geometry;
    this.location.geometry.coordinates= [
      generalForm.lng,
      generalForm.lat,
    ];
  }

  private set _construction_description(data: string){
    if(!data) return;
    this.construction.description = data.trim() ? data : undefined;
  }

  private set _location_primary_read(data: string){
    if(!data) return;
    this.location.primary_read = data.trim() ? data : undefined;
  }

  private set _location_latitude(data: number){
    if(!data) return;
   this.location.latitude = data;
  }

  private set _location_longitude(data: number){
    if(!data) return;
    this.location.longitude = data;
  }


  private set _location_elevation(data: number){
    if(!data) return;
    this.location.elevation = data;

  }

  private set _location_state(data: string){
    if(!data) return;
    // set undefined - It's removed from payload object
    this.location.state = data.trim() ? data : undefined; 
  }

  private set _location_zip_code(data: string){
    if(!data) return;
    this.location.zip_code = data.trim() ? data : undefined;
  }

  private set _max_pixel_height(data: number){
    if(typeof(data)!== 'number') return;
    this.max_pixel_height = data;
  }

  private set _max_pixel_width(data: number){
    if(typeof(data)!== 'number') return;
    this.max_pixel_width = data;
  }
}
