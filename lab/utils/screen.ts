export let canvasEl: HTMLCanvasElement | null
// must be called when resizing
export const resetCanvasCheck = () => {
  if (canvasEl) {
    const el = document.createElement('canvas')
    el.id = 'experiment'
    // add the fresh canvas next to the old one
    canvasEl.insertAdjacentElement('afterend', el)
    canvasEl.remove()
    canvasEl = null
  }
}
let size: Point = { x: 0, y: 0 }

export interface Point {
  x: number
  y: number
}

export function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function ensureCanvasWithSize(): [HTMLCanvasElement, Point] {
  const newCanvasEl = document.getElementById('experiment') as HTMLCanvasElement

  if (!newCanvasEl) {
    console.log('No Canvas element with id "experiment" found')
  }

  if (newCanvasEl === canvasEl) return [canvasEl, size]
  canvasEl = newCanvasEl

  const { width, height } = window.getComputedStyle(canvasEl)
  size = { x: parseInt(width!, 10) || 0, y: parseInt(height!, 10) || 0 }
  canvasEl.setAttribute('width', '' + size.x)
  canvasEl.setAttribute('height', '' + size.y)

  return [canvasEl, size]
}
