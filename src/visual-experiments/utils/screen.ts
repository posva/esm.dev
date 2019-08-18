export const container = document.getElementById(
  'experiment-container'
) as HTMLElement
export const canvasEl: HTMLCanvasElement = document.getElementById(
  'experiment'
) as HTMLCanvasElement
export const size = getDimensions()
canvasEl.setAttribute('width', '' + size.x)
canvasEl.setAttribute('height', '' + size.x)

export interface Point {
  x: number
  y: number
}

export function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function getBackgroundColor(): string {
  const { backgroundColor } = window.getComputedStyle(document.body)
  return backgroundColor || '#121314'
}

export function getColor(): string {
  const { color } = window.getComputedStyle(container)
  return color || '#efeeed'
}

export function getDimensions(): Point {
  const { width, height } = window.getComputedStyle(canvasEl)
  return { x: parseInt(width!, 10) || 0, y: parseInt(height!, 10) || 0 }
}
