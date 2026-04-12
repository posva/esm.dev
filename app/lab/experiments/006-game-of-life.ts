import { getColorVariable } from '../utils/colors'
import { Simulation } from '../006-game-of-life/simulation'
import { renderGrid } from '../006-game-of-life/renderer'
import { ALL_RULES } from '../006-game-of-life/rules'
import type { PolygonType } from '../006-game-of-life/grid'

let sim: Simulation | null = null
let playing = false
let speed = 10 // steps per second
let polygonType: PolygonType = 4
let ruleIndex = 0
let lastStepTime = 0
let isListening = false
let lastWidth = 0
let lastHeight = 0

const POLYGON_LABELS: Record<PolygonType, string> = { 3: '△', 4: '□', 6: '⬡' }

function initSim(width: number, height: number) {
  // Scale grid size to canvas
  const cellSize = 25
  const rows = Math.max(3, Math.floor(height / cellSize))
  const cols = Math.max(3, Math.floor(width / cellSize))

  sim = new Simulation(polygonType, rows, cols, ALL_RULES[ruleIndex])
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

  // Info lines
  const lines = [
    `${POLYGON_LABELS[polygonType]} ${polygonType}-gon  |  ${ALL_RULES[ruleIndex].name}  |  Gen ${sim.generation}  |  ${playing ? '▶' : '⏸'} ${speed}fps`,
    `[3/4/6] shape  [space] play  [→] step  [↑↓] speed  [r] random  [c] clear  [tab] rule`,
  ]

  const boxHeight = lines.length * lineHeight + padding * 2
  const boxY = height - boxHeight

  // Semi-transparent background bar
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

export function render(ratio: number) {
  if (ratio > 2) return

  const canvasEl = document.getElementById('experiment') as HTMLCanvasElement
  if (!canvasEl) return

  const rect = canvasEl.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvasEl.width = rect.width * dpr
  canvasEl.height = rect.height * dpr

  const ctx = canvasEl.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  if (!isListening) {
    isListening = true

    document.body.addEventListener('keydown', (e) => {
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
          polygonType = 3
          sim = null
          break
        case '4':
          polygonType = 4
          sim = null
          break
        case '6':
          polygonType = 6
          sim = null
          break
      }
    })
  }

  // Detect size change → rebuild simulation
  if (!sim || rect.width !== lastWidth || rect.height !== lastHeight) {
    lastWidth = rect.width
    lastHeight = rect.height
    initSim(rect.width, rect.height)
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

  renderGrid(ctx, sim!.grid, rect.width, rect.height, {
    bgColor,
    aliveColor,
    deadColor,
    deadWidth: 0.5,
    aliveWidth: 3,
  })

  drawHUD(ctx, rect.width, rect.height)
}
