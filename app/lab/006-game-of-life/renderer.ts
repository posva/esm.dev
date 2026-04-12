import type { Grid, Cell, Side, Point } from './grid'

export interface RenderOptions {
  /** Color for alive sides */
  aliveColor?: string
  /** Color for dead sides (cell outlines) */
  deadColor?: string
  /** Line width for alive sides */
  aliveWidth?: number
  /** Line width for dead sides (cell outlines) */
  deadWidth?: number
  /** Opacity for dead sides (0-1) */
  deadAlpha?: number
  /** Background color */
  bgColor?: string
}

const DEFAULTS: Required<RenderOptions> = {
  aliveColor: '#22c55e',
  deadColor: '#888888',
  aliveWidth: 3,
  deadWidth: 0.5,
  deadAlpha: 0.25,
  bgColor: '#0a0a0a',
}

/**
 * Compute the bounding box of all cell vertices in the grid.
 */
function gridBounds(grid: Grid): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const cell of grid.cells) {
    for (const v of cell.vertices) {
      if (v.x < minX) minX = v.x
      if (v.y < minY) minY = v.y
      if (v.x > maxX) maxX = v.x
      if (v.y > maxY) maxY = v.y
    }
  }
  return { minX, minY, maxX, maxY }
}

/**
 * Find the two vertices of a cell that form a given side.
 * Side i connects vertex[i] to vertex[(i+1) % N].
 */
function sideVertices(cell: Cell, side: Side): [Point, Point] {
  const idx = cell.sides.indexOf(side)
  const n = cell.vertices.length
  return [cell.vertices[idx], cell.vertices[(idx + 1) % n]]
}

/**
 * Render the grid onto a canvas context.
 * Handles coordinate transforms to fit the grid centered in the canvas.
 */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  canvasWidth: number,
  canvasHeight: number,
  options: RenderOptions = {},
): void {
  const opts = { ...DEFAULTS, ...options }

  // Clear
  ctx.fillStyle = opts.bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  if (grid.cells.length === 0) return

  // Compute transform to fit grid in canvas with padding
  const bounds = gridBounds(grid)
  const gridW = bounds.maxX - bounds.minX
  const gridH = bounds.maxY - bounds.minY

  if (gridW === 0 || gridH === 0) return

  const padding = 20
  const availW = canvasWidth - padding * 2
  const availH = canvasHeight - padding * 2
  const scale = Math.min(availW / gridW, availH / gridH)
  const offsetX = padding + (availW - gridW * scale) / 2 - bounds.minX * scale
  const offsetY = padding + (availH - gridH * scale) / 2 - bounds.minY * scale

  const tx = (x: number) => x * scale + offsetX
  const ty = (y: number) => y * scale + offsetY

  // Draw cell outlines (dead sides)
  ctx.save()
  ctx.globalAlpha = opts.deadAlpha
  ctx.strokeStyle = opts.deadColor
  ctx.lineWidth = opts.deadWidth
  ctx.beginPath()
  for (const cell of grid.cells) {
    const verts = cell.vertices
    ctx.moveTo(tx(verts[0].x), ty(verts[0].y))
    for (let i = 1; i < verts.length; i++) {
      ctx.lineTo(tx(verts[i].x), ty(verts[i].y))
    }
    ctx.closePath()
  }
  ctx.stroke()
  ctx.restore()

  // Draw alive sides on top
  ctx.strokeStyle = opts.aliveColor
  ctx.lineWidth = opts.aliveWidth
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (const side of grid.sides) {
    if (!side.alive) continue

    // Get vertices from the first cell that has this side
    const cell = side.cells[0]
    if (!cell) continue
    const [v1, v2] = sideVertices(cell, side)

    ctx.moveTo(tx(v1.x), ty(v1.y))
    ctx.lineTo(tx(v2.x), ty(v2.y))
  }
  ctx.stroke()
}
