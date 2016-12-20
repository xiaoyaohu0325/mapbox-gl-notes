import { Ajax } from '../util/ajax';
import { SourceCache } from '../source/source_cache';
import { StyleLayer } from './style_layer';
import { Evented } from '../util/evented';
import deref = require('mapbox-gl-style-spec/lib/deref');

export class Style extends Evented {
  _layers;
  _order: string[];
  _loaded: boolean;
  sourceCaches;
  stylesheet;

  constructor(styleurl: string) {
    super();

    this._layers = {};
    this._order = [];
    this.sourceCaches = {};
    this._loaded = false;

    Ajax.getJSON(styleurl, this.stylesheetLoaded.bind(this));
  }

  stylesheetLoaded(err, stylesheet) {
    if (err) {
      console.warn(err);
      return;
    }

    this._loaded = true;
    this.stylesheet = stylesheet;

    for (const id in stylesheet.sources) {
      this.addSource(id, stylesheet.sources[id]);
    }

    // if (stylesheet.sprite) {
    //   this.sprite = new ImageSprite(stylesheet.sprite);
    //   this.sprite.setEventedParent(this);
    // }

    // this.glyphSource = new GlyphSource(stylesheet.glyphs);
    this._resolve();
  }

  addSource(id, source) {
    const builtIns = ['vector', 'raster', 'geojson', 'video', 'image'];

    const sourceCache = this.sourceCaches[id] = new SourceCache(id, source);
  }

  getSource(id) {
    return this.sourceCaches[id] && this.sourceCaches[id].getSource();
  }

  _resolve() {
    const layers = deref(this.stylesheet.layers);

    this._order = layers.map((layer) => layer.id);

    this._layers = {};
    for (let layer of layers) {
      layer = StyleLayer.create(layer);
      this._layers[layer.id] = layer;
    }

    // this.dispatcher.broadcast('setLayers', this._serializeLayers(this._order));
  }

  _serializeLayers(ids) {
    return ids.map((id) => this._layers[id].serialize());
  }
}