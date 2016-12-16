import { Point } from './point';
import { LngLat } from './lng_lat';
import { Coordinate } from './coordinate';
/**
 * Coordinate transform that is not related to the transform parameters,
 * including center and zoom.
 *
 * @export
 * @class TransformBase
 */
export class TransformBase {
  /**
   * Convert longitude and latitude to absolute x, y coordinate
   *
   * @param {LngLat} lnglat
   * @param {number} worldSize
   * @returns
   *
   * @memberOf TransformBase
   */
  project(lnglat: LngLat, worldSize: number) {
    return new Point(
      this.lngX(lnglat.lng, worldSize),
      this.latY(lnglat.lat, worldSize));
  }

  /**
   * Convert absolute x, y coordinate to longitude and latitude
   *
   * @param {Point} point
   * @param {number} worldSize
   * @returns
   *
   * @memberOf TransformBase
   */
  unproject(point: Point, worldSize: number) {
    return new LngLat(
      this.xLng(point.x, worldSize),
      this.yLat(point.y, worldSize));
  }

  /**
   * latitude to absolute x coord
   * @param {number} lon
   * @param {number} [worldSize=this.worldSize]
   * @returns {number} pixel coordinate
   * @private
   */
  lngX(lng: number, worldSize: number) {
    return (180 + lng) * worldSize / 360;
  }
  /**
   * latitude to absolute y coord
   * @param {number} lat
   * @param {number} [worldSize=this.worldSize]
   * @returns {number} pixel coordinate
   * @private
   */
  latY(lat: number, worldSize: number) {
    const y = 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
    return (180 - y) * worldSize / 360;
  }

  xLng(x, worldSize) {
    return x * 360 / worldSize - 180;
  }

  yLat(y, worldSize) {
    const y2 = 180 - y * 360 / worldSize;
    return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
  }
}
