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
  doorOffter: number
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
  const wallOffset = Math.floor(Math.random() * biggest)
  const doorOffter = Math.floor(Math.random() * smallest)
  // TODO: stop condition
  const left = createWall(
    x,
    y,
    wall === WallType.vertical ? wallOffset : width,
    wall === WallType.vertical ? height : wallOffset
  )
  const right = createWall(
    wall === WallType.vertical ? wallOffset : x,
    wall === WallType.vertical ? y : wallOffset,
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
    doorOffter,
    left,
    right,
  }
}

function generateMaze(width: number, height: number): MazeNode {
  if (width < 2 || height < 2)
    throw new Error('width and height must be both larger than ')
  return createWall(0, 0, width, height) as MazeNode
}

export function render() {}
