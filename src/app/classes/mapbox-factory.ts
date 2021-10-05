import * as mapboxgl from 'mapbox-gl';

/**
 * @description
 *  to give specify the type of object.
 *
 * @memberOf MapboxFactory
 *
 */
export enum MapboxFactoryEnum {
  MAP = 'map',
  POPUP = 'popup'
}

export interface IMXMapboxPopupDefaultConfig {
  maxWidth: string;
}

export interface IMXMapboxMapDefaultConfig {
}

/**
 * @description
 *  IMXMapbox class to give default config specifications throughout
 *  this project to avoid repeating the same code.
 *
 */
export class IMXMapbox {

  public static getMapDefaultConfig(): IMXMapboxMapDefaultConfig{
    return {};
  }

  public static getPopupDefaultConfig(): IMXMapboxPopupDefaultConfig{
    return {
      maxWidth: 'none'
    };
  }

}

export type MapboxFactoryResultType = mapboxgl.Map | mapboxgl.Popup;

/**
 * @description
 *    This class designed as per factory design pattern to produce
 *  the instance of mapbox map and popup. This will avoid the dependency
 *  and of mapbox library map and popup uses.
 *  So, it will make refactor and migration simple.
 *
 *  use MapboxFactoryEnum to give specify the type of object.
 *
 *
 *@example
 *  this.mapPopup = MapboxFactory.produce(MapboxFactoryEnum.POPUP, {}); // for popup
 *  this.mapPopup = MapboxFactory.produce(MapboxFactoryEnum.MAP, {}); // for map
 */
export class MapboxFactory {

  /**
   * @description
   *  produce the instance of the map and popup
   *
   * @param type - specify the map or popup
   * @param config - config for type of object
   */
  public static produce(type: string, config: any = {}): MapboxFactoryResultType {

    switch (type) {

      case MapboxFactoryEnum.MAP: {
        return new mapboxgl.Map({
          ...IMXMapbox.getMapDefaultConfig(),
          ...config
        });
      }

      case MapboxFactoryEnum.POPUP: {
        return new mapboxgl.Popup({
          ...IMXMapbox.getPopupDefaultConfig(),
          ...config
        });
      }

    }

    return null;

  }

}
