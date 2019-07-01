export function bindUniformWindowSize(gl, program, uName) {
  gl.useProgram(program)
  var uniform = gl.getUniformLocation(program, uName)
  var value = [gl.drawingBufferWidth, gl.drawingBufferHeight]
  gl.uniform2fv(uniform, value)
}

export function hexToRgb(hex, alpha) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha || 1.0
    } : null;
}

export function marginForCenterPosition(totalWidth, width) {
  return (totalWidth - width) / 2
}

export function insertValueEachStep(arr, value, step) {
  if (step <= 0 || step > arr.length) {
    return
  }
  var idx = []
  var i = 0
  while(i <= arr.length) {
    if((i + 1)% step == 0) {
      arr.splice(i, 0, value)
      i++
    }
    i++
  }
}

export function createPlainColorData(color, vCount) {
  var data = []
  for (var i = 0; i < vCount; i++) {
    data = data.concat([color.r, color.g, color.b, color.a])
  }
  return data
}

// COLORS constants
export function color_black() {
  return {r: 0, g: 0, b: 0, a: 1}
}
export function color_white() {
  return {r: 1, g: 1, b: 1, a: 1}
}
export function color_red() {
  return {r: 1, g: 0, b: 0, a: 1}
}
export function color_green() {
  return {r: 0, g: 1, b: 0, a: 1}
}
export function color_blue() {
  return {r: 0, g: 0, b: 1, a: 1}
}
export function color_yellow() {
  return {r: 1, g: 0.93, b: 0, a: 1}
}
export function color_purple() {
  return hexToRgb("#9400D3")
}

// point containts
export function origin_zero() {
  return {x: 0, y: 0}
}

// keyboard keys
export const KeyEnum = {
  SPACE: " ",
  LEFT: "ArrowLeft",
  UP: "ArrowUp",
  RIGHT: "ArrowRight",
  DOWN: "ArrowDown"
}

// direction
export const DIRECTION_RIGHT = 0
export const DIRECTION_LEFT = 1
export const DIRECTION_DOWN = 2
