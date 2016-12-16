export abstract class WebGLBase {
  gl: WebGLRenderingContext;
  _program: WebGLProgram;

  constructor(gl: WebGLRenderingContext, vertexShaderSrc: string, fragmentShaderSrc: string) {
    this.gl = gl;
    this._program = null;
    if (this.gl) {
      this._createProgram(vertexShaderSrc, fragmentShaderSrc);
      if (this._program) {
        this.initialize();
      }
    }
  }

  public get program(): WebGLProgram {
    return this._program;
  }

  public initialize() {
    // implement by subclass
  }

  public drawScene(data?: any) {
    // implement by subclass
  }

  /**
   * Resize a canvas to match the size it's displayed.
   * @return {boolean} true if the canvas was resized.
   * Copy from twgl.js
   */
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

  private _createProgram(vertexShaderSrc: string, fragmentShaderSrc: string) {
    const vertexShader = this._createShader(this.gl.VERTEX_SHADER, vertexShaderSrc);
    const fragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSrc);
    if (!vertexShader || !fragmentShader) {
      return null;
    }
    const program = this.gl.createProgram();
    if (!program) {
      return null;
    }
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    let success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (!success) {
      let error = this.gl.getProgramInfoLog(program);
      console.log('Failed to link program: ' + error);
      this.gl.deleteProgram(program);
      this.gl.deleteShader(fragmentShader);
      this.gl.deleteShader(vertexShader);
      return null;
    }

    this._program = program;
  }

  private _createShader(type: number, source: string) {
    const shader = this.gl.createShader(type);
    if (shader == null) {
      console.log('unable to create shader');
      return null;
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!success) {
      let error = this.gl.getShaderInfoLog(shader);
      console.log('Failed to compile shader: ' + error);
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}