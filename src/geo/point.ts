export class Point {
  public x: number;
  public y: number;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  _add(p) {
    this.x += p.x;
    this.y += p.y;
    return this;
  }

  _sub(p) {
    this.x -= p.x;
    this.y -= p.y;
    return this;
  }

  _div(k) {
    this.x /= k;
    this.y /= k;
    return this;
  }
}