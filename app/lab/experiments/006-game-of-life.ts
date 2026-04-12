import { getColorVariable } from '../utils/colors'
import { Simulation } from '../006-game-of-life/simulation'
import { renderGrid, findNearestSide } from '../006-game-of-life/renderer'
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
let isMouseDown = false
let showGrid = true

const GRID_LABELS: Record<string, string> = { 3: '△', 4: '□', 6: '⬡', circle: '○' }

function initSim(width: number, height: number) {
  const cellSize = gridType === 'circle' ? 40 : 25
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
  lastStepTime = 0
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
    const r = canvasEl.getBoundingClientRect()
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
        break
      case 'ArrowRight':
        e.preventDefault()
        if (sim) {
          playing = false
          sim.step()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        speed = Math.min(60, speed + 2)
        break
      case 'ArrowDown':
        e.preventDefault()
        speed = Math.max(1, speed - 2)
        break
      case 'r':
        sim?.randomize(0.3)
        break
      case 'c':
        sim?.reset()
        break
      case 'Tab':
        e.preventDefault()
        ruleIndex = (ruleIndex + 1) % ALL_RULES.length
        if (sim) sim.rules = ALL_RULES[ruleIndex]
        break
      case '3':
        gridType = 3
        sim = null
        break
      case '4':
        gridType = 4
        sim = null
        break
      case '6':
        gridType = 6
        sim = null
        break
      case 'o':
        gridType = 'circle'
        sim = null
        break
      case '+':
      case '=':
        if (gridType === 'circle') {
          precision = Math.min(48, precision + 6)
          sim = null
        }
        break
      case '-':
        if (gridType === 'circle') {
          precision = Math.max(6, precision - 6)
          sim = null
        }
        break
      case 'd':
        showGrid = !showGrid
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
  isMouseDown = false
}

export function render(ratio: number) {
  if (ratio > 2) return

  const canvasEl = document.getElementById('experiment') as HTMLCanvasElement
  if (!canvasEl) return

  const rect = canvasEl.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const width = rect.width
  const height = rect.height
  canvasEl.width = width * dpr
  canvasEl.height = height * dpr

  const ctx = canvasEl.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  if (listeningOn !== canvasEl) {
    cleanupListeners?.()
    cleanupListeners = attachListeners(canvasEl)
    listeningOn = canvasEl
  }

  // Detect size change → rebuild simulation
  if (!sim || width !== lastWidth || height !== lastHeight) {
    lastWidth = width
    lastHeight = height
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
    }
  }

  // Draw
  const bgColor = getColorVariable('bgColor')
  const aliveColor = getColorVariable('accent')
  const deadColor = getColorVariable('textColor')

  renderGrid(ctx, sim!.grid, width, height, {
    bgColor,
    aliveColor,
    deadColor,
    deadWidth: 0.5,
    aliveWidth: 3,
    showGrid,
  })

  drawHUD(ctx, width, height)
}
