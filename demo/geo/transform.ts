import { Point } from './point';
import { vec4, mat2, mat4 } from 'gl-matrix';

import { LngLat } from './lng_lat';
import { Coordinate } from './coordinate';
import { TileCoord } from './tile_coord';
import { Util } from '../util/util';

import { TransformBase } from './transform-base';

export interface TransformState {
  tileSize?: number;
  center?: LngLat;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  altitude?: number;
  minZoom?: number;
  maxZoom?: number;
  lngRange?: number[]; // sequence is min, max
  latRange?: number[]; // sequence is min, max
  width?: number;     // canvas width of drawing area
  height?: number;    // canvas height
}

/**
 * A single transform, generally used for a single tile to be
 * scaled, rotated, and zoomed.
 *
 * @param {number} minZoom
 * @param {number} maxZoom
 * @private
 */
export class Transform extends TransformBase {
  projMatrix: mat4;
  pixelMatrix: mat4;
  pixelMatrixInverse: mat4;

  // properties of the map
  _state: TransformState;

  constructor(state: TransformState) {
    super();

    this._state = state;
  }

  get state() { return this._state; }

  set state(state: TransformState) {
    Util.extend(this._state, state);
    this._calcMatrices();
  }

  get tileSize() { return this.state.tileSize; }

  get minZoom() { return this.state.minZoom; }

  get maxZoom() { return this.state.maxZoom; }

  get scale() { return Math.pow(2, this.state.zoom); }

  get worldSize() {
    return this.tileSize * this.scale;
  }

  get width() {
    return this.state.width;
  }

  get height() {
    return this.state.height;
  }

  get centerPoint(): Point {
    return this.size._div(2);
  }

  get size() {
    return new Point(this.width, this.height);
  }

  get bearing() {
    let angle = this.state.bearing;
    return -angle * Math.PI / 180;
  }

  get pitch() {
    let pitch = this.state.pitch;
    return pitch * Math.PI / 180;
  }

  get altitude() {
    return this.state.altitude;
  }

  get zoom() { return this.state.zoom; }

  get tileZoom() { return Math.floor(this.zoom); }

  get center(): LngLat { return this.state.center; }

  /**
   * Return a zoom level that will cover all tiles the transform
   * @param {Object} options
   * @param {number} options.tileSize
   * @param {boolean} options.roundZoom
   * @returns {number} zoom level
   * @private
   */
  coveringZoomLevel(options) {
    return (options.roundZoom ? Math.round : Math.floor)(
      this.zoom + this.scaleZoom(this.tileSize / options.tileSize)
    );
  }

  /**
   * Return all coordinates that could cover this transform for a covering
   * zoom level.
   * @param {Object} options
   * @param {number} options.tileSize
   * @param {number} options.minzoom
   * @param {number} options.maxzoom
   * @param {boolean} options.roundZoom
   * @param {boolean} options.reparseOverscaled
   * @returns {Array<Tile>} tiles
   * @private
   */
  coveringTiles(options) {
    let z = this.coveringZoomLevel(options);
    const actualZ = z;

    if (z < options.minzoom) return [];
    if (z > options.maxzoom) z = options.maxzoom;

    // const tr = this,
    //   tileCenter = tr.locationCoordinate(tr.center)._zoomTo(z),
    //   centerPoint = new Point(tileCenter.column - 0.5, tileCenter.row - 0.5);

    return TileCoord.cover(z, [
      this.pointCoordinate(new Point(0, 0))._zoomTo(z),
      this.pointCoordinate(new Point(this.width, 0))._zoomTo(z),
      this.pointCoordinate(new Point(this.width, this.height))._zoomTo(z),
      this.pointCoordinate(new Point(0, this.height))._zoomTo(z)
    ], options.reparseOverscaled ? actualZ : z);
  }

  zoomScale(zoom) { return Math.pow(2, zoom); }
  scaleZoom(scale) { return Math.log(scale) / Math.LN2; }

  get x() { return this.lngX(this.center.lng, this.worldSize); }
  get y() { return this.latY(this.center.lat, this.worldSize); }

  get point() { return new Point(this.x, this.y); }

  /**
   * Given a location, return the screen point that corresponds to it
   * @param {LngLat} lnglat location
   * @returns {Point} screen point
   * @private
   */
  locationPoint(lnglat) {
    return this.coordinatePoint(this.locationCoordinate(lnglat));
  }

  /**
   * Given a point on screen, return its lnglat
   * @param {Point} p screen point
   * @returns {LngLat} lnglat location
   * @private
   */
  pointLocation(p) {
    return this.coordinateLocation(this.pointCoordinate(p));
  }

  /**
   * Given a geographical lnglat, return an unrounded
   * coordinate that represents it at this transform's zoom level and
   * worldsize.
   * @param {LngLat} lnglat
   * @returns {Coordinate}
   * @private
   */
  locationCoordinate(lnglat) {
    const k = this.zoomScale(this.tileZoom) / this.worldSize,
      ll = LngLat.convert(lnglat);

    return new Coordinate(
      this.lngX(ll.lng, this.worldSize) * k,
      this.latY(ll.lat, this.worldSize) * k,
      this.tileZoom);
  }

  /**
   * Given a Coordinate, return its geographical position.
   * @param {Coordinate} coord
   * @returns {LngLat} lnglat
   * @private
   */
  coordinateLocation(coord) {
    const worldSize = this.zoomScale(coord.zoom);
    return new LngLat(
      this.xLng(coord.column, worldSize),
      this.yLat(coord.row, worldSize));
  }

  pointCoordinate(p) {
    const targetZ = 0;
    // since we don't know the correct projected z value for the point,
    // unproject two points to get a line and then find the point on that
    // line with z=0

    const coord0 = vec4.fromValues(p.x, p.y, 0, 1);
    const coord1 = vec4.fromValues(p.x, p.y, 1, 1);

    vec4.transformMat4(coord0, coord0, this.pixelMatrixInverse);
    vec4.transformMat4(coord1, coord1, this.pixelMatrixInverse);

    const w0 = coord0[3];
    const w1 = coord1[3];
    const x0 = coord0[0] / w0;
    const x1 = coord1[0] / w1;
    const y0 = coord0[1] / w0;
    const y1 = coord1[1] / w1;
    const z0 = coord0[2] / w0;
    const z1 = coord1[2] / w1;


    const t = z0 === z1 ? 0 : (targetZ - z0) / (z1 - z0);
    const scale = this.worldSize / this.zoomScale(this.tileZoom);

    return new Coordinate(
      Util.interpolate(x0, x1, t) / scale,
      Util.interpolate(y0, y1, t) / scale,
      this.tileZoom);
  }

  /**
   * Given a coordinate, return the screen point that corresponds to it
   * @param {Coordinate} coord
   * @returns {Point} screen point
   * @private
   */
  coordinatePoint(coord) {
    const scale = this.worldSize / this.zoomScale(coord.zoom);
    const p = vec4.fromValues(coord.column * scale, coord.row * scale, 0, 1);
    vec4.transformMat4(p, p, this.pixelMatrix);
    return new Point(p[0] / p[3], p[1] / p[3]);
  }

  /**
   * Calculate the posMatrix that, given a tile coordinate, would be used to display the tile on a map.
   * @param {TileCoord|Coordinate} coord
   * @param {number} maxZoom maximum source zoom to account for overscaling
   * @private
   */
  calculatePosMatrix(coord: TileCoord | Coordinate, maxZoom?: number): mat4 {
    if (maxZoom === undefined) maxZoom = Infinity;
    if (coord instanceof TileCoord) coord = coord.toCoordinate(maxZoom);

    // Initialize model-view matrix that converts from the tile coordinates to screen coordinates.

    // if z > maxzoom then the tile is actually a overscaled maxzoom tile,
    // so calculate the matrix the maxzoom tile would use.
    const z = Math.min(coord.zoom, maxZoom);

    const scale = this.worldSize / Math.pow(2, z);
    const posMatrix = mat4.create();

    mat4.identity(posMatrix);
    mat4.translate(posMatrix, posMatrix, [coord.column * scale, coord.row * scale, 0]);
    mat4.multiply(posMatrix, this.projMatrix, posMatrix);

    return posMatrix;
  }

  _calcMatrices() {
    if (!this.height) return;

    // Find the distance from the center point to the center top in altitude units using law of sines.
    const halfFov = Math.atan(0.5 / this.altitude);
    const groundAngle = Math.PI / 2 + this.pitch;
    const cameraToCenterDistance = 0.5 / Math.tan(halfFov) * this.height;
    const topHalfSurfaceDistance = Math.sin(halfFov) * cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);

    // Calculate z distance of the farthest fragment that should be rendered.
    const furthestDistance = Math.cos(Math.PI / 2 - this.pitch) * topHalfSurfaceDistance + cameraToCenterDistance;
    // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
    const farZ = furthestDistance * 1.01;

    // matrix for conversion from location to GL coordinates (-1 .. 1)
    let m = mat4.create();
    mat4.perspective(m, 2 * halfFov, this.width / this.height, 1, farZ);
    mat4.scale(m, m, [1, -1, 1]);
    mat4.translate(m, m, [0, 0, -cameraToCenterDistance]);

    mat4.rotateX(m, m, this.pitch);
    mat4.rotateZ(m, m, this.bearing);
    mat4.translate(m, m, [-this.x, -this.y, 0]);

    this.projMatrix = m;

    // matrix for conversion from location to screen coordinates
    m = mat4.create();
    mat4.scale(m, m, [this.width / 2, -this.height / 2, 1]);
    mat4.translate(m, m, [1, -1, 0]);
    this.pixelMatrix = mat4.multiply(mat4.create(), m, this.projMatrix);

    // inverse matrix for conversion from screen coordinaes to location
    m = mat4.invert(mat4.create(), this.pixelMatrix);
    if (!m) throw new Error('failed to invert matrix');
    this.pixelMatrixInverse = m;
  }
}
