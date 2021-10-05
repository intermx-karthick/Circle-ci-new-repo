import * as Constants from '@mapbox/mapbox-gl-draw/src/constants';
import * as DrawPolygon from '@mapbox/mapbox-gl-draw/src/modes/draw_polygon';
import simplify from '@turf/simplify';

const dragPan = {
    enable(ctx) {
        setTimeout(() => {
            // First check we've got a map and some context.
            if (!ctx.map || !ctx.map.dragPan || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) return;
            // Now check initial state wasn't false (we leave it disabled if so)
            if (!ctx._ctx.store.getInitialConfigValue('dragPan')) return;
            ctx.map.dragPan.enable();
        }, 0);
    },
    disable(ctx) {
        setTimeout(() => {
            if (!ctx.map || !ctx.map.dragPan) return;
            // Always disable here, as it's necessary in some cases.
            ctx.map.dragPan.disable();
        }, 0);
    }
};

const FreeHandDrawMode = Object.assign( Object.create( Object.getPrototypeOf( DrawPolygon )), DrawPolygon);

FreeHandDrawMode.onSetup = function() {
    const polygon = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
            type: Constants.geojsonTypes.POLYGON,
            coordinates: [[]]
        }
    });

    this.addFeature(polygon);

    this.clearSelectedFeatures();
    // doubleClickZoom.disable(this);
    dragPan.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POLYGON);
    this.setActionableState({
        trash: true
    });

    return {
        polygon,
        currentVertexPosition: 0,
        dragMoving: false
    };
};

FreeHandDrawMode.onDrag = FreeHandDrawMode.onTouchMove = function (state, e){
    state.dragMoving = true;
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
    state.currentVertexPosition++;
    state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
}

FreeHandDrawMode.onMouseUp = function (state, e){
    if (state.dragMoving) {
        const tolerance = (3 / ((this.map.getZoom()-4) * 150)) - 0.001; // https://www.desmos.com/calculator/b3zi8jqskw

        simplify(state.polygon, {
            mutate: true,
            tolerance: tolerance,
            highQuality: true
        });

        this.fireUpdate();
        this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
    }
}

FreeHandDrawMode.onTouchEnd = function(state, e) {
    this.onMouseUp(state, e)
}

FreeHandDrawMode.fireUpdate = function() {
    this.map.fire(Constants.events.UPDATE, {
        action: Constants.updateActions.MOVE,
        features: this.getSelected().map(f => f.toGeoJSON())
    });
};

export { FreeHandDrawMode }
