import nanoid from 'nanoid'
import {
  getDimensions,
  canvasEl,
  resetCanvasCheck,
  Point,
} from '../utils/screen'
import { getColorVariable, onColorChange } from '../utils/colors'
import { addTapListener } from '../utils/events'
import { createRandomizer, Randomizer } from '../utils/random'
import { memoize, size } from 'lodash-es'

let isListening = false

let _context: Context | null = null
let randomizer: Randomizer

export interface Context {
  ctx: CanvasRenderingContext2D
  size: Point
  random: Randomizer
}

function getContext(): Context | null {
  if (_context) return _context

  const seed = window.location.hash.slice(1) || nanoid()
  console.log(`🌱using "${seed}" as seed`)
  const random = createRandomizer(seed)
  randomizer = random

  const size = getDimensions()
  canvasEl.width = size.x * window.devicePixelRatio
  canvasEl.height = size.y * window.devicePixelRatio
  const ctx = canvasEl.getContext('2d')!
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  _context = {
    random,
    size,
    ctx,
  }

  return _context
}

let done = false

export function render(ratio: number) {
  if (ratio > 2) return

  const context = getContext()
  if (!context || done) return
  done = true

  const { ctx } = context

  const diameter = 50
  const lineWidth = diameter * 0.6
  const sides = 6
  let radius = diameter / 2
  let center = { x: 0, y: 0 }

  const polygons: Polygon[] = []
  let line = 0
  let i = 0
  console.time('computing')
  while (center.y - radius <= context.size.y) {
    i++
    // if (i === 57 || i === 58)
    polygons.push(createPolygon(center, diameter, sides))
    center.x += Math.sqrt(3) * radius
    if (center.x - radius >= context.size.x) {
      if (line % 2) {
        center.x = 0
      } else {
        center.x = (-Math.sqrt(3) * radius) / 2
      }
      line++
      center.y += (diameter * 3) / 4
    }
  }
  console.timeEnd('computing')

  ctx.lineCap = 'butt'
  // ctx.lineJoin = 'round'
  // for (let poly of polygons) {
  //   ctx.strokeStyle = getColorVariable('color')
  //   ctx.lineWidth = 1
  //   drawPolygon(ctx, poly.points)
  // }

  // const colors = ['bgColor', 'bgColor', 'secondary']
  // const colors = ['secondary', 'bgColor', 'secondary']
  const colors = ['red', 'bgColor', 'bgColor']

  console.time('rendering')
  for (let poly of polygons) {
    // ctx.strokeStyle = getColorVariable('color')
    // ctx.lineWidth = 1
    // drawPolygon(ctx, poly.points)

    for (let path of poly.paths) {
      colors.forEach((color, i) => {
        ctx.strokeStyle = getColorVariable(color)
        ctx.lineWidth = lineWidth / Math.pow(2, i)
        drawPath(ctx, poly.center, path)
      })
    }
  }

  for (let poly of polygons) {
    for (let i = 0; i < poly.midpoints.length; i++) {
      const midpoint = poly.midpoints[i]
      const connector = poly.connectors[i]

      colors.forEach((color, i) => {
        ctx.strokeStyle = getColorVariable(color)
        ctx.lineWidth = lineWidth / Math.pow(2, i)
        drawConnector(ctx, midpoint, connector, Math.pow(2, i) / 2)
      })
    }
  }
  console.timeEnd('rendering')
}

interface Polygon {
  sides: number
  diameter: number
  center: Point
  points: Point[]
  midpoints: Point[]
  paths: Point[][]
  connectors: Point[]
}

// pointy topped hexagons
// https;//www.redblobgames.com/grids/hexagons/
const startAngle = (-Math.PI * 30) / 180

function createPolygon(
  center: Point,
  diameter: number,
  sides: number
): Polygon {
  if (sides % 2 !== 0) throw new Error('Must have a even number of sides')
  let radius = diameter / 2
  const points: Point[] = [
    {
      x: center.x + radius * cos(startAngle),
      y: center.y + radius * sin(startAngle),
    },
  ]
  const midpoints: Point[] = []
  const paths: Point[][] = []
  const connectors: Point[] = []

  let p1 = points[0]
  // to prevent error down there
  let p2 = p1
  for (let i = 1; i <= sides; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / sides
    points.push({
      x: center.x + radius * cos(angle),
      y: center.y + radius * sin(angle),
    })
    p2 = points[i]

    let m = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }
    midpoints.push(m)
    connectors.push({
      x: cos(angle + startAngle),
      y: sin(angle + startAngle),
    })
    p1 = p2
  }

  let used = new Map<number, boolean>()
  let i = -1
  while (used.size < sides) {
    while (i < 0 || used.has(i)) {
      i = Math.abs(randomizer.int32()) % sides
    }
    let j = Math.abs(randomizer.int32()) % sides
    if (i === j || used.has(j)) continue
    paths.push([midpoints[i], midpoints[j]])
    used.set(j, true)
    used.set(i, true)
    i = -1
  }

  return {
    points,
    midpoints,
    sides,
    paths,
    diameter,
    center: { ...center },
    connectors,
  }
}

const cos = memoize(Math.cos)
const sin = memoize(Math.sin)

function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath()

  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  ctx.stroke()
  ctx.closePath()
}

function drawConnector(
  ctx: CanvasRenderingContext2D,
  p: Point,
  offset: Point,
  thickness: number
) {
  ctx.beginPath()
  ctx.moveTo(p.x - thickness * offset.x, p.y - thickness * offset.y)
  ctx.lineTo(p.x + thickness * offset.x, p.y + thickness * offset.y)
  ctx.stroke()
  ctx.closePath()
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  center: Point,
  [p1, p2]: Point[]
) {
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  // ctx.lineTo(center.x, center.y)
  // ctx.lineTo(p2.x, p2.y)
  ctx.bezierCurveTo(center.x, center.y, center.x, center.y, p2.x, p2.y)
  ctx.stroke()
  ctx.closePath()
}
