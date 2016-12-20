import { Ajax } from '../../src/util/ajax';
import { VectorTile } from 'vector-tile';
import Protobuf = require('pbf');

const VT_URL = 'https://basemaps.arcgis.com/b2/arcgis/rest/services/World_Basemap/VectorTileServer';
export class Tile {
  url: string;

  constructor(z: number, x: number, y: number) {
    this.url = `${VT_URL}/tile/${z}/${y}/${x}.pbf`;
  }

  loadTile(callback: (err, data?) => void) {
    Ajax.getArrayBuffer(this.url, (error, arrayBuffer) => {
      if (error) {
        return callback(error);
      }
      const vectorTile = new VectorTile(new Protobuf(arrayBuffer));
      callback(null, vectorTile);
    });
  }
}