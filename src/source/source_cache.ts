import { Source } from './source';

export class SourceCache {
  _source;
  constructor(id, options) {
    this._source = Source.create(id, options);
  }

  getSource() {
    return this._source;
  }

  loadTile(tile, callback) {
    return this._source.loadTile(tile, callback);
  }
}