/**
 * Inspired by https://www.youtube.com/watch?v=M64HUIJFTZM
 */

import { debounce, throttle } from 'lodash-es'

import {
  type Point,
  resetCanvasCheck,
  ensureCanvasWithSize,
} from '../utils/screen'
import { getColorVariable } from '../utils/colors'

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

const radius = 10
const PI2 = Math.PI * 2

function drawPoint(ctx: CanvasRenderingContext2D, point: Point): void {
  ctx.beginPath()
  ctx.arc(point.x, point.y, radius, 0, PI2, false)
  ctx.fill()
  // ctx.stroke()
}

interface Context {
  seed: number
  points: Point[]
  current: number
  speed: number
  nextPoint: {
    i: number
    angle: number
    remainingAngle: number
  }
  angle: number
  // delta since last point reset
  angleDelta: number
  lineDemiWidth: number
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
  speed: 1,
  nextPoint: {
    i: 0,
    angle: 0,
    remainingAngle: 0,
  },
  options: {} as Options,
  current: 0,
  angle: 0,
  lineDemiWidth: 100,
  angleDelta: 0,
}

let isListeningForResize = false

function globalClickHandler(event: MouseEvent | TouchEvent | PointerEvent) {
  let mousePoint: Point
  if ('clientX' in event) {
    mousePoint = {
      x: event.clientX,
      y: event.clientY,
    }
  } else {
    mousePoint = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    }
  }

  const collisionPointI = context.points.findIndex((p, i) =>
    isPointInside(mousePoint, p, radius)
  )
  if (collisionPointI < 0) {
    context.points.push(mousePoint)
    // reset nextPoint
    context.nextPoint.i = context.current
    context.nextPoint.angle = context.angle
    setNextPoint(context)
  } else if (collisionPointI !== context.current) {
    context.points.splice(collisionPointI, 1)
    context.current += context.current > collisionPointI ? -1 : 0
    // context.nextPoint.i += context.nextPoint.i > collisionPointI ? -1 : 0
    if (collisionPointI === context.nextPoint.i) {
      // reset nextPoint
      context.nextPoint.i = context.current
      context.nextPoint.angle = context.angle
      setNextPoint(context)
    } else if (context.nextPoint.i > collisionPointI) context.nextPoint.i--
  }
}

function start(seed: number, options: Options) {
  if (context.seed !== seed) {
    resetCanvasCheck()
    context = {
      seed,
      speed: 1,
      points: createSetOfPoints(options.amount, options.width, options.height),
      nextPoint: {
        i: -1,
        angle: 0,
        remainingAngle: 0,
      },
      current: -1,
      angle: 0,
      angleDelta: 0,
      lineDemiWidth: Math.sqrt(options.width ** 2 + options.height ** 2),
      options,
    }
  }

  // FIXME: can be set
  // @ts-expect-error
  window.context = context

  if (!isListeningForResize) {
    isListeningForResize = true
    window.addEventListener(
      'resize',
      debounce(() => {
        start(seed + 1, options)
      }, 500)
    )
    document.body.addEventListener('keydown', ({ key }) => {
      const inc = (+(key === 'ArrowRight') - +(key === 'ArrowLeft')) * 0.15
      // inc will only apply if one of the arrows is pressed
      if (!inc) return
      context.speed = Math.max(0.05, Math.min(context.speed + inc, 10))
      console.log('scrolling', inc, context.speed)
    })
    // remove add points
    const throttledClick = throttle(globalClickHandler, 100)
    if ('PointerEvent' in window)
      document.body.addEventListener('pointerdown', throttledClick)
    else document.body.addEventListener('mousedown', throttledClick)
    // touch devices
    document.body.addEventListener('touchstart', throttledClick)
  }

  return context
}

function isPointInside(point: Point, circle: Point, radius: number): boolean {
  return (point.x - circle.x) ** 2 + (point.y - circle.y) ** 2 < radius ** 2
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
    let minDelta = Number.POSITIVE_INFINITY
    let center = -1
    for (let i = 0; i < context.points.length; i++) {
      // create two groups
      let a = 0,
        b = 0
      for (let j = 0; j < context.points.length; j++) {
        if (i === j) continue
        // this simplification is possible because we are starting with an angle of 0
        if (context.points[j].y < context.points[i].y) a++
        else b++
      }
      const delta = Math.abs(a - b)
      if (delta < minDelta) {
        minDelta = delta
        center = i
        // this one is good as it evenly splits the space
        if (delta < 1) break
      }
    }
    context.current = center
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
  const [canvasEl, size] = ensureCanvasWithSize()

  canvasEl.width = size.x * window.devicePixelRatio
  canvasEl.height = size.y * window.devicePixelRatio

  const ctx = canvasEl.getContext('2d')
  if (!ctx) return // avoid errors if no supporting browser
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const context = start(1, {
    amount: Math.random() * 7 + 15,
    width: size.x,
    height: size.y,
  })

  const angleIncrement = (context.speed * ratio) / 200
  context.angleDelta -= angleIncrement
  if (context.angleDelta < 0) setNextPoint(context)

  context.angle = (context.angle + angleIncrement) % PI2

  const moveTo: Point = {
    x: Math.cos(context.angle) * context.lineDemiWidth,
    y: -Math.sin(context.angle) * context.lineDemiWidth,
  }

  const point = context.points[context.current]

  // clear
  ctx.fillStyle = getColorVariable('bgColor')
  ctx.fillRect(0, 0, size.x, size.y)

  // draw all points except current one
  const circleGradient = ctx.createLinearGradient(
    0,
    0,
    context.options.width,
    0
  )
  circleGradient.addColorStop(0, getColorVariable('primary'))
  circleGradient.addColorStop(1, getColorVariable('secondary'))
  ctx.fillStyle = circleGradient
  for (const p of context.points) {
    if (p === point) continue
    ctx.fillStyle = circleGradient
    drawPoint(ctx, p)
    // ctx.font = '20px Georgia'
    // ctx.fillText('' + context.points.indexOf(p), p.x, p.y)
  }

  // draw line
  ctx.lineWidth = 4

  const from: Point = {
    x: point.x - moveTo.x,
    y: point.y - moveTo.y,
  }
  const to: Point = {
    x: point.x + moveTo.x,
    y: point.y + moveTo.y,
  }
  const lineGradient = ctx.createLinearGradient(
    Math.max(0, Math.min(from.x, size.x)),
    Math.max(0, Math.min(from.y, size.y)),
    Math.max(0, Math.min(to.x, size.x)),
    Math.max(0, Math.min(to.y, size.y))
  )
  lineGradient.addColorStop(0, 'red')
  lineGradient.addColorStop(1, 'blue')
  ctx.strokeStyle = lineGradient
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  // ctx.lineTo(center.x + 100, center.y + Math.sin(context.angle) * center.y)
  ctx.stroke()

  // draw current point
  ctx.fillStyle = getColorVariable('textColor')
  drawPoint(ctx, point)
}
