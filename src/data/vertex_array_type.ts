import { createStructArrayType } from '../util/struct_array';
/**
 * A vertex array stores data for each vertex in a geometry. Elements are aligned to 4 byte
 * boundaries for best performance in WebGL.
 * @private
 */
export function createVertexArrayType(members) {
    return createStructArrayType({
        members: members,
        alignment: 4
    });
}
