import { mat4, vec4 } from 'gl-matrix';
import { WebGLBase } from '../util/webgl-base';
import { classifyRings } from '../../src/util/classify_rings';
import { loadGeometry } from '../../src/data/load_geometry';
import { StyleLayerIndex } from '../../src/style/style_layer_index';
import { Ajax } from '../../src/util/ajax';
import { VectorTile } from 'vector-tile';
import Protobuf = require('pbf');
import { StyleLayerFactory } from '../../src/style/style_layer_factory';
import deref = require('mapbox-gl-style-spec/lib/deref');
import earcut = require('earcut');

const EXTENT = 8192, tileSize = 512;
const EARCUT_MAX_RINGS = 500;

interface DrawOptions {
  altitude: number;
  angle: number;
  pitch: number;
  offsetX: number;
  offsetY: number;
}

class FillTileApp {
  gl: WebGLRenderingContext;
  vertexShaderSource: string;
  fragmentShaderSource: string;
  _vectorTile;
  _layerIndex: StyleLayerIndex;
  drawOptions: DrawOptions;
  projMatrix: mat4;
  layers;
  drawApps: DrawLayerApp[];

  constructor(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
    this.drawOptions = {
      altitude: 1.5,
      angle: 0,
      pitch: 1,
      offsetX: 0,
      offsetY: 0
    };
    this.gl = gl;

    // Get the strings for our GLSL shaders
    this.vertexShaderSource = vertexShaderSource;
    this.fragmentShaderSource = fragmentShaderSource;
  }

  set vectorTile(vt) {
    this._vectorTile = vt;
    this.updateApps();
    this.drawScene();
  }

  get vectorTile() {
    return this._vectorTile;
  }

  set layerIndex(value) {
    this._layerIndex = value;
    this.updateApps();
    this.drawScene();
  }

  get layerIndex() {
    return this._layerIndex;
  }

  updateApps() {
    this.drawApps = [];

    if (this.layerIndex) {
      const sourceFamilies = this.layerIndex.familiesBySource;

      for (const layerObj of this.layers) {
        const group = sourceFamilies[layerObj.source];
        const sourceLayerId = layerObj['source-layer'];

        if (sourceLayerId in this.vectorTile.layers) {
          const layers = group[sourceLayerId];
          if (layers && layers[0].type === 'fill') { // only deal with filled layer
            layers.forEach((layer) => {
              const app = new DrawLayerApp(this.gl, this.vertexShaderSource, this.fragmentShaderSource);
              app.styleLayer = layer;
              app.layer = this.vectorTile.layers[sourceLayerId];

              this.drawApps.push(app);
            });
          }
        }
      }
    } else {
      let layerNames = Object.keys(this.vectorTile.layers);
      // layerNames.forEach((name) => {
      const app = new DrawLayerApp(this.gl, this.vertexShaderSource, this.fragmentShaderSource);
      app.layer = this.vectorTile.layers['landcover'] || this.vectorTile.layers['water'];
      this.drawApps.push(app);
      // });
    }
  }

  resizeCanvasToDisplaySize() {
    const canvas = this.gl.canvas;
    const multiplier = 1; // window.devicePixelRatio;
    let width  = canvas.clientWidth  * multiplier | 0;
    let height = canvas.clientHeight * multiplier | 0;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      return true;
    }
    return false;
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

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

    this.gl.enable(this.gl.STENCIL_TEST);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.depthMask(false);


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

    // this.drawApps.forEach(app => {
    //   app.projMatrix = this.projMatrix;
    //   app.drawScene();
    // });
    for (let i = this.drawApps.length - 1; i >= 0; i--) {
      const app = this.drawApps[i];
      app.projMatrix = this.projMatrix;
      app.drawScene();
    }

    for (let i = 0; i < this.drawApps.length; i++) {
      const app = this.drawApps[i];
      app.projMatrix = this.projMatrix;
      app.drawScene();
    }
  }
}

class DrawLayerApp extends WebGLBase {
  positionAttributeLocation: number;
  positionBuffer: WebGLBuffer;
  matrixUniformLoc: WebGLUniformLocation;
  colorUniformLoc: WebGLUniformLocation;
  projMatrix: mat4;

  vectorLayer;
  styleLayer;
  vertexArray: number[];
  triangleElementArray: number[];
  ringElementArray: number[];
  isFill: boolean;

  initialize() {
    this.matrixUniformLoc = this.gl.getUniformLocation(this.program, 'u_matrix');
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.colorUniformLoc = this.gl.getUniformLocation(this.program, 'u_color');

    this.positionBuffer = this.gl.createBuffer();

    this.vertexArray = [];
    this.triangleElementArray = [];
    this.ringElementArray = [];
    this.isFill = true;
  }

  set matrix(matrix) {
    this.projMatrix = matrix;
  }

  set layer(vtLayer) {
    this.vectorLayer = vtLayer;
    if (vtLayer) {
      this.parseVectorLayer();
    }
  }

  parseVectorLayer() {
    let length = this.vectorLayer.length;
    let features = [];
    for (let i = 0; i < length; i++) {
      if (this.styleLayer && this.styleLayer.filter) {
        if (this.styleLayer.filter(this.vectorLayer.feature(i))) {
          features.push(this.vectorLayer.feature(i));
        }
      } else {
        features.push(this.vectorLayer.feature(i));
      }
    }

    let vertexCount = 0;
    const flattened = [];
    const ringElements = [];
    const triangleElements = [];

    features.forEach((vectorFeature) => {
      let geometry = loadGeometry(vectorFeature);
      const polygons = classifyRings(geometry, EARCUT_MAX_RINGS);

      for (const polygon of polygons) {
        const vertices = [];
        const holeIndices = [];
        const offset = vertexCount;

        for (const ring of polygon) {
          let rLength = ring.length;

          if (rLength === 0) {
            continue;
          }

          if (ring !== polygon[0]) {
            holeIndices.push(vertices.length / 2);
          }

          for (let i = 0; i < ring.length; i++) {
            flattened.push(ring[i].x);
            flattened.push(ring[i].y);
            vertices.push(ring[i].x);
            vertices.push(ring[i].y);

            if (i === 0) {
              ringElements.push(vertexCount + ring.length - 1);
              ringElements.push(vertexCount);
            } else {
              ringElements.push(vertexCount + i - 1);
              ringElements.push(vertexCount + i);
            }
          }
          vertexCount += ring.length;
        }

        const indices = earcut(vertices, holeIndices);

        for (let i = 0; i < indices.length; i += 3) {
          triangleElements.push(offset + indices[i]);
          triangleElements.push(offset + indices[i + 1]);
          triangleElements.push(offset + indices[i + 2]);
        }
      }
    });

    this.vertexArray = flattened;
    this.ringElementArray = ringElements;
    this.triangleElementArray = triangleElements;
  }

  drawScene() {
    if (this.vertexArray.length === 0) {
      return;
    }

    this.gl.useProgram(this.program);

    this.gl.uniformMatrix4fv(this.matrixUniformLoc, false, this.projMatrix);

    let color = this.styleLayer && this.styleLayer.getPaintValue('fill-color');
    if (color) {
      this.gl.uniform4fv(this.colorUniformLoc, color);
    } else {
      this.gl.uniform4fv(this.colorUniformLoc, [0, 0, 1, 1]);
    }

    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Int16Array(this.vertexArray), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(
        this.positionAttributeLocation, 2, this.gl.SHORT, false, 0, 0);

    if (this.isFill) {
      this.drawFill();
    } else {
      this.drawOutline();
    }
  }

  drawOutline() {
    const elementBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.ringElementArray), this.gl.STATIC_DRAW);
    this.gl.drawElements(this.gl.LINES, this.ringElementArray.length, this.gl.UNSIGNED_SHORT, 0);
  }

  drawFill() {
    const elementBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.triangleElementArray), this.gl.STATIC_DRAW);
    this.gl.drawElements(this.gl.TRIANGLES, this.triangleElementArray.length, this.gl.UNSIGNED_SHORT, 0);
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
  const app = new FillTileApp(gl, vertexShaderSource, fragmentShaderSource);

  const tileSelect = <HTMLSelectElement>document.getElementById('tileSelect');

  tileSelect.addEventListener('change', () => {
    if (!tileSelect.value) {
      return;
    }
    Ajax.getArrayBuffer(`http://localhost:3000/demo/tile-data/${tileSelect.value}.pbf`, (error, arrayBuffer) => {
      if (error) {
        alert(error.message || error);
      }
      const vectorTile = new VectorTile(new Protobuf(arrayBuffer));
      app.vectorTile = vectorTile;
    });
  });

  const inputElement = <HTMLInputElement>(document.getElementById('inputElem'));

  document.getElementById('styleBtn').addEventListener('click', function () {
    Ajax.getJSON(inputElement.value, (err, stylesheet) => {
      if (err) {
        console.warn(err);
        return;
      }

      const layers = deref(stylesheet.layers);

      const order = layers.map((layer) => layer.id);

      let _layers = {};
      for (let layer of layers) {
        layer = StyleLayerFactory.create(layer);
        _layers[layer.id] = layer;
      }

      const serializedLayers = order.map((id) => _layers[id].serialize());
      const layerIndex = new StyleLayerIndex();
      layerIndex.replace(serializedLayers);

      app.layers = layers;
      app.layerIndex = layerIndex;
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
