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
  nextPoint: {
    i: number
    angle: number
    remainingAngle: number
  }
  angle: number
  // delta since last point reset
  angleDelta: number
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
  nextPoint: {
    i: 0,
    angle: 0,
    remainingAngle: 0,
  },
  options: {} as Options,
  current: 0,
  angle: 0,
  angleDelta: 0,
}

function start(seed: number, options: Options) {
  if (context.seed !== seed) {
    context = {
      seed,
      points: createSetOfPoints(options.amount, options.width, options.height),
      nextPoint: {
        i: -1,
        angle: 0,
        remainingAngle: 0,
      },
      current: -1,
      angle: 0,
      angleDelta: 0,
      options,
    }
  }

  // @ts-ignore
  window.context = context

  return context
}

/**
 * Returns the angle difference in radians [0, 2Pi]
 * @param a first point
 * @param b second point
 */
function angleBetweenPoints(a: Point, b: Point): number {
  const angle = Math.atan2(a.y - b.y, b.x - a.x)
  if (angle >= 0) return angle
  return angle + PI2
}

function setNextPoint(context: Context) {
  let lastPoint: number | null = null
  if (context.current < 0) {
    // find initial point
    context.current = 1
    context.angle = 0
  } else {
    lastPoint = context.current
    context.current = context.nextPoint.i
    context.angle = context.nextPoint.angle
  }
  let point = context.points[context.current]

  let smallestPoint = {
    i: -1,
    angle: 0,
    remainingAngle: Number.POSITIVE_INFINITY,
  }

  for (let i = 0; i < context.points.length; i++) {
    if (i === context.current || i === lastPoint) continue
    let angle = angleBetweenPoints(point, context.points[i])
    // the line is turning, so the intersection can happen at tho different spots
    const dir1 = context.angle
    const dir2 = (context.angle + Math.PI) % PI2

    const delta1 = (angle - dir1 + PI2) % PI2
    const delta2 = (angle - dir2 + PI2) % PI2

    let remainingAngle = Math.min(delta1, delta2)
    if (remainingAngle < smallestPoint.remainingAngle) {
      smallestPoint.i = i
      smallestPoint.angle = (context.angle + remainingAngle) % PI2
      smallestPoint.remainingAngle = remainingAngle
    }
  }

  context.nextPoint = smallestPoint
  context.angleDelta = context.nextPoint.remainingAngle
}

export function render(ratio: number) {
  // skip if too fast
  if (ratio > 2) return
  const size = getDimensions()
  canvasEl.setAttribute('width', '' + size.x)
  canvasEl.setAttribute('height', '' + size.x)
  canvasEl.width = size.x * window.devicePixelRatio
  canvasEl.height = size.y * window.devicePixelRatio
  const ctx = canvasEl.getContext('2d')
  if (!ctx) return // avoid errors if no supporting browser
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const context = start(1, { amount: 10, width: size.x, height: size.y })
  // context.points = [
  //   {
  //     x: 273.1264047366357,
  //     y: 40.53436314001162,
  //   },
  //   {
  //     x: 139.06916638441857,
  //     y: 50.69419734248379,
  //   },
  //   {
  //     x: 164.99958575741297,
  //     y: 267.8015206521626,
  //   },
  //   {
  //     x: 199.5673927514191,
  //     y: 2.446256884441622,
  //   },
  // ]

  const angleIncrement = ratio / 50
  context.angleDelta -= angleIncrement
  // if (context.current < 0 || context.nextPoint.angle <= context.angle)
  if (context.angleDelta < 0) setNextPoint(context)

  // console.log(elapsed)
  context.angle = (context.angle + angleIncrement) % PI2

  const DISTANCE = 500
  const moveTo: Point = {
    x: Math.cos(context.angle) * DISTANCE,
    y: -Math.sin(context.angle) * DISTANCE,
  }

  const point = context.points[context.current]

  const center = { x: size.x / 2, y: size.y / 2 }
  ctx.fillStyle = getBackgroundColor()
  ctx.fillRect(0, 0, size.x, size.y)

  ctx.fillStyle = 'crimson'
  ctx.lineWidth = 1

  const from: Point = {
    x: point.x - moveTo.x,
    y: point.y - moveTo.y,
  }
  const to: Point = {
    x: point.x + moveTo.x,
    y: point.y + moveTo.y,
  }
  const lineGradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
  lineGradient.addColorStop(0, 'red')
  lineGradient.addColorStop(1, 'blue')
  ctx.strokeStyle = lineGradient
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  // ctx.lineTo(center.x + 100, center.y + Math.sin(context.angle) * center.y)
  ctx.stroke()

  ctx.fillStyle = 'crimson'
  ctx.strokeStyle = getColor()
  ctx.lineWidth = 0.5
  for (const p of context.points) {
    if (p === point) ctx.fillStyle = 'khaki'
    else ctx.fillStyle = 'crimson'
    drawPoint(ctx, p)
    ctx.font = '20px Georgia'
    ctx.fillText('' + context.points.indexOf(p), p.x, p.y)
  }
}
