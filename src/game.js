var container;
var enemies; // array of stacks

import * as Util from "./util"
import { Spaceship, Brick, Enemy, Bullet, OWNER_PLAYER, OWNER_ENEMY } from "./drawable"
import { Animator } from "./animator"

const STANDARD_PLAYER_SIZE = {w: 50.0, h: 40.0}
const STANDARD_BRICK_SIZE = {w: 100.0, h: 80.0}
const STANDARD_BULLET_SIZE = {w: 5, h: 20}
const STANDARD_ENEMY_MARGIN_H = 15.0
const STANDARD_ENEMY_MARGIN_V = 25.0
const STANDARD_BRICK_MARGIN_H = 100.0
const BACKGROUND_DEPTH = 1.0
const PLAYER_DEPTH = 0.0
const BULLET_DEPTH = -1.0
// Score
const ENEMY_HIT_POINTS = 10000

export class GameManager {

  constructor(context, container, enemyGenerator, bricksGenerator) {
    this.container = container
    this.enemyGenerator = enemyGenerator || generateEnemies
    this.bricksGenerator = bricksGenerator || generateBricks
    this.keysObject = {}
    this.addKeyboardListeners()
    this.newGame(context, container)
  }

  newGame(context, container) {
    if (this.animator) {
        this.animator.stop()
    }
    this.stopEnemyAi()
    container.drawables.forEach((drawable) => {
      drawable.remove(context)
    })
    container.drawables = []
    this.score = 0
    this.initialize(context, container)
  }

  initialize(context, container) {
    this.animator = new Animator(context, container, 25.0, {
      onBrickHit: this.onBrickHit,
      // this binding required for delegation!
      onEnemyHit: this.onEnemyHit.bind(this),
      onPlayerHit: this.onPlayerHit.bind(this),
      onBulletHit: this.onBulletHit,
      onEnemiesPosition: this.onEnemiesPosition
    })
    this.buildMap()
    this.animator.start()
    this.startEnemyAi()
  }

  buildMap() {
    this.buildPlayer()
    this.buildEnemies()
    this.buildBricks()
    this.container.attach(this.animator.context)
  }

  addKeyboardListeners() {
    var self = this
    var callback = function (keyCode, isKeyDown) {
      switch (keyCode) {
        case Util.KeyEnum.LEFT:
        case Util.KeyEnum.RIGHT:
        case Util.KeyEnum.SPACE:
          self.keysObject[keyCode] = isKeyDown
        default:
          break
      }
      self.onKeyEvent()
    }

    document.addEventListener('keydown', function(e) {
      callback(event.key, true)
      event.preventDefault()
    })
    document.addEventListener('keyup', function(e) {
      callback(event.key, false)
      event.preventDefault()
    })
  }

  onKeyEvent(key) {
    // manage player direction
    var direction;
    if (this.keysObject[Util.KeyEnum.LEFT]) {
      direction = Util.DIRECTION_LEFT
    } else if (this.keysObject[Util.KeyEnum.RIGHT]){
      direction = Util.DIRECTION_RIGHT
    } else {
      direction = null
    }
    this.animator.playerData.direction = direction

    if (this.keysObject[Util.KeyEnum.SPACE]) {
      this.shoot(OWNER_PLAYER)
    }
  }

  shoot(owner) {
    if (owner != OWNER_ENEMY && owner != OWNER_PLAYER) {
      return
    }

    var bullet = new Bullet(BULLET_DEPTH, Util.origin_zero(), STANDARD_BULLET_SIZE.w, STANDARD_BULLET_SIZE.h, Util.COLOR_WHITE)
    bullet.owner = owner
    if (owner == OWNER_PLAYER) {
      bullet.origin = this.animator.player.center
      this.pushBullet(bullet)
    } else {
      var nonEmptyStacks = this.animator.enemies.filter(function(s) { return s.length != 0 })
      if (nonEmptyStacks.length != 0) {
        var rand = Math.floor(Math.random() * nonEmptyStacks.length)
        var shooter = nonEmptyStacks[rand][0]
        bullet.origin = shooter.center
        this.pushBullet(bullet)
      }
    }
  }

  pushBullet(bullet) {
    this.animator.bullets.push(bullet)
    bullet.attach(this.animator.context)
    this.container.addSubDrawable(bullet)
  }

  startEnemyAi(time) {
    var time = time || 1000 // default 1 second
    var self = this
    this.enemyTimer = setInterval(function() {
      self.shoot(OWNER_ENEMY)
    }, time)
  }

  stopEnemyAi() {
    if (this.enemyTimer) {
      clearInterval(this.enemyTimer)
    }
  }

  get score() {
    return this._score
  }

  set score(value) {
    this._score = value
    this.notifyScoreChanged(value)
  }

  notifyGameOver(victory) {
    if (this.delegate) {
      this.delegate.onGameOver(victory)
    }
  }

  notifyScoreChanged(score) {
    if (this.delegate) {
      this.delegate.onScoreChanged(score)
    }
  }

  // delegate methods

  onEnemyHit(animator, enemy, stackIndex) {
    var stack = animator.enemies[stackIndex]
    var idx = stack.indexOf(enemy)
    if (idx >= 0) {
      stack.splice(idx, 1)
    }
    animator.container.removeSubDrawable(enemy)
    this.score += ENEMY_HIT_POINTS
  }

  onPlayerHit(animator, player) {
    animator.container.removeSubDrawable(player)
    animator.stop()
    // this binding required!
    this.notifyGameOver(false)
  }

  onBrickHit(animator, brick) {
    var health = brick.remainingHealth
    brick.remainingHealth = health - 0.1
    if (brick.remainingHealth <= 0.1) {
      var idx = animator.bricks.indexOf(brick)
      animator.bricks.splice(idx, 1)
      animator.container.removeSubDrawable(brick)
    }
  }

  onBulletHit(animator, bullet) {
    var idx = animator.bullets.indexOf(bullet)
    if (idx >= 0) {
      animator.bullets.splice(idx, 1)
    }
    animator.container.removeSubDrawable(bullet)
  }

  onEnemiesPosition(animator, positionY) {
    if (positionY <= animator.player.origin.y) {
      console.log("Game Over")
      animator.container.removeSubDrawable(animator.player)
      animator.stop()
    }
  }

  // Map build utility methods

  buildEnemies() {
    var enemiesTotalWidth = 11 * STANDARD_PLAYER_SIZE.w + 10 * STANDARD_ENEMY_MARGIN_H
    console.log(this.container.width)
    var origin = {
      x: Util.marginForCenterPosition(this.container.width, enemiesTotalWidth),
      y: this.container.height - 100 - 4 * STANDARD_PLAYER_SIZE.h - 3 * STANDARD_ENEMY_MARGIN_H
    }
    //100.0 + 5 * STANDARD_PLAYER_SIZE.h + 4 * STANDARD_ENEMY_MARGIN_V
    var self = this
    var enemies = this.enemyGenerator(function (enemy, i, j) {
      enemy.width = STANDARD_PLAYER_SIZE.w
      enemy.height = STANDARD_PLAYER_SIZE.h
      enemy.origin.x = origin.x + i * STANDARD_PLAYER_SIZE.w + i * STANDARD_ENEMY_MARGIN_H
      enemy.origin.y = origin.y + j * STANDARD_PLAYER_SIZE.h + j * STANDARD_ENEMY_MARGIN_V
      switch (j) {
        case 0:
        case 1:
          enemy.color = Util.color_red()
          break
        case 3:
        case 2:
          enemy.color = Util.color_yellow()
          break
        case 4:
          enemy.color = Util.color_green()
          break
        default:
          enemy.color = Util.color_purple()
          break
      }
      self.container.addSubDrawable(enemy)
    }, PLAYER_DEPTH)
    this.animator.enemies = enemies
  }

  buildBricks() {
    var bricksTotalWidth = 4 * STANDARD_BRICK_SIZE.w + 3 * STANDARD_BRICK_MARGIN_H
    var origin = {
      x: Util.marginForCenterPosition(this.container.width, bricksTotalWidth),
      y: 125.0 + STANDARD_BRICK_SIZE.h
    }

    var self = this
    var bricks = this.bricksGenerator(function (brick, i) {
      brick.width = STANDARD_BRICK_SIZE.w
      brick.height = STANDARD_BRICK_SIZE.h
      brick.origin.x = origin.x + i * STANDARD_BRICK_SIZE.w + i * STANDARD_BRICK_MARGIN_H
      brick.origin.y = origin.y
      brick.color = Util.color_purple()
      self.container.addSubDrawable(brick)
    }, BACKGROUND_DEPTH)
    this.animator.bricks = bricks
  }

  buildPlayer() {
    var origin = {
      x: Util.marginForCenterPosition(this.container.width, STANDARD_PLAYER_SIZE.w),
      y: 25.0 + STANDARD_PLAYER_SIZE.h
    }
    var player = new Spaceship(PLAYER_DEPTH, origin, STANDARD_PLAYER_SIZE.w, STANDARD_PLAYER_SIZE.h, Util.COLOR_BLUE)
    this.container.addSubDrawable(player)

    this.animator.player = player
  }

}
// TODO Object from generator, eliminate hard coded values
/**
 * Generates list of enemies
 * @param  {function} setup setup function
 * @return {Array} array of stacks of enemies
 */
function generateEnemies(setup, depth) {
  var enemies = []

  for(var i = 0; i < 11; i++) {
    var stack = []
    for (var j = 0; j < 5; j++) {
      var enemy = new Enemy(depth)
      setup(enemy, i, j)
      stack.push(enemy)
    }
    enemies.push(stack)
  }
  return enemies
}

/**
 * Generates list of bricks
 * @param  {function} setup takes Brick object and index
 * @return {Array} array of bricks
 */
function generateBricks(setup, depth) {
  var bricks = []

  for(var i = 0; i < 4; i++) {
    var brick = new Brick(depth)
    setup(brick, i)
    bricks.push(brick)
  }
  return bricks
}
