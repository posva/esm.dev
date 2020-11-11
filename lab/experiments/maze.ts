import { debounce } from 'lodash-es'
import { nanoid } from 'nanoid'
import {
  getDimensions,
  canvasEl,
  Point,
  isSamePoint,
  resetCanvasCheck,
} from '../utils/screen'
import { getColorVariable, onColorChange } from '../utils/colors'
import { createRandomizer, Randomizer } from '../utils/random'

const enum WallType {
  vertical,
  horizontal,
  none,
}

interface MazeNodeLeaf {
  wall: WallType.none
  x: number
  y: number
  // a leaf has at least one of their sizes === 1
  // doing two types is not worth as it doesn't bring any type safety and ts is not able
  // to infer types
  width: number
  height: number
}

interface MazeNode {
  wall: Exclude<WallType, WallType.none>
  // absolute coordinates of the box represented by the node
  x: number
  y: number
  width: number
  height: number
  wallOffset: number // >= 0
  doorOffset: number
  left: MazeNode | MazeNodeLeaf
  right: MazeNode | MazeNodeLeaf
}

/**
 * Creates a vertical or horizontal wall on the larger side
 * @param width > 1
 * @param height > 1
 * @param start start of the labyrinth, must be on the left side and only one value (x or y) can be different from zero
 * @param end start of the labyrinth, must be on the right side and only one value (x or y) can be different from the width or height
 */
function createWall(
  x: number,
  y: number,
  width: number,
  height: number
): MazeNode | MazeNodeLeaf {
  if (width === 1 || height === 1) {
    return {
      x,
      y,
      width,
      height,
      wall: WallType.none,
    }
  }

  // split vertically or horizontally depending on which side is bigger
  const biggest = Math.max(width, height)
  const smallest = biggest === width ? height : width
  const wall = biggest === width ? WallType.vertical : WallType.horizontal

  const wallOffset = Math.floor(randomizer.double() * (biggest - 1)) + 1
  const doorOffset = Math.floor(randomizer.double() * smallest)

  const left = createWall(
    x,
    y,
    wall === WallType.vertical ? wallOffset : width,
    wall === WallType.vertical ? height : wallOffset
  )
  const right = createWall(
    x + (wall === WallType.vertical ? wallOffset : 0),
    y + (wall === WallType.vertical ? 0 : wallOffset),
    wall === WallType.vertical ? width - wallOffset : width,
    wall === WallType.vertical ? height : height - wallOffset
  )

  return {
    x,
    y,
    wall,
    width,
    height,
    wallOffset,
    doorOffset,
    left,
    right,
  }
}

/**
 * Generate a maze as a binary tree
 * @param width > 2
 * @param height > 2
 */
export function generateMaze(width: number, height: number): MazeNode {
  return createWall(0, 0, width, height) as MazeNode
}

function dividePath(
  maze: MazeNode | MazeNodeLeaf,
  start: Point,
  end: Point
): Point[] {
  if (isSamePoint(start, end)) return [{ ...start }]
  if (maze.wall === WallType.none) return [{ ...start }, { ...end }]

  const isVertical = maze.wall === WallType.vertical

  const doorRight: Point = {
    x: maze.right.x + (isVertical ? 0 : maze.doorOffset),
    y: maze.right.y + (!isVertical ? 0 : maze.doorOffset),
  }

  const shouldComputeRight = !isVertical
    ? start.y >= doorRight.y || end.y >= doorRight.y
    : start.x >= doorRight.x || end.x >= doorRight.x

  // we can skip the other side
  if (!shouldComputeRight) return dividePath(maze.left, start, end)

  const doorLeft: Point = {
    x: doorRight.x - (isVertical ? 1 : 0),
    y: doorRight.y - (!isVertical ? 1 : 0),
  }

  const shouldComputeLeft = !isVertical
    ? start.y <= doorLeft.y || end.y <= doorLeft.y
    : start.x <= doorLeft.x || end.x <= doorLeft.x

  // same as above
  if (!shouldComputeLeft) return dividePath(maze.right, start, end)

  let startPath: Point[] = []
  let endPath: Point[] = []

  // we must compute both, it's a matter of passing down the right start and end points
  if (isVertical) {
    // the end must be of the other side
    if (start.x <= doorLeft.x) {
      startPath = dividePath(maze.left, start, doorLeft)
      endPath = dividePath(maze.right, doorRight, end)
    } else {
      startPath = dividePath(maze.right, start, doorRight)
      endPath = dividePath(maze.left, doorLeft, end)
    }
  } else {
    if (start.y <= doorLeft.y) {
      startPath = dividePath(maze.left, start, doorLeft)
      endPath = dividePath(maze.right, doorRight, end)
    } else {
      startPath = dividePath(maze.right, start, doorRight)
      endPath = dividePath(maze.left, doorLeft, end)
    }
  }

  return startPath.concat(endPath)
}

export function solveMaze(maze: MazeNode, start: Point, end: Point): Point[] {
  return dividePath(maze, start, end)
}

export function simplifyPath(points: Point[]): Point[] {
  // beginning of a path
  let initialPoint: Point = points[0]
  // current point
  let point: Point = points[1]
  // last point that was checked
  let lastPoint = point
  let direction: 'x' | 'y' = initialPoint.x === point.x ? 'x' : 'y'
  const simplified: Point[] = [initialPoint]
  for (let i = 2; i < points.length; i++) {
    point = points[i]
    // we are changing directions
    if (initialPoint[direction] !== point[direction]) {
      simplified.push(lastPoint)
      direction = direction === 'x' ? 'y' : 'x'
      initialPoint = lastPoint
    }
    lastPoint = point
  }

  if (initialPoint !== lastPoint) simplified.push(lastPoint)

  return simplified
}

export interface Context {
  tree: MazeNode
  solution: Point[]
  width: number
  height: number
  state: 'start' | 'moving' | 'end'
  position: Point
  direction: 'x' | 'y'
  remaining: number
  nextPoint: number
  random: Randomizer

  ctx: CanvasRenderingContext2D
  cellSize: number
  offset: Point
}

let _context: Context | null = null
let randomizer: Randomizer
let isListeningForResize = false

export const setRandomizer = (r: Randomizer) => (randomizer = r)

const defaultCellsize = 2 ** 4
const defaultOffset = {
  x: defaultCellsize * 2,
  y: defaultCellsize * 2,
}

function cropPoint(point: Point, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(point.x, width - 1)),
    y: Math.max(0, Math.min(point.y, height - 1)),
  }
}

/**
 * Get current context or creates a new one
 * @param width size in px
 * @param height size in px
 * @param cellSize size of a cell in the maze
 * @param offest position to offset to drawingn and center around it
 */
function getContext(
  width: number,
  height: number,
  cellSize: number,
  offset: Point,
  start: Point = { x: 0, y: -1 },
  end?: Point
): Context | null {
  if (_context) return _context
  resetCanvasCheck()
  // console.time('Maze Generation')

  // convert sizes from px to cells
  width = Math.floor((width - offset.x * 2) / cellSize)
  height = Math.floor((height - offset.y * 2) / cellSize)

  // too small
  if (width < 3 || height < 3) return null

  const seed = window.location.hash.slice(1) || nanoid()
  console.log(
    `Generating a maze ${width}x${height} with cellSize of ${cellSize} with 🌱 seed "${seed}"`
  )
  const random = createRandomizer(seed)
  randomizer = random

  const tree = generateMaze(width, height)
  // console.timeEnd('Maze Generation')
  // console.time('Maze solving')
  end = end || { x: tree.width - 1, y: tree.height }
  let solutionUnoptimized = solveMaze(
    tree,
    cropPoint(start, tree.width, tree.height),
    cropPoint(end, tree.width, tree.height)
  )
  console.log(`🛣 Length of the path: ${solutionUnoptimized.length}`)
  // console.timeEnd('Maze solving')
  // add a small offset outside of the maze to make it look better

  solutionUnoptimized.unshift(start)
  solutionUnoptimized.push(end)

  // console.time('Path simplification')
  const solution = simplifyPath(solutionUnoptimized)
  // console.timeEnd('Path simplification')
  console.log(`🦾 Complexity of the path: ${solution.length}`)
  console.log(solution)

  if (!isListeningForResize) {
    isListeningForResize = true
    window.addEventListener(
      'resize',
      debounce(() => {
        const { cellSize, offset } = _context!
        _context = null
        const size = getDimensions()
        const width = Math.floor((size.x - offset.x * 2) / cellSize)
        const height = Math.floor((size.y - offset.y * 2) / cellSize)
        getContext(width, height, cellSize, offset)
      }, 500)
    )
    onColorChange(() => {
      if (!_context) return
      // draw the maze again so it works no matter the state
      _context.ctx.fillStyle = getColorVariable('bgColor')
      _context.ctx.fillRect(0, 0, size.x, size.y)

      drawTree(_context)
      drawPath(_context)
    })
  }

  if (newMazeTimeout > 0) {
    clearTimeout(newMazeTimeout)
    newMazeTimeout = -1
  }

  const size = getDimensions()
  canvasEl.width = size.x * window.devicePixelRatio
  canvasEl.height = size.y * window.devicePixelRatio
  const ctx = canvasEl.getContext('2d')!
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  return (_context = {
    tree,
    solution,
    width,
    height,
    state: 'start',
    direction: getDirection(solution[0], solution[1]),
    position: { ...solution[0] },
    remaining: solution[1].y - solution[0].y,
    nextPoint: 1,
    random,

    ctx,
    cellSize,
    offset,
  })
}

function getDirection(from: Point, to: Point): 'x' | 'y' {
  return from.x != to.x ? 'x' : 'y'
}

export function resetContext() {
  _context = null
}

function movePosition(context: Context, ratio: number) {
  const { position, direction, nextPoint } = context
  const point = context.solution[nextPoint]
  const delta = (ratio * context.solution.length) / 30
  position[direction] +=
    (position[direction] < point[direction] ? 1 : -1) * delta
  context.remaining -= delta

  if (context.remaining <= 0) {
    context.position = { ...point }
    context.nextPoint++
    context.direction = direction === 'x' ? 'y' : 'x'
    if (context.nextPoint >= context.solution.length) context.state = 'end'
    else {
      context.remaining = Math.abs(
        context.solution[context.nextPoint][context.direction] -
          position[context.direction]
      )
    }
  }
}

function drawWall(context: Context) {
  const { ctx, tree, cellSize, offset } = context
  ctx.beginPath()
  const x =
    (tree.x + (tree.wall === WallType.vertical ? tree.wallOffset : 0)) *
      cellSize +
    offset.x
  const y =
    (tree.y + (tree.wall === WallType.vertical ? 0 : tree.wallOffset)) *
      cellSize +
    offset.y

  ctx.moveTo(x, y)
  if (tree.wall === WallType.vertical) {
    // do not draw empty lines
    if (tree.doorOffset) {
      ctx.lineTo(x, y + tree.doorOffset * cellSize)
    }
    // do not draw empty lines
    if (tree.doorOffset < tree.height - 1) {
      ctx.moveTo(x, y + (tree.doorOffset + 1) * cellSize)
      ctx.lineTo(x, y + tree.height * cellSize)
    }
  } else {
    // do not draw empty lines
    if (tree.doorOffset) {
      ctx.lineTo(x + tree.doorOffset * cellSize, y)
    }
    // do not draw empty lines
    if (tree.doorOffset < tree.width - 1) {
      ctx.moveTo(x + (tree.doorOffset + 1) * cellSize, y)
      ctx.lineTo(x + tree.width * cellSize, y)
    }
  }
  ctx.stroke()

  if (tree.left.wall !== WallType.none)
    drawWall({ ...context, tree: tree.left })
  if (tree.right.wall !== WallType.none)
    drawWall({ ...context, tree: tree.right })
}

function drawTree(context: Context) {
  const { ctx, tree, offset, cellSize, solution } = context

  // TODO: animation effect gradient
  const width = tree.width * cellSize
  const height = tree.height * cellSize
  const lineGradient = ctx.createLinearGradient(0, 0, width, height)
  lineGradient.addColorStop(0, getColorVariable('secondary'))
  lineGradient.addColorStop(1, getColorVariable('primary'))
  ctx.strokeStyle = lineGradient
  // ctx.strokeStyle = 'crimson'
  ctx.lineWidth = cellSize / 8
  ctx.lineCap = 'square'

  // draw the container box
  ctx.beginPath()
  ctx.moveTo(offset.x, offset.y)
  ctx.lineTo(offset.x + tree.width * cellSize, offset.y)
  ctx.lineTo(
    offset.x + tree.width * cellSize,
    offset.y + tree.height * cellSize
  )
  ctx.moveTo(
    offset.x + tree.width * cellSize,
    offset.y + tree.height * cellSize
  )
  ctx.lineTo(offset.x, offset.y + tree.height * cellSize)
  ctx.lineTo(offset.x, offset.y)

  ctx.stroke()

  // erase the doors
  ctx.fillStyle = getColorVariable('bgColor')

  clearDoor(ctx, solution[0], context)
  clearDoor(ctx, solution[solution.length - 1], context)

  // draw the walls
  drawWall(context)
}

function clearDoor(ctx: CanvasRenderingContext2D, p: Point, context: Context) {
  const { offset, tree, cellSize } = context
  if (p.x < 0 || p.y < 0 || p.x >= tree.width || p.y >= tree.height) {
    ctx.fillRect(
      offset.x +
        p.x * cellSize +
        (p.x < 0 ? cellSize : p.x >= tree.width ? -cellSize : 0) / 2,
      offset.y +
        p.y * cellSize +
        (p.y < 0 ? cellSize : p.y >= tree.height ? -cellSize : 0) / 2,
      cellSize,
      cellSize
    )
  }
}

const guyRadiusRatio = 2

function clearPlayer(context: Context) {
  const { offset, cellSize, ctx, position } = context
  const radius = ctx.lineWidth * guyRadiusRatio
  // dot position
  const x = offset.x + (position.x + 0.5) * cellSize
  const y = offset.y + (position.y + 0.5) * cellSize
  ctx.fillStyle = getColorVariable('bgColor')
  ctx.strokeStyle = getColorVariable('bgColor')
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
  ctx.fill()
  ctx.stroke()
}

export function drawPath(context: Context) {
  const {
    offset,
    cellSize,
    ctx,
    position,
    solution,
    nextPoint,
    direction,
  } = context

  // draw the path that has been traversed already
  let point = solution[0]
  let x = offset.x + (point.x + 0.5) * cellSize
  let y = offset.y + (point.y + 0.5) * cellSize
  ctx.beginPath()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = getColorVariable('accent')
  ctx.moveTo(x, y)
  for (let i = 1; i < solution.length; i++) {
    point = solution[i]
    if (i >= nextPoint) break
    x = offset.x + (point.x + 0.5) * cellSize
    y = offset.y + (point.y + 0.5) * cellSize
    ctx.lineTo(x, y)
  }
  // draw the portion that is being walked currently
  const remaining =
    Math.max(context.remaining, 0) *
    (position[direction] < point[direction] ? 1 : -1)
  x =
    offset.x +
    (point.x + 0.5 - +(context.direction === 'x') * remaining) * cellSize
  y =
    offset.y +
    (point.y + 0.5 - +(context.direction === 'y') * remaining) * cellSize
  ctx.lineTo(x, y)
  ctx.stroke()

  // draw the dot
  const radius = ctx.lineWidth * guyRadiusRatio
  // dot position
  x = offset.x + (position.x + 0.5) * cellSize
  y = offset.y + (position.y + 0.5) * cellSize

  ctx.beginPath()
  ctx.fillStyle = 'crimson'
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
  ctx.fill()
}

let newMazeTimeout = -1
export function render(ratio: number) {
  if (ratio > 2) return

  const size = getDimensions()

  const context = getContext(size.x, size.y, defaultCellsize, defaultOffset)
  if (!context) return

  if (context.state === 'start') {
    // clear
    context.ctx.fillStyle = getColorVariable('bgColor')
    context.ctx.fillRect(0, 0, size.x, size.y)

    // console.time('Drawing maze')
    drawTree(context)
    // console.timeEnd('Drawing maze')
    context.state = 'moving'
  } else if (context.state === 'moving') {
    clearPlayer(context)
    movePosition(context, ratio)
    drawPath(context)
  } else {
    newMazeTimeout < 0 &&
      (newMazeTimeout = window.setTimeout(() => {
        // generate a new maze
        // _context = null
        newMazeTimeout = -1
      }, 5000))
  }
}
