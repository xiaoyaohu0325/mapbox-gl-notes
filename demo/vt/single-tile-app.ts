import { mat4, vec4 } from 'gl-matrix';
import { Tile } from './tile';
import { WebGLBase } from '../util/webgl-base';

const EXTENT = 8192, tileSize = 512;

interface DrawOptions {
  altitude: number;
  angle: number;
  pitch: number;
  offsetX: number;
  offsetY: number;
}

class SingleTileApp extends WebGLBase {
  positionAttributeLocation: number;
  positionBuffer: WebGLBuffer;
  matrixUniformLoc: WebGLUniformLocation;
  _vectorTile;
  drawOptions: DrawOptions;
  projMatrix: mat4;

  initialize() {
    this.matrixUniformLoc = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');

    this.positionBuffer = this.gl.createBuffer();

    this.drawOptions = {
      altitude: 1.5,
      angle: 0,
      pitch: 1,
      offsetX: 0,
      offsetY: 0
    };
  }

  set vectorTile(vt) {
    this._vectorTile = vt;
    this.drawScene();
  }

  get vectorTile() {
    return this._vectorTile;
  }

  drawScene(data?: DrawOptions) {
    if (data) {
      this.drawOptions = data;
    }
    if (!this.vectorTile) {
      return;
    }

    this.resizeCanvasToDisplaySize();

    // Clear the canvas.
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles will be culled.
    this.gl.enable(this.gl.CULL_FACE);
    // Enable the depth buffer
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.useProgram(this.program);

    this.projMatrix = mat4.create();
    // 像素坐标转成clip space坐标
    mat4.perspective(this.projMatrix, 2 * Math.atan((this.gl.canvas.height / 2) / this.drawOptions.altitude),
      this.gl.canvas.width / this.gl.canvas.height, 0.1, 1000);
    mat4.translate(this.projMatrix, this.projMatrix, [0, 0, -this.drawOptions.altitude + 0.1]);

    mat4.scale(this.projMatrix, this.projMatrix, [1, -1, 1 / this.gl.canvas.height]);

    mat4.rotateX(this.projMatrix, this.projMatrix, this.drawOptions.pitch * Math.PI / 180);
    mat4.rotateZ(this.projMatrix, this.projMatrix, this.drawOptions.angle * Math.PI / 180);
    mat4.translate(this.projMatrix, this.projMatrix, [this.drawOptions.offsetX, this.drawOptions.offsetY, 0]);
    mat4.translate(this.projMatrix, this.projMatrix, [-256, -256, 0]);
    mat4.scale(this.projMatrix, this.projMatrix, [tileSize / EXTENT, tileSize / EXTENT, 1]);

    this.gl.uniformMatrix4fv(this.matrixUniformLoc, false, this.projMatrix);

    let layerNames = Object.keys(this.vectorTile.layers)
    layerNames.forEach((name) => {
      if (name === 'Land') {
        this.drawLayer(this.vectorTile.layers[name]);
      }
    });
  }

  drawLayer(vectorLayer) {
    let length = vectorLayer.length;
    for (let i = 0; i < length; i++) {
      this.drawFeature(vectorLayer.feature(i));
    }
  }

  drawFeature(vectorFeature) {
    let type = vectorFeature.type === 1 ? this.gl.POINTS : this.gl.LINE_STRIP;

    let geometry = this.loadGeometry(vectorFeature);

    for (let r = 0; r < geometry.length; r++) {
      let buf = [];
      const ring = geometry[r];
      for (let p = 0; p < ring.length; p++) {
        const point = ring[p];
        buf.push(point.x);
        buf.push(point.y);
      }

      let data = new Uint16Array(buf);
      // Bind Attribute
      this.gl.enableVertexAttribArray(this.positionAttributeLocation);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(
          this.positionAttributeLocation, 2, this.gl.UNSIGNED_SHORT, false, 0, 0);

      this.gl.drawArrays(type, 0, ring.length);
    }
  }

  loadGeometry(feature, bits?) {
    const bounds = this.createBounds(bits || 16);

    const scale = EXTENT / feature.extent;
    const geometry = feature.loadGeometry();
    for (let r = 0; r < geometry.length; r++) {
      const ring = geometry[r];
      for (let p = 0; p < ring.length; p++) {
        const point = ring[p];
        // round here because mapbox-gl-native uses integers to represent
        // points and we need to do the same to avoid renering differences.
        point.x = Math.round(point.x * scale);
        point.y = Math.round(point.y * scale);

        if (point.x < bounds.min || point.x > bounds.max || point.y < bounds.min || point.y > bounds.max) {
          console.warn('Geometry exceeds allowed extent, reduce your vector tile buffer size');
        }
      }
    }
    return geometry;
  }

  createBounds(bits) {
    return {
        min: -1 * Math.pow(2, bits - 1),
        max: Math.pow(2, bits - 1) - 1
    };
  }
}

(function () {
  // Get A WebGL context
  let canvas = <HTMLCanvasElement>document.getElementById('container');
  const gl = canvas.getContext('webgl');

  // Get the strings for our GLSL shaders
  let vertexShaderSource = (<HTMLScriptElement>document.getElementById('3d-vertex-shader')).text;
  let fragmentShaderSource = (<HTMLScriptElement>document.getElementById('3d-fragment-shader')).text;

  // Link the two shaders into a program
  const app = new SingleTileApp(gl, vertexShaderSource, fragmentShaderSource);

  const zInput = <HTMLInputElement>document.getElementById('zInput');
  const colInput = <HTMLInputElement>document.getElementById('colInput');
  const rowInput = <HTMLInputElement>document.getElementById('rowInput');

  document.getElementById('btn').addEventListener('click', () => {
    let tile = new Tile(+zInput.value, +colInput.value, +rowInput.value);
    tile.loadTile((err, vectorTile) => {
      if (err) {
        alert(err.message || err);
      } else {
        app.vectorTile = vectorTile;
      }
    });
  });

  const gui = new dat.GUI();
  let data = {
    altitude: 1.5,
    angle: 0,
    pitch: 0,
    offsetX: 0,
    offsetY: 0
  };
  gui.add(data, 'altitude', 0.5, 2).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'angle', 0, 360).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'pitch', 0, 60).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'offsetX', -512, 512).onChange(function() {
    app.drawScene(data);
  });
  gui.add(data, 'offsetY', -512, 512).onChange(function() {
    app.drawScene(data);
  });
})();
