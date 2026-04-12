import type { Grid, Cell, Side, Point } from './grid'

export interface RenderOptions {
  /** Color for alive sides / dots */
  aliveColor?: string
  /** Color for dead sides / dots (cell outlines) */
  deadColor?: string
  /** Line width for alive sides */
  aliveWidth?: number
  /** Line width for dead sides (cell outlines) */
  deadWidth?: number
  /** Opacity for dead sides (0-1) */
  deadAlpha?: number
  /** Background color */
  bgColor?: string
  /** Radius for alive dots in circle mode */
  dotRadius?: number
  /** Radius for dead dots in circle mode */
  deadDotRadius?: number
  /** Whether to draw grid lines / cell outlines */
  showGrid?: boolean
}

const DEFAULTS: Required<RenderOptions> = {
  aliveColor: '#22c55e',
  deadColor: '#888888',
  aliveWidth: 3,
  deadWidth: 0.5,
  deadAlpha: 0.25,
  bgColor: '#0a0a0a',
  dotRadius: 4,
  deadDotRadius: 1.5,
  showGrid: true,
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
 * Compute the transform parameters to fit the grid centered in the canvas.
 */
function computeTransform(grid: Grid, canvasWidth: number, canvasHeight: number) {
  const bounds = gridBounds(grid)
  const gridW = bounds.maxX - bounds.minX
  const gridH = bounds.maxY - bounds.minY

  const padding = 20
  const availW = canvasWidth - padding * 2
  const availH = canvasHeight - padding * 2
  const scale = Math.min(availW / gridW, availH / gridH)
  const offsetX = padding + (availW - gridW * scale) / 2 - bounds.minX * scale
  const offsetY = padding + (availH - gridH * scale) / 2 - bounds.minY * scale

  return {
    tx: (x: number) => x * scale + offsetX,
    ty: (y: number) => y * scale + offsetY,
    scale,
    valid: gridW > 0 && gridH > 0,
  }
}

/**
 * Get the vertex position for a dot (side) in its cell.
 * The side index within the cell corresponds to the vertex index.
 */
function dotVertex(cell: Cell, side: Side): Point {
  const idx = cell.sides.indexOf(side)
  return cell.vertices[idx]
}

/**
 * Compute per-side color and opacity when life metadata is present.
 * Falls back to the default color when maxLife is 0 (non-survival rules).
 */
function sideColor(side: Side, defaultColor: string): { color: string; alpha: number } {
  if (side.maxLife <= 0) return { color: defaultColor, alpha: 1 }
  const fadeThreshold = 0.1 * side.maxLife
  const alpha = side.life > fadeThreshold ? 1.0 : side.life / fadeThreshold
  return { color: `hsl(${side.hue}, 80%, 50%)`, alpha }
}

/** Set to true to draw hex outlines behind circles for debugging */
const DEBUG_HEX_OUTLINES = false

/**
 * Render a circle grid: dots on hex-arranged circles with connection lines.
 */
function renderCircleGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  canvasWidth: number,
  canvasHeight: number,
  opts: Required<RenderOptions>,
): void {
  const { tx, ty, scale, valid } = computeTransform(grid, canvasWidth, canvasHeight)
  if (!valid) return

  if (DEBUG_HEX_OUTLINES) {
    ctx.save()
    ctx.globalAlpha = opts.deadAlpha
    ctx.strokeStyle = opts.deadColor
    ctx.lineWidth = opts.deadWidth * 2
    for (const cell of grid.cells) {
      const cx = cell.center.x
      const cy = cell.center.y
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        const vx = tx(cx + Math.cos(angle))
        const vy = ty(cy + Math.sin(angle))
        if (i === 0) ctx.moveTo(vx, vy)
        else ctx.lineTo(vx, vy)
      }
      ctx.closePath()
      ctx.stroke()
    }
    ctx.restore()
  }

  if (opts.showGrid) {
    // Draw circle outlines (connecting dots)
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

    // Draw inter-circle connection lines
    ctx.save()
    ctx.globalAlpha = opts.deadAlpha * 0.5
    ctx.strokeStyle = opts.deadColor
    ctx.lineWidth = opts.deadWidth
    ctx.beginPath()
    for (const side of grid.sides) {
      for (const linked of side.linkedNeighbors) {
        // Only draw each connection once
        if (side.id > linked.id) continue
        const cellA = side.cells[0]
        const cellB = linked.cells[0]
        if (!cellA || !cellB) continue
        const vA = dotVertex(cellA, side)
        const vB = dotVertex(cellB, linked)
        ctx.moveTo(tx(vA.x), ty(vA.y))
        ctx.lineTo(tx(vB.x), ty(vB.y))
      }
    }
    ctx.stroke()
    ctx.restore()

    // Draw dead dots
    const deadR = opts.deadDotRadius * (scale / 30)
    ctx.save()
    ctx.globalAlpha = opts.deadAlpha
    ctx.fillStyle = opts.deadColor
    for (const side of grid.sides) {
      if (side.alive) continue
      const cell = side.cells[0]
      if (!cell) continue
      const v = dotVertex(cell, side)
      ctx.beginPath()
      ctx.arc(tx(v.x), ty(v.y), deadR, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  // Draw alive dots
  const aliveR = opts.dotRadius * (scale / 30)
  for (const side of grid.sides) {
    if (!side.alive) continue
    const cell = side.cells[0]
    if (!cell) continue
    const v = dotVertex(cell, side)
    const { color, alpha } = sideColor(side, opts.aliveColor)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(tx(v.x), ty(v.y), aliveR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
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

  if (grid.gridType === 'circle') {
    renderCircleGrid(ctx, grid, canvasWidth, canvasHeight, opts)
    return
  }

  const { tx, ty, valid } = computeTransform(grid, canvasWidth, canvasHeight)
  if (!valid) return

  // Draw cell outlines (dead sides)
  if (opts.showGrid) {
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
  }

  // Draw alive sides on top
  ctx.lineWidth = opts.aliveWidth
  ctx.lineCap = 'round'
  for (const side of grid.sides) {
    if (!side.alive) continue

    const cell = side.cells[0]
    if (!cell) continue
    const [v1, v2] = sideVertices(cell, side)
    const { color, alpha } = sideColor(side, opts.aliveColor)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(tx(v1.x), ty(v1.y))
    ctx.lineTo(tx(v2.x), ty(v2.y))
    ctx.stroke()
    ctx.restore()
  }
}

/**
 * Find the nearest side to a canvas coordinate.
 * For polygon grids, measures distance to edge midpoints.
 * For circle grids, measures distance to dot vertices.
 */
export function findNearestSide(
  grid: Grid,
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
): Side | null {
  if (grid.cells.length === 0) return null
  const { tx, ty, valid } = computeTransform(grid, canvasWidth, canvasHeight)
  if (!valid) return null

  let best: Side | null = null
  let bestDist = Infinity

  const isCircle = grid.gridType === 'circle'

  for (const side of grid.sides) {
    const cell = side.cells[0]
    if (!cell) continue

    let sx: number
    let sy: number

    if (isCircle) {
      const v = cell.vertices[cell.sides.indexOf(side)]
      sx = tx(v.x)
      sy = ty(v.y)
    } else {
      const [v1, v2] = sideVertices(cell, side)
      sx = (tx(v1.x) + tx(v2.x)) / 2
      sy = (ty(v1.y) + ty(v2.y)) / 2
    }

    const dx = canvasX - sx
    const dy = canvasY - sy
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      best = side
    }
  }

  return best
}
