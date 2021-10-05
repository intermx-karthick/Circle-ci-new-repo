// These are the properties needed to synscronize the movements between dual maps
export interface MapProperties {
  center?: Coordinates;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  mapName?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
