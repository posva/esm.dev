import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
  Texture,
} from 'pixi.js'
import { ease, Ease, Easing } from '../../pixi-ease'
import {
  type Point,
  resetCanvasCheck,
  ensureCanvasWithSize,
} from '../utils/screen'
import {
  getColorVariable,
  onColorChange,
  getHexColorVariable,
} from '../utils/colors'
import { createRandomizer, type Randomizer } from '../utils/random'
import { nanoid } from 'nanoid'
import { memoize, debounce } from 'lodash-es'

let _context: Context | null = null
let randomizer: Randomizer
let seed = ''

const PRECISION = 3
const toFixed = (n: number) => Number(n.toFixed(PRECISION))

export interface Context {
  app: Application
}

let isListening = false

async function restart() {
  if (_context) {
    _context.app.destroy(false, true)
    _context = null
  }
  resetCanvasCheck()
  start()
}

export async function start() {
  if (_context) return _context

  if (!isListening) {
    isListening = true
    window.addEventListener('resize', debounce(restart, 800))

    onColorChange(restart)
  }

  const [canvasEl, size] = ensureCanvasWithSize()

  seed = seed || window.location.hash.slice(1) || nanoid()
  console.log(`🌱using "${seed}" as seed, with size ${size.x}x${size.y}`)
  randomizer = createRandomizer(seed)

  const colors = {
    bg: getHexColorVariable('bgColor'),
    accent: getHexColorVariable('accent'),
    red: getHexColorVariable('red'),
  }

  const drawingColorNames: Array<keyof typeof colors> = ['red', 'bg', 'bg']

  const app = new Application()

  await app.init({
    canvas: canvasEl,
    width: size.x,
    height: size.y,
    backgroundColor: colors.bg,
    antialias: true,
    resizeTo: canvasEl,
    resolution: window.devicePixelRatio || 1,
  })

  const diameter = Math.max(50, Math.min(size.x, size.y) / 20)
  const lineWidth = diameter * 0.6

  const polygons = createGrid(
    size.x,
    size.y,
    diameter,
    lineWidth,
    drawingColorNames.map((name) => colors[name])
  )

  for (let polygon of polygons) {
    // polygon.sprite.interactive = true
    polygon.sprite.eventMode = 'auto'
    app.renderer.render({
      container: polygon.container,
      target: polygon.sprite.texture as RenderTexture,
    })
    polygon.sprite.on('pointerdown', () => {
      rotatePolygon(polygon)
    })

    app.stage.addChild(polygon.sprite)
  }

  function rotatePolygon(
    polygon: Polygon,
    options?: Parameters<Ease['add']>[2]
  ) {
    if (!polygon.easing) {
      polygon.easing = ease.add(
        polygon.sprite,
        { angle: polygon.sprite.angle + (1 + (randomizer.int32() % 5)) * 60 },
        { duration: 500, ease: 'easeOutQuad', ...options }
      )
      polygon.easing.once('complete', () => {
        polygon.easing = null
      })
    }
  }

  let elapsed = 300

  app.ticker.add(({ deltaTime: delta }) => {
    elapsed += delta

    if (elapsed > 400) {
      const length = Math.round(polygons.length / 4)
      Array.from<number>({ length })
        .fill(0)
        .map(() => Math.abs(randomizer.int32()) % polygons.length)
        .sort((a, b) => a - b)
        .forEach((i, j) => {
          rotatePolygon(polygons[i], { wait: (j * 800) / length })
        })
      elapsed = 0
    }
  })

  _context = {
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
  let radius = toFixed(diameter / 2)
  let center = { x: 0, y: 0 }

  const basePolygon = createPolygon({ x: radius, y: radius }, diameter, sides)

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

    // }

    center.x += Math.sqrt(3) * radius
    if (center.x - radius >= width) {
      if (line % 2) {
        center.x = 0
      } else {
        center.x = toFixed((-Math.sqrt(3) * radius) / 2)
      }
      line++
      center.y += toFixed((diameter * 3) / 4)
    }
  }
  console.timeEnd('computing')

  return sprites
}

export const isPixi = true

interface PolygonShape {
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
): PolygonShape {
  if (sides % 2 !== 0) throw new Error('Must have a even number of sides')
  let radius = toFixed(diameter / 2)
  const points: Point[] = [
    {
      x: toFixed(center.x + radius * cos(startAngle)),
      y: toFixed(center.y + radius * sin(startAngle)),
    },
  ]
  const midpoints: Point[] = []

  let p1 = points[0]
  // to prevent error down there
  let p2 = p1
  for (let i = 1; i <= sides; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / sides
    points.push({
      x: toFixed(center.x + radius * cos(angle)),
      y: toFixed(center.y + radius * sin(angle)),
    })
    p2 = points[i]

    let m = {
      x: toFixed((p1.x + p2.x) / 2),
      y: toFixed((p1.y + p2.y) / 2),
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

interface Polygon {
  sprite: Sprite
  container: Container

  easing: Easing | null
}

// TODO: this creates an image with wholes. Instead try creating just one texture that is used as a map. This map could be generated with a for loop to generate all possible values and avoid duplicates (rotation). Still need to figure out a way to know if two images are the same with a rotation
// const textureCache = new Map<string, RenderTexture>()

// TODO: drawing options refactored
function createSpriteFromPaths(
  polygon: PolygonShape,
  paths: Point[][],
  lineWidth: number,
  drawingColors: number[]
): Polygon {
  const container = new Container()

  // const path = polygon.points.reduce((points, point) => {
  //   points.push(point.x, point.y)
  //   return points
  // }, [] as number[])

  // let graphics = new Graphics()

  // graphics.lineStyle(2, drawingColors[0], 1)
  // graphics.drawPolygon(path)
  // graphics.closePath()

  // container.addChild(graphics)

  let texture: Texture | undefined

  // const key = paths
  //   .map((p) => p.map(({ x, y }) => `${x},${y}`).join(','))
  //   .join(' ')
  // texture = textureCache.get(key)

  if (!texture) {
    // console.log(`Cache miss (${textureCache.size})`)
    // console.log(`Position: ${polygon.center.x},${polygon.center.y} with ${key}`)
    for (let path of paths) {
      drawingColors.forEach((color, i) => {
        const bezier = new Graphics()

        const [p1, p2] = path
        bezier.position.x = p1.x
        bezier.position.y = p1.y
        bezier.bezierCurveTo(
          // center should always be the same, diameter / 2
          polygon.center.x - p1.x,
          polygon.center.y - p1.y,
          polygon.center.x - p1.x,
          polygon.center.y - p1.y,
          p2.x - p1.x,
          p2.y - p1.y
        )
        bezier.stroke({ width: lineWidth / Math.pow(2, i), color, alpha: 1 })

        container.addChild(bezier)
      })
    }

    const brt = RenderTexture.create({
      width: polygon.diameter,
      height: polygon.diameter,
      scaleMode: 'linear',
      // 2 makes it look much better
      resolution: 2,
    })

    texture = brt
    // textureCache.set(key, texture)
    // console.log(`Saved cache (${textureCache.size})`)
  }

  const sprite = new Sprite(texture)

  sprite.anchor.set(0.5)
  container.pivot.set(0.5)

  return { sprite, container, easing: null }
}
