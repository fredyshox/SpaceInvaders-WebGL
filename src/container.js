import {Drawable} from "./drawable"

/**
 * Composite Drawable object
 * @extends Drawable
 */
export class ContainerDrawable extends Drawable {

  constructor(mode, vertices, origin, width, height, colorHex) {
    super(mode, vertices, origin, width, height, colorHex)
    this.drawables = []
  }

  addSubDrawable(drawable) {
    this.drawables.push(drawable)
  }

  removeSubDrawable(drawable, gl) {
    var index = this.drawables.indexOf(drawable)
    if (index >= 0) {
      var d = this.drawables.splice(index, 1)[0]
      if (gl) {
        d.remove(gl)
      }
    }
  }

  attach(gl) {
    //super.attach(gl)
    this.drawables.forEach(function(drawable) {
      drawable.attach(gl)
    })
  }

  draw(gl) {
    //super.draw(gl)
    this.drawables.forEach(function(drawable) {
      drawable.draw(gl)
    })
  }

}
