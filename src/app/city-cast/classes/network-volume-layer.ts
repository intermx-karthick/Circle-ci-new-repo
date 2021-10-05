import generate_color from 'color';
import { LayerProperties } from '../interfaces';
export class NetworkVolumeLayer {
    default_max_volume = 60000;
    color = '#9166AB';
    max_volume = 0;
    is_using_data_joins = false;
    // constructor(params) {
    //   this.max_volume = params['max_volume'] || this.default_max_volume;
    //   this.color = params['color'] || this.color;
    //   return this;
    // }

    get_network_sublayer(params: LayerProperties) {
        const {
            layer_id,
            source_id,
            source_layer,
            zoom,
            color,
            active_color,
            indexes,
            networkIndexes
        } = params;
        this.max_volume = params['max'] || this.default_max_volume;
        this.color = color || this.color;
        this.is_using_data_joins = Boolean(params.is_using_data_joins);
        const max_volume = params.max;

        return {
            id: layer_id,
            type: 'line',
            source: source_id,
            'source-layer': source_layer,
            minzoom: zoom[0],
            maxzoom: zoom[1],
            paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false],
                    active_color,
                    ['boolean', ['feature-state', 'hover'], false],
                    active_color,
                    this.build_color_expression()
                ],
                'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,
                    this.build_width_expression({ min: 0, max: 2 }),
                    7,
                    this.build_width_expression({ min: 0, max: 4 }),
                    24,
                    this.build_width_expression({ min: 1, max: 40 })
                ]
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            }
        };
    }
    build_color_expression() {
        const [light_r, light_g, light_b] = generate_color(this.color)
            .lighten(0.515)
            .saturate(0.515)
            .rgb()
            .array();
        const [dark_r, dark_g, dark_b] = generate_color(this.color)
            .darken(0.666)
            .rgb()
            .array();
        const percent_of_max_volume = [
            '/',
            this.is_using_data_joins
                ? ['number', ['feature-state', 'count'], 0]
                : ['number', ['get', 'volume'], 0],
            this.max_volume
        ];
        const volume_r = this.build_volume_color_value(light_r, dark_r);
        const volume_g = this.build_volume_color_value(light_g, dark_g);
        const volume_b = this.build_volume_color_value(light_b, dark_b);
        return [
            'let',
            'percent_of_max_volume',
            percent_of_max_volume,
            ['rgb', volume_r, volume_g, volume_b]
        ];
    }

    build_volume_color_value(light_value, dark_value) {
        const value_diff = light_value - dark_value;
        return [
            '-',
            light_value,
            ['*', value_diff, ['var', 'percent_of_max_volume']]
        ];
    }
    build_width_expression(params) {
        return [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            params.max,
            ['boolean', ['feature-state', 'hover'], false],
            this.build_hover_width_expression(params),
            this.build_passive_width_expression(params)
        ];
    }
    build_passive_width_expression(params) {
        const min_line_width = params['min'];
        const max_line_width = params['max'];
        return [
            'max',
            min_line_width,
            [
                '*',
                [
                    '/',
                    this.is_using_data_joins
                        ? ['number', ['feature-state', 'count'], 0]
                        : ['number', ['get', 'volume'], 0],
                    this.max_volume
                ],
                max_line_width
            ]
        ];
    }
    build_hover_width_expression(params) {
        const max_line_width = params['max'];
        const width = this.build_passive_width_expression(params);
        const hover_mod = ['-', max_line_width, ['var', 'width']];
        const hover_width = [
            '+',
            ['var', 'width'],
            ['/', ['var', 'hover_mod'], 2]
        ];
        return [
            'let',
            'width',
            width,
            ['let', 'hover_mod', hover_mod, hover_width]
        ];
    }

    get_points_sublayer(params: LayerProperties) {
        const { layer_id, source_id, zoom, color, active_color } = params;
        return {
            id: layer_id,
            type: 'circle',
            source: source_id,
            source_layer_id: source_id,
            minzoom: 0, // Math.max(zoom[0], 14)
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
                // When feature-state supports filter, use:
                // 'circle-opacity': 0.75,
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
        };
    }
}
