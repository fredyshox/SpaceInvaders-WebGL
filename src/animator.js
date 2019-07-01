import {DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT} from "./util"
import {OWNER_ENEMY, OWNER_PLAYER, doOverlap} from "./drawable"

/**
 * Object responsible for maintaining animations
 */
export class Animator {

  constructor(context, container, margin, callbacks) {
    this.context = context
    this.container = container
    this.callbacks = callbacks
    this.margin = margin || 0.0
    this.requestId = 0
    this.enemyData = {
      enemies: [],
      speed: 0.07,
      direction: DIRECTION_RIGHT
    }
    this.playerData = {
      player: null,
      speed: 0.4,
      direction: null
    }
    this.bulletData = {
      bullets: [],
      speed: 0.3
    }
    this.brickData = {
      bricks: []
    }
  }

  // getters/setters

  get bullets() {
    return this.bulletData.bullets
  }

  set bullets(newValue) {
    this.bulletData.bullets = newValue
  }

  get enemies() {
    return this.enemyData.enemies
  }

  set enemies(newValue) {
    this.enemyData.enemies = newValue
  }

  get player() {
    return this.playerData.player
  }

  set player(newValue) {
    this.playerData.player = newValue
  }

  get bricks() {
    return this.brickData.bricks
  }

  set bricks(newValue) {
    this.brickData.bricks = newValue
  }

  get isAnimating() {
    return this.requestId != 0
  }

  start() {
    this.runLoop()
  }

  stop() {
    if (this.requestId) {
      window.cancelAnimationFrame(this.requestId);
      this.requestId = 0;
    }
    this.redraw()
  }

  runLoop() {
    var lastTime = window.performance.now()
    var self = this
    var callback = function (time) {
      var timeDelta = time - lastTime
      lastTime = time
      self.enemyAnimation(timeDelta)
      self.playerAnimation(timeDelta)
      self.bulletAnimation(timeDelta)
      self.redraw()
      self.context.finish()
      self.notifyEnemiesPosition()
      self.detectCollisions()
      if (self.requestId) {
          self.requestId = window.requestAnimationFrame(callback)
      }
    }
    this.requestId = window.requestAnimationFrame(callback)
  }

  // object animations

  playerAnimation(timeDelta) {
    if (this.playerData.direction != null) {
      var a = (this.playerData.direction == DIRECTION_RIGHT) ? 1 : -1
      var newX = this.player.origin.x + a * this.playerData.speed * timeDelta
      if (newX >= this.margin && newX <= this.container.width - this.margin - this.player.width) {
          this.player.origin.x = newX
      }
    }
  }

  bulletAnimation(timeDelta) {
    for (var i = 0; i < this.bullets.length; i++) {
      var bullet = this.bullets[i]
      switch (bullet.owner) {
        case OWNER_PLAYER:
          bullet.origin.y += this.bulletData.speed * timeDelta
          break
        case OWNER_ENEMY:
          bullet.origin.y -= this.bulletData.speed * timeDelta
          break
        default:
          break
      }
    }
  }

  enemyAnimation(timeDelta) {
    for (var i = 0; i < this.enemies.length; i++) {
      var stack = this.enemies[i]
      for(var j = 0; j < stack.length; j++) {
        var enemy = stack[j]
        var speed = this.enemyData.speed
        switch (this.enemyData.direction) {
          case DIRECTION_RIGHT:
            enemy.origin.x += speed * timeDelta
            break
          case DIRECTION_LEFT:
            enemy.origin.x -= speed * timeDelta
            break
          case DIRECTION_DOWN:
            enemy.origin.y -= 10.0//2*speed * timeDelta
            break
          default:
            break
        }
      }
    }
    var min_maxX = enemyMinMaxX(this.enemies)
    var direction = this.enemyData.direction
    if (min_maxX.max >= this.container.width - this.margin) {
      this.enemyData.direction = (direction == DIRECTION_DOWN) ? DIRECTION_LEFT : DIRECTION_DOWN
    } else if(min_maxX.min <= this.margin) {
      this.enemyData.direction = (direction == DIRECTION_DOWN) ? DIRECTION_RIGHT : DIRECTION_DOWN
    }
  }

  detectCollisions() {
    for(var i = 0; i < this.bullets.length; i++) {
      var bullet = this.bullets[i]
      if (bullet.owner == OWNER_PLAYER) {
        if (this.enemyCollisions(bullet) || this.brickCollisions(bullet)) {
          this.callbacks.onBulletHit(this, bullet)
        }
      } else if (bullet.owner == OWNER_ENEMY) {
        if (this.playerCollisions(bullet) || this.brickCollisions(bullet)) {
          this.callbacks.onBulletHit(this, bullet)
        }
      }
    }
  }

  enemyCollisions(bullet) {
    var stackIdx = []
    var nonEmptyStacks = this.enemies.filter((stack) => {
       return stack.length != 0
     })

    nonEmptyStacks.forEach((stack) => {
      var index = this.enemies.indexOf(stack) // index in original array
      stackIdx.push(index)
    })

    var firstLineEnemies = nonEmptyStacks.map((stack) => {
       return stack[0]
     })

     for (var i = 0; i < firstLineEnemies.length; i++) {
       var enemy = firstLineEnemies[i]
       if (doOverlap(bullet, enemy)) {
         // passing animator ref, enemy, and stack index which it belongs to
         this.callbacks.onEnemyHit(this, enemy, stackIdx[i])
         return true
       }
     }
     return false
  }

  playerCollisions(bullet) {
    if (doOverlap(bullet, this.player)) {
      this.callbacks.onPlayerHit(this, this.player)
      return true
    }
    return false
  }

  brickCollisions(bullet) {
    for (var i = 0; i < this.bricks.length; i++) {
      var brick = this.bricks[i]
      if (doOverlap(bullet, brick)) {
        this.callbacks.onBrickHit(this, brick)
        return true
      }
    }
    return false
  }

  notifyEnemiesPosition() {
    this.callbacks.onEnemiesPosition(this, enemyMinMaxY(this.enemies).max)
  }

  redraw() {
    this.context.clearColor(0.0, 0.0, 0.0, 1.0)
    this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT)
    this.container.draw(this.context)
  }

}

function enemyMinMaxX(enemies) {
  var nonEmpty = enemies.filter((stack) => { return stack.length != 0})
  if (nonEmpty.length == 0) {
    return null
  }
  var firstColumn = nonEmpty[0]
  var lastColumn = nonEmpty[nonEmpty.length - 1]
  var maxObj = lastColumn[lastColumn.length - 1]
  var minObj = firstColumn[firstColumn.length - 1]
  return {
    max: maxObj.origin.x + maxObj.width,
    min: minObj.origin.x
  }
}

function enemyMinMaxY(enemies) {
  var elCount = enemies.map((stack) => { return stack.length })
  var idx, max = 0
  elCount.forEach((count, i) => {
    if (count > max) {
      idx = i
      max = count
    }
  })

  if (idx === undefined) {
    return null
  } else {
    var largestStack = enemies[idx]
    return {
      max: largestStack[0].origin.y,
      min: largestStack[largestStack.length - 1].origin.y
    }
  }
}
