import generate_color from 'color';
import { LayerProperties } from '../interfaces';
import { NetworkVolumeLayer } from './network-volume-layer';
export class NetworkVolumeOdChoroplethLayer {
    default_max_volume = 60000;
    color = '#9166AB';
    max_volume = 0;
    is_using_data_joins = false;

    network_config = {
        source_layer_id: 'links',
        road_color: '#000000',
        transit_color: '#000000',
        fallback_color: 'yellow' // to make errors obvious
    };
    blockgroup_config = {
        source_layer_id: 'blockgroups',
        geo_color_matrix: [
            ['#E8E8E8', '#DFB0D6', '#BE64AC'],
            ['#ACE4E4', '#A5ADD3', '#8C62AA'],
            ['#5AC8C8', '#5698B9', '#3B4994']
        ],
        border_color: '#EEEEEE'
    };
    o_config = {
        source_layer_id: 'points_o',
        data_filename: 'points_o.choropleth.v1.json.gz',
        color: '#5AC8C8'
    };
    d_config = {
        source_layer_id: 'points_d',
        data_filename: 'points_d.choropleth.v1.json.gz',
        color: '#BE64AC'
    };
    get_network_sublayer(params: LayerProperties) {
        const { layer_id, source_id, source_layer, zoom, networkMode } = params;

        const color =
            'transit' === networkMode
                ? this.network_config.transit_color
                : 'road' === networkMode
                ? this.network_config.road_color
                : this.network_config.fallback_color;
        const networkVolumeLayer = new NetworkVolumeLayer();
        const sublayer = networkVolumeLayer.get_network_sublayer({
            layer_id: params.layer_id,
            source_id: params.source_id,
            source_layer: source_layer || this.network_config.source_layer_id,
            zoom: [Math.max(params.zoom[0], 9), Math.min(params.zoom[1], 22)],
            color: color,
            active_color: params.active_color,
            max: params['max'],
            max_line_width: params.max_line_width,
            is_using_data_joins: true
        });
        return sublayer;
    }
    get_blockgroup_geo_sublayer(params: LayerProperties) {
        const { layer_id, source_id, source_layer, zoom, color } = params;
        this.max_volume = params['max_volume'] || this.default_max_volume;
        this.color = color || this.color;
        this.is_using_data_joins = Boolean(params.is_using_data_joins);
        const max_volume = params.max;

        return {
            id: layer_id,
            type: 'fill',
            source: source_id,
            'source-layer': this.blockgroup_config.source_layer_id,
            minzoom: Math.max(zoom[0], 9),
            maxzoom: Math.min(zoom[1], 15),
            paint: {
                'fill-color': this.build_fill_color(),
                'fill-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    0.75,
                    15,
                    0
                ]
            }
        };
    }
    build_fill_color() {
        /*
      const norm_boost_factor = 3
      const o_norm = [
          '+',
          [ 'var', 'o_norm' ],
          [
              '/',
              [ '-', 1, [ 'var', 'o_norm' ] ],
              norm_boost_factor,
          ],
      ]
      const d_norm = [
          '+',
          [ 'var', 'd_norm' ],
          [
              '/',
              [ '-', 1, [ 'var', 'd_norm' ] ],
              norm_boost_factor,
          ],
      ]
      */
        const o_norm = ['var', 'o_norm'];
        const d_norm = ['var', 'd_norm'];
        const color_matrix = this.blockgroup_config.geo_color_matrix;
        return [
            'let',
            'o_norm',
            ['number', ['feature-state', 'o_norm'], 0],
            'd_norm',
            ['number', ['feature-state', 'd_norm'], 0],
            [
                'case',
                /* eslint-disable indent */
                ['<', o_norm, 0.33],
                [
                    'case',
                    ['<', d_norm, 0.33],
                    color_matrix[0][0],
                    ['<', d_norm, 0.67],
                    color_matrix[0][1],
                    color_matrix[0][2]
                ],
                ['<', o_norm, 0.67],
                [
                    'case',
                    ['<', d_norm, 0.33],
                    color_matrix[1][0],
                    ['<', d_norm, 0.67],
                    color_matrix[1][1],
                    color_matrix[1][2]
                ],
                [
                    'case',
                    ['<', d_norm, 0.33],
                    color_matrix[2][0],
                    ['<', d_norm, 0.67],
                    color_matrix[2][1],
                    color_matrix[2][2]
                ]
                /* eslint-enable indent */
            ]
        ];
    }
    get_blockgroup_border_sublayer(params) {
        const { layer_id, source_id, source_layer, zoom, color } = params;
        return {
            id: layer_id,
            type: 'line',
            source: source_id,
            'source-layer': this.blockgroup_config.source_layer_id,
            minzoom: Math.max(zoom[0], 9),
            maxzoom: Math.min(zoom[1], 15),
            paint: {
                'line-color': this.blockgroup_config.border_color,
                'line-width': 1,
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
            },
        }
    }

    get_points_sublayer(params) {
        const { layer_id, source_id, source_layer, zoom, color } = params;
        return {
            id: layer_id,
            type: 'circle',
            source: source_id,
            'source-layer': source_layer,
            minzoom: Math.max(zoom[0], 14),
            maxzoom: zoom[1],
            paint: {
                'circle-color': color,
                'circle-radius': {
                    base: 1.75,
                    stops: [
                        [12, 2],
                        [22, 180]
                    ]
                },

                'circle-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    0,
                    15,
                    [
                        'case',
                        ['boolean', ['feature-state', 'is_included'], false],
                        1,
                        0
                    ]
                ]
            }
            // feature-state is yet not supported in filter (or layout), so one day:
            /*
            filter: [], // has a point_count
            */
        };
    }
}
