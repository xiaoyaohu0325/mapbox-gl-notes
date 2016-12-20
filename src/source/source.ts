import { VectorTileSource } from './vector_tile_source';

const sourceTypes = {
  'vector': VectorTileSource
};

export class Source {
 static create(id: string, source: MapBoxGL.Source) {
   source = new sourceTypes[source.type](id, source);

   return source;
 }
}