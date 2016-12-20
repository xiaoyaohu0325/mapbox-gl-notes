// import { FillStyleLayer } from './style_layer/fill_style_layer';
// import { LineStyleLayer } from './style_layer/line_style_layer';
// import { SymbolStyleLayer } from './style_layer/symbol_style_layer';

// const subclasses = {
//   // 'circle': require('./style_layer/circle_style_layer'),
//   'fill': FillStyleLayer,
//   // 'fill-extrusion': require('./style_layer/fill_extrusion_style_layer'),
//   'line': LineStyleLayer,
//   'symbol': SymbolStyleLayer
// }

export class StyleLayer {
  id: string;
  metadata: any;
  type: string;
  source;
  sourceLayer: string;
  minzoom: number;
  maxzoom: number;
  filter: any;

  constructor(layer: MapBoxGL.Layer) {
    this.id = layer.id;
    this.metadata = layer.metadata;
    this.type = layer.type;
    this.source = layer.source;
    this.sourceLayer = layer['source-layer'];
    this.minzoom = layer.minzoom;
    this.maxzoom = layer.maxzoom;
    this.filter = layer.filter;
  }

  serialize() {
    return {
      'id': this.id,
      'type': this.type,
      'source': this.source,
      'source-layer': this.sourceLayer,
      'metadata': this.metadata,
      'minzoom': this.minzoom,
      'maxzoom': this.maxzoom,
      'filter': this.filter,
      'layout': {}
    };
  }

  static create(layer) {
    // const LayerClass = subclasses[layer.type] || StyleLayer;
    return new StyleLayer(layer);
  }
}
