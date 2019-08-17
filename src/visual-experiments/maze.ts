import {
  getDimensions,
  canvasEl,
  getBackgroundColor,
  Point,
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
  // TODO: stop condition
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

let tree: MazeNode
let lastUsedSeed = -1

function start(seed: number, width: number, height: number): MazeNode {
  if (lastUsedSeed !== seed) {
    lastUsedSeed = seed
    tree = generateMaze(width, height)
  }
  return tree
}

const cellSize = 2 ** 3

function drawWall(
  ctx: CanvasRenderingContext2D,
  tree: MazeNode,
  offset: Point
) {
  ctx.transform(1, 0, 0, 1, offset.x, offset.y)
  ctx.beginPath()
  const x =
    (tree.x + (tree.wall === WallType.vertical ? tree.wallOffset : 0)) *
    cellSize
  const y =
    (tree.y + (tree.wall === WallType.vertical ? 0 : tree.wallOffset)) *
    cellSize

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

  ctx.setTransform(1, 0, 0, 1, 0, 0)

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

export function render(ratio: number) {
  if (ratio > 2) return
  // TODO: this should only be done once as it resets the canvas
  if (!tree) {
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
    // const width = 5
    // const height = 5

    console.log(
      `Generating a maze ${width}x${height} with cellSize of ${cellSize}`
    )

    const context = start(1, width, height)
    console.log(context)
    // clear
    ctx.fillStyle = getBackgroundColor()
    // ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, size.x, size.y)

    drawTree(ctx, tree, offset)
  }
}
