import { Point } from '../geo/point';

export class Util {
  /**
  * constrain n to the given range, excluding the minimum, via modular arithmetic
  *
  * @param n value
  * @param min the minimum value to be returned, exclusive
  * @param max the maximum value to be returned, inclusive
  * @returns constrained number
  * @private
  */
  static wrap(n: number, min: number, max: number): number {
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return (w === min) ? max : w;
  }

  /**
   * constrain n to the given range via min + max
   *
   * @param n value
   * @param min the minimum value to be returned
   * @param max the maximum value to be returned
   * @returns the clamped value
   * @private
   */
  static clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }

  static interpolate(a, b, t) {
    return (a * (1 - t)) + (b * t);
  }

  /**
   * Given a destination object and optionally many source objects,
   * copy all properties from the source objects into the destination.
   * The last source object given overrides properties from previous
   * source objects.
   *
   * @param dest destination object
   * @param {...Object} sources sources from which properties are pulled
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  static extend(dest: Object, source0: Object, source1?: Object, source2?: Object): Object {
    for (let i = 1; i < arguments.length; i++) {
      const src = arguments[i];
      for (const k in src) {
        dest[k] = src[k];
      }
    }
    return dest;
  }

  /*
  * Polyfill for Object.values. Not fully spec compliant, but we don't
  * need it to be.
  *
  * @private
  */
  static values(obj: Object): Array<string> {
    const result = [];
    for (const k in obj) {
      result.push(obj[k]);
    }
    return result;
  }

  /**
   * Returns the signed area for the polygon ring.  Postive areas are exterior rings and
   * have a clockwise winding.  Negative areas are interior rings and have a counter clockwise
   * ordering.
   *
   * @param ring Exterior or interior ring
   */
  static calculateSignedArea(ring: Array<Point>): number {
    let sum = 0;
    for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
      p1 = ring[i];
      p2 = ring[j];
      sum += (p2.x - p1.x) * (p1.y + p2.y);
    }
    return sum;
  }
}