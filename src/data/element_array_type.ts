import { createStructArrayType, ViewType } from '../util/struct_array';

/**
 * An element array stores Uint16 indicies of vertexes in a corresponding vertex array. With no
 * arguments, it defaults to three components per element, forming triangles.
 * @private
 */
export function createElementArrayType(components?: number) {
  return createStructArrayType({
    members: [{
      type: ViewType.Uint16,
      name: 'vertices',
      components: components || 3
    }]
  });
}
