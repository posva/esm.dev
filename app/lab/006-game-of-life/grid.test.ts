import { describe, it, expect } from 'vitest'
import { createGrid, Side, Cell, Grid } from './grid'

// ── Helpers ──

/** Count sides that are boundary (only attached to one cell) */
function countBoundarySides(grid: Grid): number {
  return grid.sides.filter((s) => s.cells[1] === null).length
}

/** Count sides shared between two cells */
function countSharedSides(grid: Grid): number {
  return grid.sides.filter((s) => s.cells[1] !== null).length
}

/** Verify every side's cell back-references are consistent */
function verifySideCellConsistency(grid: Grid): void {
  for (const side of grid.sides) {
    for (const cell of side.cells) {
      if (cell) {
        expect(cell.sides).toContain(side)
      }
    }
  }
}

/** Verify every cell's sides reference back to the cell */
function verifyCellSideConsistency(grid: Grid): void {
  for (const cell of grid.cells) {
    for (const side of cell.sides) {
      expect(side.cells[0] === cell || side.cells[1] === cell).toBe(true)
    }
  }
}

// ── Square grid ──

describe('Square grid (4)', () => {
  it('creates correct number of cells', () => {
    const grid = createGrid(4, 3, 4)
    expect(grid.cells.length).toBe(12)
  })

  it('each cell has 4 sides', () => {
    const grid = createGrid(4, 3, 4)
    for (const cell of grid.cells) {
      expect(cell.sides.length).toBe(4)
    }
  })

  it('creates correct total number of sides', () => {
    // For a rows×cols square grid:
    // horizontal sides: (rows+1) * cols
    // vertical sides: rows * (cols+1)
    const grid = createGrid(4, 3, 4)
    const expected = (3 + 1) * 4 + 3 * (4 + 1)
    expect(grid.sides.length).toBe(expected)
  })

  it('boundary sides count is correct', () => {
    // Perimeter sides: 2*rows + 2*cols
    const grid = createGrid(4, 3, 4)
    expect(countBoundarySides(grid)).toBe(2 * 3 + 2 * 4)
  })

  it('shared sides count is correct', () => {
    const grid = createGrid(4, 3, 4)
    // total - boundary
    const total = (3 + 1) * 4 + 3 * (4 + 1)
    const boundary = 2 * 3 + 2 * 4
    expect(countSharedSides(grid)).toBe(total - boundary)
  })

  it('side-cell references are consistent', () => {
    const grid = createGrid(4, 3, 4)
    verifySideCellConsistency(grid)
    verifyCellSideConsistency(grid)
  })

  it('adjacent cells share exactly one side', () => {
    const grid = createGrid(4, 2, 2)
    // cells 0,1 are row 0; cells 2,3 are row 1
    // cell 0 and cell 1 share the vertical side between col 0 and col 1
    const cell0 = grid.cells[0]
    const cell1 = grid.cells[1]
    const shared = cell0.sides.filter((s) => cell1.sides.includes(s))
    expect(shared.length).toBe(1)
    // That shared side should reference both cells
    expect(shared[0].cells[0] !== null && shared[0].cells[1] !== null).toBe(true)
  })

  it('corner cell has 2 boundary sides', () => {
    const grid = createGrid(4, 3, 3)
    const corner = grid.cells[0] // top-left
    const boundarySides = corner.sides.filter((s) => s.cells[1] === null)
    expect(boundarySides.length).toBe(2)
  })

  it('getNeighbors returns correct count for interior side', () => {
    // For a shared side in a square grid, neighbors are:
    // (4-1) sides from cell A + (4-1) sides from cell B = 6
    const grid = createGrid(4, 3, 3)
    const sharedSide = grid.sides.find((s) => s.cells[1] !== null)!
    expect(sharedSide.getNeighbors().length).toBe(6)
  })

  it('getNeighbors returns correct count for boundary side', () => {
    // Boundary side belongs to 1 cell → 4-1 = 3 neighbors
    const grid = createGrid(4, 3, 3)
    const boundarySide = grid.sides.find((s) => s.cells[1] === null)!
    expect(boundarySide.getNeighbors().length).toBe(3)
  })

  it('1x1 grid has 4 boundary sides and 0 shared', () => {
    const grid = createGrid(4, 1, 1)
    expect(grid.cells.length).toBe(1)
    expect(grid.sides.length).toBe(4)
    expect(countBoundarySides(grid)).toBe(4)
    expect(countSharedSides(grid)).toBe(0)
  })
})

// ── Triangle grid ──

describe('Triangle grid (3)', () => {
  it('creates correct number of cells', () => {
    const grid = createGrid(3, 2, 4)
    expect(grid.cells.length).toBe(8)
  })

  it('each cell has 3 sides', () => {
    const grid = createGrid(3, 2, 4)
    for (const cell of grid.cells) {
      expect(cell.sides.length).toBe(3)
    }
  })

  it('side-cell references are consistent', () => {
    const grid = createGrid(3, 3, 6)
    verifySideCellConsistency(grid)
    verifyCellSideConsistency(grid)
  })

  it('adjacent triangles in same row share a side', () => {
    const grid = createGrid(3, 1, 4)
    // In a single row: up, down, up, down (if row=0, c=0 is up)
    // cell 0 (up) and cell 1 (down) should share an edge
    const cell0 = grid.cells[0]
    const cell1 = grid.cells[1]
    const shared = cell0.sides.filter((s) => cell1.sides.includes(s))
    expect(shared.length).toBe(1)
  })

  it('triangles in adjacent rows share horizontal edges', () => {
    // An up triangle in row 0 and a down triangle in row 1 at same column
    // should share the horizontal base
    const grid = createGrid(3, 2, 4)
    // row 0, col 0 is up (0+0 even). Its bottom side (index 0) should be
    // shared with row 1, col 0 which is down (1+0 odd), whose top side (index 0)
    const cell_r0c0 = grid.cells[0]
    const cell_r1c0 = grid.cells[4] // row 1, first cell
    const shared = cell_r0c0.sides.filter((s) => cell_r1c0.sides.includes(s))
    expect(shared.length).toBe(1)
  })

  it('no side is referenced by more than 2 cells', () => {
    const grid = createGrid(3, 4, 8)
    for (const side of grid.sides) {
      const refCount = [side.cells[0], side.cells[1]].filter(Boolean).length
      expect(refCount).toBeLessThanOrEqual(2)
      expect(refCount).toBeGreaterThanOrEqual(1)
    }
  })

  it('getNeighbors for shared side returns 4 neighbors', () => {
    // Shared between 2 triangles: (3-1) + (3-1) = 4
    const grid = createGrid(3, 2, 4)
    const sharedSide = grid.sides.find((s) => s.cells[1] !== null)!
    expect(sharedSide.getNeighbors().length).toBe(4)
  })

  it('getNeighbors for boundary side returns 2 neighbors', () => {
    // Boundary: belongs to 1 triangle → 3-1 = 2
    const grid = createGrid(3, 2, 4)
    const boundarySide = grid.sides.find((s) => s.cells[1] === null)!
    expect(boundarySide.getNeighbors().length).toBe(2)
  })
})

// ── Hexagon grid ──

describe('Hexagon grid (6)', () => {
  it('creates correct number of cells', () => {
    const grid = createGrid(6, 3, 4)
    expect(grid.cells.length).toBe(12)
  })

  it('each cell has 6 sides', () => {
    const grid = createGrid(6, 3, 4)
    for (const cell of grid.cells) {
      expect(cell.sides.length).toBe(6)
    }
  })

  it('side-cell references are consistent', () => {
    const grid = createGrid(6, 3, 4)
    verifySideCellConsistency(grid)
    verifyCellSideConsistency(grid)
  })

  it('interior hex shares sides with up to 6 neighbors', () => {
    // In a large enough grid, an interior cell shares all 6 sides
    const grid = createGrid(6, 5, 5)
    // Pick a cell in the middle
    const midCell = grid.cells.find((c) => {
      const shared = c.sides.filter((s) => s.cells[1] !== null)
      return shared.length === 6
    })
    expect(midCell).toBeDefined()
  })

  it('no side is referenced by more than 2 cells', () => {
    const grid = createGrid(6, 4, 4)
    for (const side of grid.sides) {
      const refCount = [side.cells[0], side.cells[1]].filter(Boolean).length
      expect(refCount).toBeLessThanOrEqual(2)
      expect(refCount).toBeGreaterThanOrEqual(1)
    }
  })

  it('getNeighbors for shared side returns 10 neighbors', () => {
    // Shared between 2 hexagons: (6-1) + (6-1) = 10
    const grid = createGrid(6, 3, 3)
    const sharedSide = grid.sides.find((s) => s.cells[1] !== null)!
    expect(sharedSide.getNeighbors().length).toBe(10)
  })

  it('getNeighbors for boundary side returns 5 neighbors', () => {
    // Boundary: 6-1 = 5
    const grid = createGrid(6, 3, 3)
    const boundarySide = grid.sides.find((s) => s.cells[1] === null)!
    expect(boundarySide.getNeighbors().length).toBe(5)
  })

  it('total shared sides matches expected for 2x2 grid', () => {
    // 2x2 hex grid (odd-q offset): 4 hexes
    // Each hex has 6 sides. Adjacent hexes share edges.
    // With 4 hexes in a 2x2: depends on offset layout
    const grid = createGrid(6, 2, 2)
    expect(grid.cells.length).toBe(4)
    // Each cell has 6 sides
    for (const cell of grid.cells) {
      expect(cell.sides.length).toBe(6)
    }
    // Some sides should be shared
    expect(countSharedSides(grid)).toBeGreaterThan(0)
  })
})

// ── Side state ──

describe('Side', () => {
  it('defaults to not alive', () => {
    const side = new Side(0)
    expect(side.alive).toBe(false)
  })

  it('can be toggled alive', () => {
    const side = new Side(0)
    side.alive = true
    expect(side.alive).toBe(true)
  })
})

// ── General grid properties ──

describe('Grid general', () => {
  it('all cell IDs are unique', () => {
    const grid = createGrid(4, 5, 5)
    const ids = grid.cells.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all side IDs are unique', () => {
    const grid = createGrid(4, 5, 5)
    const ids = grid.sides.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cells have correct number of vertices for polygon type', () => {
    for (const type of [3, 4, 6] as const) {
      const grid = createGrid(type, 2, 3)
      for (const cell of grid.cells) {
        expect(cell.vertices.length).toBe(type)
      }
    }
  })
})
