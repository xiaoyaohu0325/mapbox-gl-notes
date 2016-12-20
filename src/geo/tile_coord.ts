import { Coordinate } from './coordinate';
import { mat4 } from 'gl-matrix';

export class TileCoord {
  id: number;
  posMatrix: mat4;

  constructor(private z: number, private x: number, private y: number, private w?: number) {
    if (isNaN(w)) {
      w = 0;
    }

    // calculate id
    w *= 2;
    if (w < 0) {
      w = w * -1 - 1;
    }
    const dim = 1 << this.z;
    this.id = ((dim * dim * w + dim * this.y + this.x) * 32) + this.z;

    // for caching pos matrix calculation when rendering
    this.posMatrix = null;
  }

  toString(): string {
    return `${this.z}/${this.x}/${this.y}`;
  }

  toCoordinate(sourceMaxZoom: number): Coordinate {
    const zoom = Math.min(this.z, sourceMaxZoom);
    const tileScale = Math.pow(2, zoom);
    const row = this.y;
    const column = this.x + tileScale * this.w;
    return new Coordinate(column, row, zoom);
  }

  // Return the coordinate of the parent tile
  parent(sourceMaxZoom): TileCoord {
    if (this.z === 0) return null;

    // the id represents an overscaled tile, return the same coordinates with a lower z
    if (this.z > sourceMaxZoom) {
      return new TileCoord(this.z - 1, this.x, this.y, this.w);
    }

    return new TileCoord(this.z - 1, Math.floor(this.x / 2), Math.floor(this.y / 2), this.w);
  }

  wrapped() {
    return new TileCoord(this.z, this.x, this.y, 0);
  }

  // Return the coordinates of the tile's children
  children(sourceMaxZoom): TileCoord[] {

    if (this.z >= sourceMaxZoom) {
      // return a single tile coord representing a an overscaled tile
      return [new TileCoord(this.z + 1, this.x, this.y, this.w)];
    }

    const z = this.z + 1;
    const x = this.x * 2;
    const y = this.y * 2;
    return [
      new TileCoord(z, x, y, this.w),
      new TileCoord(z, x + 1, y, this.w),
      new TileCoord(z, x, y + 1, this.w),
      new TileCoord(z, x + 1, y + 1, this.w)
    ];
  }

  // Parse a packed integer id into a TileCoord object
  static fromID(id: number): TileCoord {
    const z = id % 32, dim = 1 << z;
    const xy = ((id - z) / 32);
    const x = xy % dim, y = ((xy - x) / dim) % dim;
    let w = Math.floor(xy / (dim * dim));
    if (w % 2 !== 0) w = w * -1 - 1;
    w /= 2;
    return new TileCoord(z, x, y, w);
  }

  static cover(z: number, bounds: Coordinate[], actualZ: number): TileCoord[] {
    const tiles = 1 << z;
    const t = {};

    function scanLine(x0: number, x1: number, y: number) {
      let x, wx, coord;
      if (y >= 0 && y <= tiles) {
        for (x = x0; x < x1; x++) {
          wx = (x % tiles + tiles) % tiles;
          coord = new TileCoord(actualZ, wx, y, Math.floor(x / tiles));
          t[coord.id] = coord;
        }
      }
    }

    // Divide the screen up in two triangles and scan each of them:
    // +---/
    // | / |
    // /---+
    scanTriangle(bounds[0], bounds[1], bounds[2], 0, tiles, scanLine);
    scanTriangle(bounds[2], bounds[3], bounds[0], 0, tiles, scanLine);

    return Object.keys(t).map((id) => {
      return t[id];
    });
  };
}

interface Edge {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  dx: number;
  dy: number;
}

// Taken from polymaps src/Layer.js
// https://github.com/simplegeo/polymaps/blob/master/src/Layer.js#L333-L383

function edge(a: Coordinate, b: Coordinate): Edge {
  if (a.row > b.row) { const t = a; a = b; b = t; }
  return {
    x0: a.column,
    y0: a.row,
    x1: b.column,
    y1: b.row,
    dx: b.column - a.column,
    dy: b.row - a.row
  };
}

function scanSpans(e0: Edge, e1: Edge,
  ymin: number, ymax: number, scanLine: (x0: number, x1: number, y: number) => void) {
  const y0 = Math.max(ymin, Math.floor(e1.y0));
  const y1 = Math.min(ymax, Math.ceil(e1.y1));

  // sort edges by x-coordinate
  if ((e0.x0 === e1.x0 && e0.y0 === e1.y0) ?
    (e0.x0 + e1.dy / e0.dy * e0.dx < e1.x1) :
    (e0.x1 - e1.dy / e0.dy * e0.dx < e1.x0)) {
    const t = e0; e0 = e1; e1 = t;
  }

  // scan lines!
  const m0 = e0.dx / e0.dy;
  const m1 = e1.dx / e1.dy;
  const d0 = e0.dx > 0 ? 1 : 0; // use y + 1 to compute x0
  const d1 = e1.dx < 0 ? 1 : 0; // use y + 1 to compute x1
  for (let y = y0; y < y1; y++) {
    const x0 = m0 * Math.max(0, Math.min(e0.dy, y + d0 - e0.y0)) + e0.x0;
    const x1 = m1 * Math.max(0, Math.min(e1.dy, y + d1 - e1.y0)) + e1.x0;
    scanLine(Math.floor(x1), Math.ceil(x0), y);
  }
}

function scanTriangle(a: Coordinate, b: Coordinate, c: Coordinate,
  ymin: number, ymax: number, scanLine: (x0: number, x1: number, y: number) => void) {
  let ab = edge(a, b),
    bc = edge(b, c),
    ca = edge(c, a);

  let t;

  // sort edges by y-length
  if (ab.dy > bc.dy) { t = ab; ab = bc; bc = t; }
  if (ab.dy > ca.dy) { t = ab; ab = ca; ca = t; }
  if (bc.dy > ca.dy) { t = bc; bc = ca; ca = t; }

  // scan span! scan span!
  if (ab.dy) scanSpans(ca, ab, ymin, ymax, scanLine);
  if (bc.dy) scanSpans(ca, bc, ymin, ymax, scanLine);
}
