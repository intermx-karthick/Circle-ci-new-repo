export interface Layers {
  type: 'inventory collection' | 'place collection' | 'place';
  data: any;
}

export interface applyLayers{
  mapId: string
  type: string
  flag: boolean
}
