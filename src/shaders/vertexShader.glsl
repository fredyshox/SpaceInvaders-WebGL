attribute vec3 aCoordinates;
attribute vec4 aColor;
uniform vec2 uWindowSize;
uniform vec2 uObjectOrigin;
uniform vec2 uObjectSize;
varying vec4 vColor;

void main(void) {
  float xCoor = (2.0 * (uObjectOrigin[0] + aCoordinates[0] * uObjectSize[0])/(uWindowSize[0])) - 1.0;
  float yCoor = (2.0 * (uObjectOrigin[1] - aCoordinates[1] * uObjectSize[1])/(uWindowSize[1])) - 1.0;
  float zCoor = aCoordinates[2];
  vec3 translated = vec3(xCoor, yCoor, zCoor);
  gl_Position = vec4(translated, 1.0);
  vColor = aColor;
}
