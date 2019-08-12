/**
 * Insipired by https://www.youtube.com/watch?v=M64HUIJFTZM
 */

const canvasEl: HTMLCanvasElement = document.getElementById(
  'experiment'
) as HTMLCanvasElement
const size = getDimensions()
canvasEl.setAttribute('width', '' + size.x)
canvasEl.setAttribute('height', '' + size.x)

function getBackgroundColor(): string {
  const { backgroundColor } = window.getComputedStyle(canvasEl)
  return backgroundColor || '#121314'
}

function getColor(): string {
  const { color } = window.getComputedStyle(canvasEl)
  return color || '#efeeed'
}

function getDimensions(): { x: number; y: number } {
  const { width, height } = canvasEl
  return { x: width, y: height }
}

interface Point {
  x: number
  y: number
}

/**
 *
 * @param n amount of points to generate
 * @param w maximum width
 * @param h maximum height
 */
function createSetOfPoints(n: number, w: number, h: number): Point[] {
  const points: Point[] = []
  for (let i = 0; i < n; i++) {
    const point = {
      x: Math.random() * w,
      y: Math.random() * h,
    }

    // TODO: check non covariance

    points.push(point)
  }

  return points
}

const radius = 3
const PI2 = Math.PI * 2

function drawPoint(ctx: CanvasRenderingContext2D, point: Point): void {
  ctx.beginPath()
  ctx.arc(point.x, point.y, radius, 0, PI2, false)
  ctx.fill()
  ctx.stroke()
}

interface Context {
  seed: number
  points: Point[]
  current: number
  angle: number
  options: Options
}

interface Options {
  amount: number
  width: number
  height: number
}
let context: Context = {
  seed: -1,
  points: [],
  options: {} as Options,
  current: 0,
  angle: 0,
}
function start(seed: number, options: Options) {
  if (context.seed !== seed) {
    context = {
      seed,
      points: createSetOfPoints(options.amount, options.width, options.height),
      current: Math.floor(Math.random() * options.amount),
      angle: Math.random() * PI2,
      options,
    }
  }

  return context
}

export function render(ratio: number) {
  const size = getDimensions()
  canvasEl.setAttribute('width', '' + size.x)
  canvasEl.setAttribute('height', '' + size.x)
  canvasEl.width = size.x * window.devicePixelRatio
  canvasEl.height = size.y * window.devicePixelRatio
  const ctx = canvasEl.getContext('2d')
  if (!ctx) return // avoid errors if no supporting browser
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const context = start(1, { amount: 10, width: size.x, height: size.y })

  // console.log(elapsed)
  context.angle = (context.angle + ratio / 50) % PI2

  const DISTANCE = 10000
  const moveTo: Point = {
    x: Math.cos(context.angle) * DISTANCE,
    y: Math.sin(context.angle) * DISTANCE,
  }

  const point = context.points[context.current]

  const center = { x: size.x / 2, y: size.y / 2 }
  ctx.fillStyle = getBackgroundColor()
  ctx.fillRect(0, 0, size.x, size.y)

  ctx.strokeStyle = 'crimson'
  ctx.fillStyle = 'crimson'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(point.x - moveTo.x, point.y - moveTo.y)
  ctx.lineTo(point.x + moveTo.x, point.y + moveTo.y)
  // ctx.lineTo(center.x + 100, center.y + Math.sin(context.angle) * center.y)
  ctx.stroke()

  ctx.fillStyle = 'crimson'
  ctx.strokeStyle = getColor()
  ctx.lineWidth = 0.5
  for (const p of context.points) {
    if (p === point) ctx.fillStyle = 'khaki'
    else ctx.fillStyle = 'crimson'
    drawPoint(ctx, p)
  }
}
