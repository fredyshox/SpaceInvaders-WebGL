import vertexShaderSrc from "./shaders/vertexShader.glsl"
import fragmentShaderSrc from "./shaders/fragmentShader.glsl"
import * as Util from "./util"

var textures = {}

export class Drawable {

  /**
   * Drawable object constructor
   * @param {number} mode     (required) drawing mode (webGl constant)
   * @param {Array} vertices (required) vertices array
   * @param {Object} origin   (optional) origin point
   * @param {number} width    (optional)
   * @param {number} height   (optional)
   * @param {string} colorHex (optional) color in hex repr.
   */
  constructor(mode, vertices, origin, width, height, colorHex) {
    this.mode = mode
    this.vertices = vertices
    this.origin = origin || Util.origin_zero()
    this.width = width || 0
    this.height = height || 0
    this.color = Util.hexToRgb(colorHex) || Util.color_white()
  }

  get center() {
    return {
      x: this.origin.x + this.width / 2,
      y: this.origin.y - this.height / 2
    }
  }

  // MARK: on attach operations

  attach(gl) {
    this.attachShaders(gl)
    Util.bindUniformWindowSize(gl, this.shaderProgram, "uWindowSize")
    this.bindStaticUniformData(gl)
    if (this.textureName && getTextureImage(this.textureName) && this.textureCoordinates) {
      this.createTexture(gl, getTextureImage(this.textureName))
    }
    this.didAttach(gl)
  }

  /**
   * Called after attachment was performed. Reset context properties here.
   * @param  {WebGLRenderingContext} gl webgl context
   */
  didAttach(gl) {}

  attachShaders(gl) {
    // create vertex shader
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertexShaderSrc)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.log("Vertex shader compile error.")
    }
    // create fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragmentShaderSrc)
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.log("Framgent shader compile error.")
    }
    // create shader program and attach shaders
    var shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    this.shaderProgram = shaderProgram
  }

  bindStaticUniformData(gl) {
    gl.useProgram(this.shaderProgram)
    // binds js array to uniform vector
    var objSize = gl.getUniformLocation(this.shaderProgram, "uObjectSize")
    var objSizeValue = [this.width, this.height]
    gl.uniform2fv(objSize, objSizeValue)
  }

  // MARK: on draw operations

  draw(gl) {
    this.bindDynamicUniformData(gl)
    this.bindVerticesData(gl, this.vertices)
    this.bindColorData(gl, this.color)
    gl.drawArrays(this.mode, 0, this.vertices.length / 3)
    this.didDraw(gl)
  }

  /**
   * Called after drawing was performed. Reset context properties here.
   * @param  {WebGLRenderingContext} gl webgl context
   */
  didDraw(gl) {}

  bindDynamicUniformData(gl) {
    gl.useProgram(this.shaderProgram)
    // dynamic
    var objOrigin = gl.getUniformLocation(this.shaderProgram, "uObjectOrigin")
    var objOriginValue = [this.origin.x, this.origin.y]
    gl.uniform2fv(objOrigin, objOriginValue)
  }

  bindVerticesData(gl, vertices) {
      if (!this.vertexBuffer) {
        this.vertexBuffer = gl.createBuffer()
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
      var aCoord = gl.getAttribLocation(this.shaderProgram, "aCoordinates")
      gl.vertexAttribPointer(aCoord, 3, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(aCoord)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  bindColorData(gl, color) {
    if (!this.colorBuffer) {
      this.colorBuffer = gl.createBuffer()
    }
    var colorData = Util.createPlainColorData(this.color, this.vertices.length / 3)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW)
    var aColor = gl.getAttribLocation(this.shaderProgram, "aColor")
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(aColor)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
  }

  // MARK: on detach

  remove(gl) {
    gl.deleteBuffer(this.vertexBuffer)
    gl.deleteBuffer(this.colorBuffer)
    gl.deleteProgram(this.shaderProgram)
  }

  // MARK: moving around

  move(x, y) {
    this.origin.x = x
    this.origin.y = y
  }

  update(x, y) {
    this.origin.x += x
    this.origin.y += y
  }

}

export function bottomRightCoord(drawable) {
  return {
    x: drawable.origin.x + drawable.width,
    y: drawable.origin.y - drawable.height
  }
}

export function doOverlap(drawable1, drawable2) {
  var bottomRight1 = bottomRightCoord(drawable1)
  var bottomRight2 = bottomRightCoord(drawable2)
  if (drawable1.origin.x > bottomRight2.x || drawable2.origin.x > bottomRight1.x) {
    return false
  }

  if (drawable1.origin.y < bottomRight2.y || drawable2.origin.y < bottomRight1.y) {
    return false
  }

  return true
}

export class Spaceship extends Drawable {
  constructor(depth, origin, width, height, colorHex) {
    var depth = depth || 0.0
    var vertices = [0.2, 1.0,
                    0.0, 0.6,
                    0.2, 0.4,
                    0.4, 0.4,
                    0.5, 0.0,
                    0.6, 0.4,
                    0.8, 0.4,
                    1.0, 0.6,
                    0.8, 1.0]
    var textureCoord = vertices.slice()
    Util.insertValueEachStep(vertices, depth, 3)
    super(WebGLRenderingContext.TRIANGLE_FAN, vertices, origin, width, height, colorHex)
  }
}

export class Brick extends Drawable {
  constructor(depth, origin, width, height, colorHex) {
    var depth = depth || 0.0
    var vertices = [0.0, 0.2,
                    0.2, 0.0,
                    0.8, 0.0,
                    1.0, 0.2,
                    1.0, 0.8,
                    0.8, 1.0,
                    0.2, 1.0,
                    0.0, 0.8]
    var textureCoord = vertices.slice()
    Util.insertValueEachStep(vertices, depth, 3)
    super(WebGLRenderingContext.TRIANGLE_FAN, vertices, origin, width, height, colorHex)
  }

  get remainingHealth() {
    return this.color.a
  }

  set remainingHealth(newValue) {
    this.color.a = newValue
  }

}

export const OWNER_PLAYER = 0
export const OWNER_ENEMY = 1

export class Bullet extends Drawable {
  constructor(depth, origin, width, height, colorHex) {
    var depth = depth || 0.0
    var vertices = [0.0, 0.0,
                    0.0, 1.0,
                    1.0, 1.0,
                    1.0, 0.0]
    var textureCoord = vertices.slice()
    Util.insertValueEachStep(vertices, depth, 3)
    super(WebGLRenderingContext.TRIANGLE_FAN, vertices, origin, width, height, colorHex)
  }

  get owner() {
    return this._owner
  }

  set owner(newValue) {
    this._owner = newValue
  }

}

export class Enemy extends Drawable {
  constructor(depth, origin, width, height, colorHex) {
    var depth = depth || 0.0
    var vertices = [0.0, 0.0,
                    0.0, 1.0,
                    1.0, 1.0,
                    1.0, 0.0]
    var textureCoord = vertices.slice()
    Util.insertValueEachStep(vertices, depth, 3)
    super(WebGLRenderingContext.TRIANGLE_FAN, vertices, origin, width, height, colorHex)
  }

}
