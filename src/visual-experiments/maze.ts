import { debounce } from 'lodash-es'
import {
  getDimensions,
  canvasEl,
  getBackgroundColor,
  Point,
  getColor,
} from './utils/screen'

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

  const biggest = Math.max(width, height)
  const smallest = biggest === width ? height : width
  const wall = biggest === width ? WallType.vertical : WallType.horizontal
  const wallOffset = Math.floor(Math.random() * (biggest - 1)) + 1
  const doorOffset = Math.floor(Math.random() * smallest)

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

function generateMaze(width: number, height: number): MazeNode {
  if (width < 2 || height < 2)
    throw new Error('width and height must be both larger than ')
  return createWall(0, 0, width, height) as MazeNode
}

function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

function dividePath(
  maze: MazeNode | MazeNodeLeaf,
  start: Point,
  end: Point
): Point[] {
  if (isSamePoint(start, end)) return [start]
  if (maze.wall === WallType.none) return [start, end]

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

function solveMaze(maze: MazeNode): Point[] {
  const left: Point = { x: 0, y: 0 }
  const right: Point = { x: maze.width - 1, y: maze.height - 1 }
  return dividePath(maze, left, right)
}

let tree: MazeNode
let lastUsedSeed = -1

let isListeningForResize = false

function start(seed: number, width: number, height: number): MazeNode {
  if (lastUsedSeed !== seed) {
    lastUsedSeed = seed
    tree = generateMaze(width, height)
  }
  if (!isListeningForResize) {
    isListeningForResize = true
    window.addEventListener(
      'resize',
      debounce(() => {
        start(seed + 1, width, height)
      }, 500)
    )
  }
  return tree
}

const cellSize = 2 ** 4

function drawWall(
  ctx: CanvasRenderingContext2D,
  tree: MazeNode,
  offset: Point
) {
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
    ctx.lineTo(x, y + tree.doorOffset * cellSize)
    ctx.stroke()
    ctx.moveTo(x, y + (tree.doorOffset + 1) * cellSize)
    ctx.lineTo(x, y + tree.height * cellSize)
    ctx.stroke()
  } else {
    ctx.lineTo(x + tree.doorOffset * cellSize, y)
    ctx.stroke()
    ctx.moveTo(x + (tree.doorOffset + 1) * cellSize, y)
    ctx.lineTo(x + tree.width * cellSize, y)
    ctx.stroke()
  }

  if (tree.left.wall !== WallType.none) drawWall(ctx, tree.left, offset)
  if (tree.right.wall !== WallType.none) drawWall(ctx, tree.right, offset)
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  tree: MazeNode,
  offset: Point
) {
  // TODO: animation effect gradient
  const width = tree.width * cellSize
  const height = tree.height * cellSize
  const lineGradient = ctx.createLinearGradient(0, 0, width, height)
  lineGradient.addColorStop(0, 'crimson')
  lineGradient.addColorStop(1, 'royalblue')
  ctx.strokeStyle = lineGradient
  // ctx.strokeStyle = 'crimson'
  ctx.lineWidth = cellSize / 8
  ctx.lineCap = 'square'
  ctx.beginPath()
  ctx.moveTo(offset.x + cellSize, offset.y)
  ctx.lineTo(offset.x + tree.width * cellSize, offset.y)
  ctx.lineTo(
    offset.x + tree.width * cellSize,
    offset.y + tree.height * cellSize
  )
  ctx.moveTo(
    offset.x + (tree.width - 1) * cellSize,
    offset.y + tree.height * cellSize
  )
  ctx.lineTo(offset.x, offset.y + tree.height * cellSize)
  ctx.lineTo(offset.x, offset.y)

  ctx.stroke()

  drawWall(ctx, tree, offset)
}

let lastUsedTree: MazeNode | null = null

export function render(ratio: number) {
  if (ratio > 2) return
  // TODO: this should only be done once as it resets the canvas
  if (lastUsedTree !== tree) {
    const size = getDimensions()
    canvasEl.width = size.x * window.devicePixelRatio
    canvasEl.height = size.y * window.devicePixelRatio
    const ctx = canvasEl.getContext('2d')
    if (!ctx) return // avoid errors if no supporting browser
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const offset: Point = {
      x: cellSize * 4,
      y: cellSize * 4,
    }

    const width = Math.floor((size.x - offset.x * 2) / cellSize)
    const height = Math.floor((size.y - offset.y * 2) / cellSize)
    // const width = 3
    // const height = 5

    console.log(
      `Generating a maze ${width}x${height} with cellSize of ${cellSize}`
    )

    lastUsedTree = start(1, width, height)
    console.log(lastUsedTree)
    requestAnimationFrame(() => {
      const solved = solveMaze(tree)
      solved.unshift({
        x: 0,
        y: -1,
      })
      solved.push({
        x: tree.width - 1,
        y: tree.height,
      })
      console.log(solved)
      let point = solved[0]
      const x = offset.x + (point.x + 0.5) * cellSize
      const y = offset.y + (point.y + 0.5) * cellSize
      ctx.beginPath()
      ctx.strokeStyle = getColor()
      ctx.moveTo(x, y)
      for (let i = 1; i < solved.length; i++) {
        let point = solved[i]
        const x = offset.x + (point.x + 0.5) * cellSize
        const y = offset.y + (point.y + 0.5) * cellSize
        ctx.lineTo(x, y)
      }
      ctx.stroke()

      const radius = ctx.lineWidth * 0.7
      for (const point of solved) {
        ctx.beginPath()
        ctx.fillStyle = 'crimson'
        const x = offset.x + (point.x + 0.5) * cellSize
        const y = offset.y + (point.y + 0.5) * cellSize
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
        ctx.fill()
        ctx.font = '32px Helvetica Neue'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'crimson'
        // ctx.fillText('' + solved.indexOf(point), x, y)
      }
    })
    // clear
    ctx.fillStyle = getBackgroundColor()
    // ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, size.x, size.y)

    drawTree(ctx, tree, offset)
  }
}
