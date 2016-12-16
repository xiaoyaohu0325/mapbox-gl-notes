import { mat4, vec4 } from 'gl-matrix';
import { WebGLBase } from '../util/webgl-base';
import { Transform } from './transform';
import { TileCoord } from './tile_coord';
import { LngLat } from './lng_lat';

interface DrawOptions {
  altitude: number;
  angle: number;
  pitch: number;
  lng: number;
  lat: number;
  zoom: number;
}

const defaultState = {
  tileSize: 512,
  center: new LngLat(0, 0),
  zoom: 0,
  bearing: 0,
  pitch: 0,
  altitude: 1.5,
  minZoom: 0,
  maxZoom: 20,
  latRange: [-85.05113, 85.05113],
  width: 0,
  height: 0
};

const tileSize = 512;

class MapTile extends WebGLBase {
  positionAttributeLocation: number;
  rectBuffer: WebGLBuffer;
  matrixUniformLoc: WebGLUniformLocation;
  transform: Transform;
  ctx: CanvasRenderingContext2D;

  set textCanvas(context: CanvasRenderingContext2D) {
    this.ctx = context;
  }

  initialize() {
    this.transform = new Transform(defaultState);

    this.matrixUniformLoc = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');

    const rectData = new Float32Array([
      // start a rect
      0, 0, 0,
      512, 0, 0,
      512, 512, 0,
      0, 512, 0,
      // start a triangle
      256, 0, 0,
      512, 512, 0,
      0, 512, 0
    ]);

    this.rectBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, rectData, this.gl.STATIC_DRAW);
  }

  drawScene(data: DrawOptions) {
    this.resizeCanvasToDisplaySize();
    this.ctx.canvas.height = this.ctx.canvas.clientHeight;
    this.ctx.canvas.width = this.ctx.canvas.clientWidth;

    this.transform.state = {
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
      bearing: data.angle,
      pitch: data.pitch,
      altitude: data.altitude,
      center: new LngLat(data.lng, data.lat),
      zoom: Math.round(data.zoom)
    };

    // Clear the canvas.
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Turn on culling. By default backfacing triangles will be culled.
    // this.gl.enable(this.gl.CULL_FACE);
    // Enable the depth buffer
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.useProgram(this.program);

    // Bind Attribute
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
    this.gl.vertexAttribPointer(
    this.positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);

    let tileCoordArray = this.transform.coveringTiles({tileSize: tileSize});
    tileCoordArray.forEach((tileCoord) => {
      const coordinate = tileCoord.toCoordinate(this.transform.maxZoom);
      const lnglat = this.transform.coordinateLocation(coordinate);
      let matrix = this.transform.calculatePosMatrix(coordinate);
      this.gl.uniformMatrix4fv(this.matrixUniformLoc, false, matrix);
      // draw rect
      this.gl.drawArrays(this.gl.LINE_LOOP, 0, 4);
      // draw triangle
      this.gl.drawArrays(this.gl.TRIANGLES, 4, 3);

      // text
      // compute a clipspace position
      // using the matrix we computed for the tile
      let anchor = vec4.create();
      let clipspace = vec4.transformMat4(anchor, [10, 10, 0, 1], matrix);

      // divide X and Y by W just like the GPU does.
      clipspace[0] /= clipspace[3];
      clipspace[1] /= clipspace[3];

      // convert from clipspace to pixels
      let pixelX = (clipspace[0] *  0.5 + 0.5) * this.gl.canvas.width;
      let pixelY = (clipspace[1] * -0.5 + 0.5) * this.gl.canvas.height;

      const lineHeight = 20;
      this.ctx.fillText('zoom: ' + this.transform.zoom, pixelX, pixelY);
      this.ctx.fillText('col: ' + coordinate.column, pixelX, pixelY + lineHeight * 1);
      this.ctx.fillText('row: ' + coordinate.row, pixelX, pixelY + lineHeight * 2);
      this.ctx.fillText('top left lng: ' + lnglat.lng, pixelX, pixelY + lineHeight * 3);
      this.ctx.fillText('top left lat: ' + lnglat.lat, pixelX, pixelY + lineHeight * 4);
    });
  }
}

(function() {
  // look up the text canvas.
  let textCanvas = <HTMLCanvasElement>document.getElementById('text');

  // make a 2D context for it
  let ctx: CanvasRenderingContext2D = textCanvas.getContext('2d');
  ctx.font = '30px Helvetica';

  // Get A WebGL context
  let canvas = <HTMLCanvasElement>document.getElementById('container');
  const gl = canvas.getContext('webgl');

  // Get the strings for our GLSL shaders
  let vertexShaderSource = (<HTMLScriptElement>document.getElementById('3d-vertex-shader')).text;
  let fragmentShaderSource = (<HTMLScriptElement>document.getElementById('3d-fragment-shader')).text;

  // Link the two shaders into a program
  const app = new MapTile(gl, vertexShaderSource, fragmentShaderSource);
  app.textCanvas = ctx;

  const gui = new dat.GUI();
  let data = {
    altitude: 1.5,
    angle: 0,
    pitch: 0,
    lng: 0,
    lat: 0,
    zoom: 0
  };
  gui.add(data, 'altitude', 1, 20).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'angle', 0, 360).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'pitch', 0, 60).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'lng', -180, 180).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'lat', -85, 85).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'zoom', 0, 22).onChange(function() {
    app.drawScene(data);
  });

  app.drawScene(data);
})();
