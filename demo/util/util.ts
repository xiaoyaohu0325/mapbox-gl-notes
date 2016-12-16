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
}