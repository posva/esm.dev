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
  /**
   * When true, skip per-side color/alpha work and draw every alive side
   * with `aliveColor` in one batched stroke. Used by rules that don't
   * carry life metadata (Classic, Seeds, Day & Night).
   */
  uniformAlive?: boolean
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
  uniformAlive: false,
}

// Precomputed HSL palette for the Survival rule's hue bucketing.
// SURVIVAL_HUE_SHIFT in rules.ts is 5°, so only 72 distinct hues ever appear.
const HUE_PALETTE: string[] = []
for (let h = 0; h < 360; h += 5) {
  HUE_PALETTE.push(`hsl(${h}, 80%, 50%)`)
}

// Reusable per-frame scratch buffers for drawAliveBucketed — allocated once
// per module, cleared with .length = 0 each call to keep capacity.
const BUCKET_SCRATCH: Side[][] = new Array(HUE_PALETTE.length)
for (let i = 0; i < BUCKET_SCRATCH.length; i++) BUCKET_SCRATCH[i] = []
const FADED_SCRATCH: Side[] = []

// Path2D cache for the static parts of the grid (cell outlines, linked
// connections). These never change after grid construction, so we build
// them once per (grid, canvas size) and hand them to `ctx.stroke(path)`
// every frame — the browser keeps the geometry in its native side.
interface OutlineCache {
  grid: Grid
  canvasW: number
  canvasH: number
  // Polygon grids: cell outlines.
  polygonOutlines: Path2D | null
  // Circle grids: per-cell circle outlines and inter-circle connection lines.
  circleOutlines: Path2D | null
  circleConnections: Path2D | null
}

let cachedOutlines: OutlineCache | null = null

function getOutlineCache(grid: Grid, canvasW: number, canvasH: number): OutlineCache {
  if (
    cachedOutlines &&
    cachedOutlines.grid === grid &&
    cachedOutlines.canvasW === canvasW &&
    cachedOutlines.canvasH === canvasH
  ) {
    return cachedOutlines
  }
  const { tx, ty, valid } = computeTransform(grid, canvasW, canvasH)
  const cache: OutlineCache = {
    grid,
    canvasW,
    canvasH,
    polygonOutlines: null,
    circleOutlines: null,
    circleConnections: null,
  }
  if (!valid) {
    cachedOutlines = cache
    return cache
  }

  if (grid.gridType === 'circle') {
    const outlines = new Path2D()
    for (const cell of grid.cells) {
      const verts = cell.vertices
      outlines.moveTo(tx(verts[0].x), ty(verts[0].y))
      for (let i = 1; i < verts.length; i++) {
        outlines.lineTo(tx(verts[i].x), ty(verts[i].y))
      }
      outlines.closePath()
    }
    cache.circleOutlines = outlines

    const conns = new Path2D()
    for (const side of grid.sides) {
      for (const linked of side.linkedNeighbors) {
        if (side.id > linked.id) continue
        const cellA = side.cells[0]
        const cellB = linked.cells[0]
        if (!cellA || !cellB) continue
        const vA = cellA.vertices[side.indexInCellA]
        const vB = cellB.vertices[linked.indexInCellA]
        conns.moveTo(tx(vA.x), ty(vA.y))
        conns.lineTo(tx(vB.x), ty(vB.y))
      }
    }
    cache.circleConnections = conns
  } else {
    const outlines = new Path2D()
    for (const cell of grid.cells) {
      const verts = cell.vertices
      outlines.moveTo(tx(verts[0].x), ty(verts[0].y))
      for (let i = 1; i < verts.length; i++) {
        outlines.lineTo(tx(verts[i].x), ty(verts[i].y))
      }
      outlines.closePath()
    }
    cache.polygonOutlines = outlines
  }

  cachedOutlines = cache
  return cache
}

function sideVertices(cell: Cell, side: Side): [Point, Point] {
  const idx = cell.sides[side.indexInCellA] === side ? side.indexInCellA : side.indexInCellB
  const n = cell.vertices.length
  return [cell.vertices[idx], cell.vertices[(idx + 1) % n]]
}

/**
 * Compute the transform parameters to fit the grid centered in the canvas.
 */
function computeTransform(grid: Grid, canvasWidth: number, canvasHeight: number) {
  const bounds = grid.getBounds()
  const gridW = bounds.maxX - bounds.minX
  const gridH = bounds.maxY - bounds.minY

  // Use Math.max so the grid fills the entire canvas, overflowing edges
  const scale = Math.max(canvasWidth / gridW, canvasHeight / gridH)
  const offsetX = (canvasWidth - gridW * scale) / 2 - bounds.minX * scale
  const offsetY = (canvasHeight - gridH * scale) / 2 - bounds.minY * scale

  return {
    tx: (x: number) => x * scale + offsetX,
    ty: (y: number) => y * scale + offsetY,
    scale,
    offsetX,
    offsetY,
    valid: gridW > 0 && gridH > 0,
  }
}

function dotVertex(cell: Cell, side: Side): Point {
  return cell.vertices[side.indexInCellA]
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
    const cache = getOutlineCache(grid, canvasWidth, canvasHeight)

    // Circle outlines — cached Path2D.
    if (cache.circleOutlines) {
      ctx.save()
      ctx.globalAlpha = opts.deadAlpha
      ctx.strokeStyle = opts.deadColor
      ctx.lineWidth = opts.deadWidth
      ctx.stroke(cache.circleOutlines)
      ctx.restore()
    }

    // Inter-circle connection lines — cached Path2D.
    if (cache.circleConnections) {
      ctx.save()
      ctx.globalAlpha = opts.deadAlpha * 0.5
      ctx.strokeStyle = opts.deadColor
      ctx.lineWidth = opts.deadWidth
      ctx.stroke(cache.circleConnections)
      ctx.restore()
    }

    // Dead dots — batched arcs inside one path.
    const deadR = opts.deadDotRadius * (scale / 30)
    ctx.save()
    ctx.globalAlpha = opts.deadAlpha
    ctx.fillStyle = opts.deadColor
    ctx.beginPath()
    for (const side of grid.sides) {
      if (side.alive) continue
      const cell = side.cells[0]
      if (!cell) continue
      const v = dotVertex(cell, side)
      const cx = tx(v.x)
      const cy = ty(v.y)
      ctx.moveTo(cx + deadR, cy)
      ctx.arc(cx, cy, deadR, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.restore()
  }

  // Alive dots
  const aliveR = opts.dotRadius * (scale / 30)
  if (opts.uniformAlive) {
    ctx.save()
    ctx.fillStyle = opts.aliveColor
    ctx.beginPath()
    for (const side of grid.sides) {
      if (!side.alive) continue
      const cell = side.cells[0]
      if (!cell) continue
      const v = dotVertex(cell, side)
      const cx = tx(v.x)
      const cy = ty(v.y)
      ctx.moveTo(cx + aliveR, cy)
      ctx.arc(cx, cy, aliveR, 0, Math.PI * 2)
    }
    ctx.fill()
    ctx.restore()
  } else {
    drawAliveBucketed(ctx, grid, tx, ty, aliveR, opts, true)
  }
}

/**
 * Hue-bucketed alive pass. Groups alive sides by rounded hue so each
 * bucket's fillStyle/strokeStyle is set once and the path is a single op.
 * Faded sides (alpha < 1) are drawn in a second per-side pass — their
 * count is tiny because fading only kicks in at the tail of a side's life.
 */
function drawAliveBucketed(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  tx: (x: number) => number,
  ty: (y: number) => number,
  aliveR: number,
  opts: Required<RenderOptions>,
  asDots: boolean,
): void {
  // Reuse module-level scratch so no arrays are allocated per frame.
  const buckets = BUCKET_SCRATCH
  for (let i = 0; i < buckets.length; i++) buckets[i].length = 0
  const faded = FADED_SCRATCH
  faded.length = 0

  const nBuckets = HUE_PALETTE.length
  for (const side of grid.sides) {
    if (!side.alive) continue
    if (side.maxLife <= 0) {
      // No life metadata → treat as hue 0, alpha 1 via bucket 0 with default color.
      buckets[0].push(side)
      continue
    }
    const fadeThreshold = 0.1 * side.maxLife
    if (side.life <= fadeThreshold) {
      faded.push(side)
    } else {
      // hue is maintained in [0, 360) by rules.ts, but clamp defensively.
      let idx = (side.hue * 0.2) | 0
      if (idx < 0) idx = 0
      else if (idx >= nBuckets) idx = nBuckets - 1
      buckets[idx].push(side)
    }
  }

  // Opaque buckets — one fill/stroke per non-empty bucket.
  for (let b = 0; b < buckets.length; b++) {
    const bucket = buckets[b]
    if (bucket.length === 0) continue
    ctx.save()
    if (asDots) {
      ctx.fillStyle = bucket[0].maxLife > 0 ? HUE_PALETTE[b] : opts.aliveColor
      ctx.beginPath()
      for (const side of bucket) {
        const cell = side.cells[0]
        if (!cell) continue
        const v = dotVertex(cell, side)
        const cx = tx(v.x)
        const cy = ty(v.y)
        ctx.moveTo(cx + aliveR, cy)
        ctx.arc(cx, cy, aliveR, 0, Math.PI * 2)
      }
      ctx.fill()
    } else {
      ctx.strokeStyle = bucket[0].maxLife > 0 ? HUE_PALETTE[b] : opts.aliveColor
      ctx.lineWidth = opts.aliveWidth
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (const side of bucket) {
        const cell = side.cells[0]
        if (!cell) continue
        const [v1, v2] = sideVertices(cell, side)
        ctx.moveTo(tx(v1.x), ty(v1.y))
        ctx.lineTo(tx(v2.x), ty(v2.y))
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  // Faded sides — one draw per side because alpha varies.
  for (const side of faded) {
    const cell = side.cells[0]
    if (!cell) continue
    const fadeThreshold = 0.1 * side.maxLife
    const alpha = side.life / fadeThreshold
    let idx = (side.hue * 0.2) | 0
    if (idx < 0) idx = 0
    else if (idx >= nBuckets) idx = nBuckets - 1
    ctx.save()
    ctx.globalAlpha = alpha
    if (asDots) {
      ctx.fillStyle = HUE_PALETTE[idx]
      const v = dotVertex(cell, side)
      ctx.beginPath()
      ctx.arc(tx(v.x), ty(v.y), aliveR, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = HUE_PALETTE[idx]
      ctx.lineWidth = opts.aliveWidth
      ctx.lineCap = 'round'
      const [v1, v2] = sideVertices(cell, side)
      ctx.beginPath()
      ctx.moveTo(tx(v1.x), ty(v1.y))
      ctx.lineTo(tx(v2.x), ty(v2.y))
      ctx.stroke()
    }
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

  ctx.fillStyle = opts.bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  if (grid.cells.length === 0) return

  if (grid.gridType === 'circle') {
    renderCircleGrid(ctx, grid, canvasWidth, canvasHeight, opts)
    return
  }

  const { tx, ty, valid } = computeTransform(grid, canvasWidth, canvasHeight)
  if (!valid) return

  // Cell outlines — cached Path2D.
  if (opts.showGrid) {
    const cache = getOutlineCache(grid, canvasWidth, canvasHeight)
    if (cache.polygonOutlines) {
      ctx.save()
      ctx.globalAlpha = opts.deadAlpha
      ctx.strokeStyle = opts.deadColor
      ctx.lineWidth = opts.deadWidth
      ctx.stroke(cache.polygonOutlines)
      ctx.restore()
    }
  }

  // Alive sides
  if (opts.uniformAlive) {
    // Fast path: single path, one stroke.
    ctx.save()
    ctx.strokeStyle = opts.aliveColor
    ctx.lineWidth = opts.aliveWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (const side of grid.sides) {
      if (!side.alive) continue
      const cell = side.cells[0]
      if (!cell) continue
      const [v1, v2] = sideVertices(cell, side)
      ctx.moveTo(tx(v1.x), ty(v1.y))
      ctx.lineTo(tx(v2.x), ty(v2.y))
    }
    ctx.stroke()
    ctx.restore()
  } else {
    drawAliveBucketed(ctx, grid, tx, ty, 0, opts, false)
  }
}

// ── Spatial hash for findNearestSide ──

interface SpatialHash {
  cellSize: number
  cols: number
  rows: number
  buckets: Int32Array[] // side ids per bucket
  anchorsX: Float32Array // anchor X per side (canvas-space)
  anchorsY: Float32Array
  canvasW: number
  canvasH: number
  gridToken: Grid
}

let cachedHash: SpatialHash | null = null

function buildHash(grid: Grid, canvasWidth: number, canvasHeight: number): SpatialHash | null {
  const { tx, ty, valid } = computeTransform(grid, canvasWidth, canvasHeight)
  if (!valid) return null
  const isCircle = grid.gridType === 'circle'
  const n = grid.sides.length
  const anchorsX = new Float32Array(n)
  const anchorsY = new Float32Array(n)

  for (let i = 0; i < n; i++) {
    const side = grid.sides[i]
    const cell = side.cells[0]
    if (!cell) {
      anchorsX[i] = NaN
      anchorsY[i] = NaN
      continue
    }
    if (isCircle) {
      const v = cell.vertices[side.indexInCellA]
      anchorsX[i] = tx(v.x)
      anchorsY[i] = ty(v.y)
    } else {
      const idx = side.indexInCellA
      const nv = cell.vertices.length
      const v1 = cell.vertices[idx]
      const v2 = cell.vertices[(idx + 1) % nv]
      anchorsX[i] = (tx(v1.x) + tx(v2.x)) / 2
      anchorsY[i] = (ty(v1.y) + ty(v2.y)) / 2
    }
  }

  // Target ~same number of buckets as sides so avg bucket size ~1.
  const cellSize = Math.max(16, Math.sqrt((canvasWidth * canvasHeight) / Math.max(1, n)))
  const cols = Math.max(1, Math.ceil(canvasWidth / cellSize))
  const rows = Math.max(1, Math.ceil(canvasHeight / cellSize))
  const counts = new Int32Array(cols * rows)
  for (let i = 0; i < n; i++) {
    const ax = anchorsX[i]
    const ay = anchorsY[i]
    if (ax !== ax) continue // NaN check (no cell)
    const cx = Math.min(cols - 1, Math.max(0, Math.floor(ax / cellSize)))
    const cy = Math.min(rows - 1, Math.max(0, Math.floor(ay / cellSize)))
    counts[cy * cols + cx]++
  }
  const buckets: Int32Array[] = new Array(cols * rows)
  for (let i = 0; i < buckets.length; i++) buckets[i] = new Int32Array(counts[i])
  const cursors = new Int32Array(cols * rows)
  for (let i = 0; i < n; i++) {
    const ax = anchorsX[i]
    const ay = anchorsY[i]
    if (ax !== ax) continue
    const cx = Math.min(cols - 1, Math.max(0, Math.floor(ax / cellSize)))
    const cy = Math.min(rows - 1, Math.max(0, Math.floor(ay / cellSize)))
    const idx = cy * cols + cx
    buckets[idx][cursors[idx]++] = i
  }

  return {
    cellSize,
    cols,
    rows,
    buckets,
    anchorsX,
    anchorsY,
    canvasW: canvasWidth,
    canvasH: canvasHeight,
    gridToken: grid,
  }
}

function getHash(grid: Grid, canvasWidth: number, canvasHeight: number): SpatialHash | null {
  if (
    cachedHash &&
    cachedHash.gridToken === grid &&
    cachedHash.canvasW === canvasWidth &&
    cachedHash.canvasH === canvasHeight
  ) {
    return cachedHash
  }
  cachedHash = buildHash(grid, canvasWidth, canvasHeight)
  return cachedHash
}

/**
 * Find the nearest side to a canvas coordinate using a uniform spatial hash.
 * Falls back to a brute-force scan if the hash can't be built.
 */
export function findNearestSide(
  grid: Grid,
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
): Side | null {
  if (grid.cells.length === 0) return null
  const hash = getHash(grid, canvasWidth, canvasHeight)
  if (!hash) return null

  const { cellSize, cols, rows, buckets, anchorsX, anchorsY } = hash

  const startCx = Math.min(cols - 1, Math.max(0, Math.floor(canvasX / cellSize)))
  const startCy = Math.min(rows - 1, Math.max(0, Math.floor(canvasY / cellSize)))

  let best: Side | null = null
  let bestDist = Infinity

  // Expand the search ring outward until we've found a side AND our
  // best-so-far is closer than the minimum distance to the next ring.
  for (let ring = 0; ring < Math.max(cols, rows); ring++) {
    const cxMin = Math.max(0, startCx - ring)
    const cxMax = Math.min(cols - 1, startCx + ring)
    const cyMin = Math.max(0, startCy - ring)
    const cyMax = Math.min(rows - 1, startCy + ring)

    for (let cy = cyMin; cy <= cyMax; cy++) {
      for (let cx = cxMin; cx <= cxMax; cx++) {
        // Skip cells already covered by a smaller ring.
        if (
          ring > 0 &&
          cx > startCx - ring &&
          cx < startCx + ring &&
          cy > startCy - ring &&
          cy < startCy + ring
        ) {
          continue
        }
        const bucket = buckets[cy * cols + cx]
        for (let i = 0; i < bucket.length; i++) {
          const sideId = bucket[i]
          const dx = canvasX - anchorsX[sideId]
          const dy = canvasY - anchorsY[sideId]
          const dist = dx * dx + dy * dy
          if (dist < bestDist) {
            bestDist = dist
            best = grid.sides[sideId]
          }
        }
      }
    }

    if (best) {
      // Minimum possible distance to anything outside the expanded ring.
      const ringEdge = (ring + 1) * cellSize
      const dxOut = Math.max(
        0,
        Math.max(canvasX - (startCx + ring + 1) * cellSize, startCx * cellSize - canvasX),
      )
      const dyOut = Math.max(
        0,
        Math.max(canvasY - (startCy + ring + 1) * cellSize, startCy * cellSize - canvasY),
      )
      const outerMinSq = dxOut * dxOut + dyOut * dyOut
      void ringEdge
      if (bestDist <= outerMinSq) break
    }
  }

  return best
}

/** Clear the cached spatial hash and outline cache — call on grid rebuild. */
export function invalidateSpatialHash(): void {
  cachedHash = null
  cachedOutlines = null
}
