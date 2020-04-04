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

  const drawingColorNames: Array<keyof typeof colors> = ['red', 'bg', 'bg']

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

  const sprites = createGrid(
    size.x,
    size.y,
    diameter,
    lineWidth,
    drawingColorNames.map((name) => colors[name])
  )

  for (let { sprite, container, texture } of sprites) {
    app.renderer.render(container, texture)

    sprite.interactive = true
    sprite.on('pointerdown', () => {
      sprite.angle += 60
    })

    app.stage.addChild(sprite)
  }

  let elapsed = 0

  app.ticker.add((delta: number) => {
    elapsed += delta

    if (elapsed > 100) {
      sprites[Math.round(sprites.length / 2)].sprite.angle += 60
      console.log('tick')
      elapsed = 0
    }
  })

  _context = {
    random,
    app,
  }

  return app
}

function createGrid(
  width: number,
  height: number,
  diameter: number,
  lineWidth: number,
  drawingColors: number[]
) {
  const sides = 6
  let radius = diameter / 2
  let center = { x: 0, y: 0 }

  const basePolygon = createPolygon({ x: radius, y: radius }, diameter, sides)

  const polygons: Polygon[] = []
  const sprites: Array<ReturnType<typeof createSpriteFromPaths>> = []
  let line = 0
  let i = 0
  console.time('computing')
  while (center.y - radius <= height) {
    i++
    // if (i === 57 || i === 58) {
    const paths = createPolygonPaths(basePolygon.midpoints, sides)
    const sprite = createSpriteFromPaths(
      basePolygon,
      paths,
      lineWidth,
      drawingColors
    )
    sprites.push(sprite)

    sprite.sprite.position.x = center.x
    sprite.sprite.position.y = center.y

    // TODO: set sprite position and stuff
    // }

    // polygons.push(createPolygon(center, diameter, sides))
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

  return sprites
}

export const isPixi = true

interface Polygon {
  sides: number
  diameter: number
  center: Point
  points: Point[]
  midpoints: Point[]
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
    p1 = p2
  }

  return {
    points,
    midpoints,
    sides,
    diameter,
    center: { ...center },
  }
}

function createPolygonPaths(midpoints: Point[], sides: number) {
  const paths: Point[][] = []

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

  return paths
}

// TODO: drawing options refactored
function createSpriteFromPaths(
  polygon: Polygon,
  paths: Point[][],
  lineWidth: number,
  drawingColors: number[]
) {
  const container = new PIXI.Container()

  // const path = polygon.points.reduce((points, point) => {
  //   points.push(point.x, point.y)
  //   return points
  // }, [] as number[])

  // let graphics = new PIXI.Graphics()

  // graphics.lineStyle(2, drawingColors[0], 1)
  // graphics.drawPolygon(path)
  // graphics.closePath()

  // container.addChild(graphics)

  for (let path of paths) {
    drawingColors.forEach((color, i) => {
      const bezier = new PIXI.Graphics()
      bezier.lineStyle(lineWidth / Math.pow(2, i), color, 1)

      const [p1, p2] = path
      bezier.position.x = p1.x
      bezier.position.y = p1.y
      bezier.bezierCurveTo(
        polygon.center.x - p1.x,
        polygon.center.y - p1.y,
        polygon.center.x - p1.x,
        polygon.center.y - p1.y,
        p2.x - p1.x,
        p2.y - p1.y
      )

      container.addChild(bezier)
    })
  }

  const brt = new PIXI.BaseRenderTexture({
    width: polygon.diameter,
    height: polygon.diameter,
    scaleMode: PIXI.SCALE_MODES.LINEAR,
    // TODO: 2 makes it look better
    resolution: 2,
  })

  const texture = new PIXI.RenderTexture(brt)
  const sprite = new PIXI.Sprite(texture)

  sprite.anchor.set(0.5)
  container.pivot.set(0.5)

  return { sprite, container, texture }
}
