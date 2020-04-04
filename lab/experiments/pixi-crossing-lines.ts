import * as PIXI from 'pixi.js'
import { getDimensions, canvasEl, Point } from '../utils/screen'
import {
  getColorVariable,
  onColorChange,
  getHexColorVariable,
} from '../utils/colors'
import { createRandomizer, Randomizer } from '../utils/random'
import nanoid from 'nanoid'
import { memoize } from 'lodash-es'

let _context: Context | null = null
let randomizer: Randomizer

export interface Context {
  random: Randomizer
  app: PIXI.Application
}

export function start() {
  if (_context) return _context

  const seed = window.location.hash.slice(1) || nanoid()
  console.log(`🌱using "${seed}" as seed`)
  const random = createRandomizer(seed)
  randomizer = random

  const colors = {
    bg: getHexColorVariable('bgColor'),
    accent: getHexColorVariable('accent'),
    red: getHexColorVariable('red'),
  }

  const drawingColors: Array<keyof typeof colors> = ['red', 'bg', 'bg']

  const size = getDimensions()

  const app = new PIXI.Application({
    view: canvasEl,
    width: size.x,
    height: size.y,
    backgroundColor: colors.bg,
    antialias: true,
    resizeTo: canvasEl,
    resolution: window.devicePixelRatio || 1,
  })

  const diameter = 200
  const lineWidth = diameter * 0.6

  const polygons = createGrid(size.x, size.y, diameter, lineWidth)

  console.log(polygons)

  // draw polygon

  for (let poly of polygons) {
    // const path = poly.points.reduce((points, point) => {
    //   points.push(point.x, point.y)
    //   return points
    // }, [] as number[])

    // let graphics = new PIXI.Graphics()

    // graphics.lineStyle(1, colors.accent, 1)
    // graphics.drawPolygon(path)
    // graphics.closePath()

    // app.stage.addChild(graphics)

    for (let path of poly.paths) {
      drawingColors.forEach((colorName, i) => {
        const bezier = new PIXI.Graphics()
        bezier.lineStyle(lineWidth / Math.pow(2, i), colors[colorName], 1)

        // bezier.moveTo(path[0].x, path[0].y)
        // bezier.lineTo(poly.center.x, poly.center.y)
        // bezier.lineTo(path[1].x, path[1].y)
        // bezier.position.x = 0
        // bezier.position.y = 0

        const [p1, p2] = path
        bezier.position.x = p1.x
        bezier.position.y = p1.y
        bezier.bezierCurveTo(
          poly.center.x - p1.x,
          poly.center.y - p1.y,
          poly.center.x - p1.x,
          poly.center.y - p1.y,
          path[1].x - p1.x,
          path[1].y - p1.y
        )

        app.stage.addChild(bezier)
      })
    }
  }

  _context = {
    random,
    app,
  }

  return _context
}

function createGrid(
  width: number,
  height: number,
  diameter: number,
  lineWidth: number
) {
  const sides = 6
  let radius = diameter / 2
  let center = { x: 0, y: 0 }

  const polygons: Polygon[] = []
  let line = 0
  let i = 0
  console.time('computing')
  while (center.y - radius <= height) {
    i++
    // if (i === 57 || i === 58)
    polygons.push(createPolygon(center, diameter, sides))
    center.x += Math.sqrt(3) * radius
    if (center.x - radius >= width) {
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

  return polygons
}

export const isPixi = true

interface Polygon {
  sides: number
  diameter: number
  center: Point
  points: Point[]
  midpoints: Point[]
  paths: Point[][]
  connectors: Point[]
}

const cos = memoize(Math.cos)
const sin = memoize(Math.sin)

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
