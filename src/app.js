import { GameManager } from "./game"
import { ContainerDrawable } from "./container"

var gl;
var game;
var scoreElement;

window.onload = function() {
  document.getElementById("newGameBtn").onclick = newGameButtonHandler
  scoreElement = document.getElementById("score")
  start()
}

function onGameOver(victory) {
  console.log("Game Over")
  scoreElement.innerHTML = "Game Over"
}

function onScoreChanged(score) {
  console.log("New score " + score)
  scoreElement.innerHTML = score + " points"
}

function start() {
  var canvas = document.getElementById("glcanvas")
  initWebGL(canvas)

  if (gl) {
    // gl object setup
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0,0,canvas.width, canvas.height)
  }
  var container = new ContainerDrawable(gl.POINTS, [],{x: 0, y: 0}, canvas.width, canvas.height)
  game = new GameManager(gl, container)
  game.delegate = {
    onGameOver: onGameOver,
    onScoreChanged: onScoreChanged
  }
}

function newGameButtonHandler(e) {
  scoreElement.innerHTML = ""
  game.newGame(gl, game.container)
  e.preventDefault()
}

function initWebGL(canvas) {
  gl = null

  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  }
  catch (e) {}

  if (!gl) {
    alert("Unable to initialize WebGL")
    gl = null
  }

  return gl;
}
