// This is the format of address to get coordinates from mapbox geocoding API
export interface Address {
  name?: string;
  street?: string;
  zipcode?: string;
  city?: string;
  state?: string;
}