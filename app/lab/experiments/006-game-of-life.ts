import { getColorVariable } from '../utils/colors'
import { Simulation } from '../006-game-of-life/simulation'
import { renderGrid, findNearestSide, invalidateSpatialHash } from '../006-game-of-life/renderer'
import { ALL_RULES, SURVIVAL_BASE_LIFE, randomizeMovement } from '../006-game-of-life/rules'
import type { GridType, PolygonType } from '../006-game-of-life/grid'

let sim: Simulation | null = null
let playing = true
let speed = 25 // steps per second
let gridType: GridType = 6
let precision = 12
let ruleIndex = ALL_RULES.findIndex((r) => r.name === 'Survival')
let lastStepTime = 0
let listeningOn: HTMLCanvasElement | null = null
let cleanupListeners: (() => void) | null = null
let lastWidth = 0
let lastHeight = 0
let lastDpr = 0
let cachedCtx: CanvasRenderingContext2D | null = null
let cachedRect: { left: number; top: number; width: number; height: number } = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
}
let isMouseDown = false
let showGrid = true
// Dirty flag: skip renderGrid (the hottest canvas work) when nothing changed
// since the previous frame. The display refresh rate (60/120Hz) is usually
// much higher than the sim rate (25Hz by default), so this saves a lot.
let dirty = true

const GRID_LABELS: Record<string, string> = { 3: '△', 4: '□', 6: '⬡', circle: '○' }

// Cap total anchor points so very large screens stay smooth. Circle grids
// emit `precision` sides per cell (vs 3/4/6 for polygons), so they hit the
// cap much faster. Scale the cap accordingly.
const MAX_POLYGON_CELLS = 6000
const MAX_CIRCLE_ANCHORS = 20_000

function initSim(width: number, height: number) {
  const base = gridType === 'circle' ? 40 : 25
  // Circle cells carry `precision` sides; the sim cost scales with side count,
  // not cell count, so derive the cell cap from an anchor-point budget.
  const maxCells =
    gridType === 'circle'
      ? Math.max(100, Math.floor(MAX_CIRCLE_ANCHORS / precision))
      : MAX_POLYGON_CELLS
  const minCellSize = Math.sqrt((width * height) / maxCells)
  const cellSize = Math.max(base, minCellSize)
  // +2 so the grid extends beyond the viewport edges
  const rows = Math.max(3, Math.floor(height / cellSize) + 2)
  const cols = Math.max(3, Math.floor(width / cellSize) + 2)

  sim = new Simulation(
    gridType,
    rows,
    cols,
    ALL_RULES[ruleIndex],
    gridType === 'circle' ? precision : undefined,
  )
  sim.randomize(0.3)
  invalidateSpatialHash()
  lastStepTime = 0
  dirty = true
}

function drawHUD(ctx: CanvasRenderingContext2D, width: number, height: number) {
  if (!sim) return

  const textColor = getColorVariable('textColor')
  const bgColor = getColorVariable('bgColor')

  const lineHeight = 16
  const padding = 10
  const fontSize = 12

  const typeLabel = GRID_LABELS[String(gridType)] || String(gridType)
  const precisionLabel = gridType === 'circle' ? ` p${precision}` : ''
  const lines = [
    `${typeLabel} ${gridType}${precisionLabel}  |  ${ALL_RULES[ruleIndex].name}  |  Gen ${sim.generation}  |  ${playing ? '▶' : '⏸'} ${speed}fps`,
    `[3/4/6] shape  [o] circle  [+/-] precision  [space] play  [→] step  [↑↓] speed  [r] random  [c] clear  [tab] rule  [d] grid`,
  ]

  const boxHeight = lines.length * lineHeight + padding * 2
  const boxY = height - boxHeight

  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.fillStyle = bgColor
  ctx.fillRect(0, boxY, width, boxHeight)
  ctx.restore()

  ctx.fillStyle = textColor
  ctx.font = `${fontSize}px monospace`
  ctx.textBaseline = 'top'

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], padding, boxY + padding + i * lineHeight)
  }
}

function attachListeners(canvasEl: HTMLCanvasElement): () => void {
  function activateAtPosition(clientX: number, clientY: number) {
    if (!sim) return
    const r = cachedRect
    const x = clientX - r.left
    const y = clientY - r.top
    const side = findNearestSide(sim.grid, x, y, r.width, r.height)
    if (side && !side.alive) {
      side.alive = true
      // Give clicked sides 10x life so they dominate
      const life = SURVIVAL_BASE_LIFE * 10
      side.life = life
      side.maxLife = life
      randomizeMovement(side)
      dirty = true
    }
  }

  const onMouseDown = (e: MouseEvent) => {
    isMouseDown = true
    activateAtPosition(e.clientX, e.clientY)
  }
  const onMouseMove = (e: MouseEvent) => {
    if (isMouseDown) activateAtPosition(e.clientX, e.clientY)
  }
  const onMouseUp = () => {
    isMouseDown = false
  }
  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    for (const touch of e.changedTouches) {
      activateAtPosition(touch.clientX, touch.clientY)
    }
  }
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    for (const touch of e.changedTouches) {
      activateAtPosition(touch.clientX, touch.clientY)
    }
  }
  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case ' ':
        e.preventDefault()
        playing = !playing
        if (playing) lastStepTime = 0
        dirty = true
        break
      case 'ArrowRight':
        e.preventDefault()
        if (sim) {
          playing = false
          sim.step()
          dirty = true
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        speed = Math.min(60, speed + 2)
        dirty = true
        break
      case 'ArrowDown':
        e.preventDefault()
        speed = Math.max(1, speed - 2)
        dirty = true
        break
      case 'r':
        sim?.randomize(0.3)
        dirty = true
        break
      case 'c':
        sim?.reset()
        dirty = true
        break
      case 'Tab':
        e.preventDefault()
        ruleIndex = (ruleIndex + 1) % ALL_RULES.length
        if (sim) sim.rules = ALL_RULES[ruleIndex]
        dirty = true
        break
      case '3':
        gridType = 3
        sim = null
        invalidateSpatialHash()
        break
      case '4':
        gridType = 4
        sim = null
        invalidateSpatialHash()
        break
      case '6':
        gridType = 6
        sim = null
        invalidateSpatialHash()
        break
      case 'o':
        gridType = 'circle'
        sim = null
        invalidateSpatialHash()
        break
      case '+':
      case '=':
        if (gridType === 'circle') {
          precision = Math.min(48, precision + 6)
          sim = null
          invalidateSpatialHash()
        }
        break
      case '-':
        if (gridType === 'circle') {
          precision = Math.max(6, precision - 6)
          sim = null
          invalidateSpatialHash()
        }
        break
      case 'd':
        showGrid = !showGrid
        dirty = true
        break
    }
  }

  canvasEl.addEventListener('mousedown', onMouseDown)
  canvasEl.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  canvasEl.addEventListener('touchstart', onTouchStart)
  canvasEl.addEventListener('touchmove', onTouchMove)
  document.body.addEventListener('keydown', onKeyDown)

  return () => {
    canvasEl.removeEventListener('mousedown', onMouseDown)
    canvasEl.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    canvasEl.removeEventListener('touchstart', onTouchStart)
    canvasEl.removeEventListener('touchmove', onTouchMove)
    document.body.removeEventListener('keydown', onKeyDown)
  }
}

export function stop() {
  cleanupListeners?.()
  cleanupListeners = null
  listeningOn = null
  cachedCtx = null
  lastWidth = 0
  lastHeight = 0
  lastDpr = 0
  isMouseDown = false
  dirty = true
}

export function render(ratio: number) {
  if (ratio > 2) return

  const canvasEl = document.getElementById('experiment') as HTMLCanvasElement
  if (!canvasEl) return

  const rect = canvasEl.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const width = rect.width
  const height = rect.height

  const sizeChanged = width !== lastWidth || height !== lastHeight || dpr !== lastDpr
  if (sizeChanged) {
    canvasEl.width = Math.round(width * dpr)
    canvasEl.height = Math.round(height * dpr)
    lastWidth = width
    lastHeight = height
    lastDpr = dpr
    cachedCtx = canvasEl.getContext('2d')
    cachedCtx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    cachedRect = { left: rect.left, top: rect.top, width, height }
    invalidateSpatialHash()
  } else {
    // Bounding rect can shift (scroll) without affecting canvas size.
    cachedRect = { left: rect.left, top: rect.top, width, height }
  }

  const ctx = cachedCtx
  if (!ctx) return

  if (listeningOn !== canvasEl) {
    cleanupListeners?.()
    cleanupListeners = attachListeners(canvasEl)
    listeningOn = canvasEl
  }

  if (!sim || sizeChanged) {
    initSim(width, height)
  }

  // Step simulation if playing
  if (playing && sim) {
    const now = performance.now()
    const interval = 1000 / speed
    if (lastStepTime === 0) {
      lastStepTime = now
    }
    if (now - lastStepTime >= interval) {
      sim.step()
      lastStepTime = now
      dirty = true
    }
  }

  // Skip canvas work if nothing changed since the last frame. The display
  // refresh (often 60/120Hz) is way faster than the sim rate — re-drawing
  // the identical frame was the biggest remaining cost.
  if (!dirty) return

  // Draw
  const bgColor = getColorVariable('bgColor')
  const aliveColor = getColorVariable('accent')
  const deadColor = getColorVariable('textColor')

  const rule = ALL_RULES[ruleIndex]
  const uniformAlive = !rule.stepGrid // Survival uses stepGrid → needs per-side color

  renderGrid(ctx, sim!.grid, width, height, {
    bgColor,
    aliveColor,
    deadColor,
    deadWidth: 0.5,
    aliveWidth: 3,
    showGrid,
    uniformAlive,
  })

  drawHUD(ctx, width, height)
  dirty = false
}
