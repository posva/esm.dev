export type PolygonType = 3 | 4 | 6
export type GridType = PolygonType | 'circle'

export interface Point {
  x: number
  y: number
}

export class Side {
  alive: boolean = false
  /**
   * The two cells sharing this side.
   * `cells[1]` is null for boundary edges.
   */
  cells: [Cell, Cell | null] = [null!, null]

  /**
   * Explicit neighbor links for topologies where neighbors aren't
   * determined by shared cells (e.g. circle grid inter-circle connections).
   */
  linkedNeighbors: Side[] = []

  /** Current life points (0 = dead). Used by Survival rule. */
  life: number = 0
  /** Maximum life this side started with. Used for opacity fade. */
  maxLife: number = 0
  /** Current hue (0-360). Shifts each step in Survival. */
  hue: number = 0
  /** Steps spent orbiting within the current cell. */
  stepsInCell: number = 0
  /** Orbit direction within a cell: 1 = forward, -1 = backward. Set on creation, randomized on cell change. */
  direction: 1 | -1 = 1
  /**
   * Which of the two cells (cells[0] or cells[1]) to orbit around.
   * Without this, orbits always use cells[0] which is biased toward the upper-left
   * cell (since the grid is built left-to-right, top-to-bottom). Randomized at creation.
   */
  orbitCellIndex: 0 | 1 = 0

  constructor(public readonly id: number) {}

  /**
   * Returns all other sides belonging to the same cells as this side,
   * plus any explicitly linked neighbors, excluding itself.
   */
  getNeighbors(): Side[] {
    const seen = new Set<Side>()
    for (const cell of this.cells) {
      if (!cell) continue
      for (const side of cell.sides) {
        if (side !== this) {
          seen.add(side)
        }
      }
    }
    for (const side of this.linkedNeighbors) {
      seen.add(side)
    }
    return Array.from(seen)
  }
}

export class Cell {
  sides: Side[] = []

  constructor(
    public readonly id: number,
    public center: Point,
    public vertices: Point[],
  ) {}
}

export class Grid {
  cells: Cell[] = []
  sides: Side[] = []
  gridType: GridType

  private nextSideId = 0
  private nextCellId = 0

  constructor(
    public readonly polygonType: PolygonType,
    public readonly rows: number,
    public readonly cols: number,
  )
  constructor(gridType: 'circle', rows: number, cols: number, precision: number)
  constructor(
    gridTypeOrPolygon: GridType,
    public readonly rows: number,
    public readonly cols: number,
    public readonly precision?: number,
  ) {
    this.gridType = gridTypeOrPolygon
    if (gridTypeOrPolygon === 'circle') {
      this.polygonType = 6 as PolygonType // layout uses hex positions
      this.buildCircleGrid(this.precision!)
    } else {
      this.polygonType = gridTypeOrPolygon
      switch (gridTypeOrPolygon) {
        case 4:
          this.buildSquareGrid()
          break
        case 3:
          this.buildTriangleGrid()
          break
        case 6:
          this.buildHexGrid()
          break
      }
    }
  }

  private createSide(): Side {
    const side = new Side(this.nextSideId++)
    this.sides.push(side)
    return side
  }

  private createCell(center: Point, vertices: Point[]): Cell {
    const cell = new Cell(this.nextCellId++, center, vertices)
    this.cells.push(cell)
    return cell
  }

  private attachSide(side: Side, cell: Cell): void {
    cell.sides.push(side)
    if (side.cells[0] === null!) {
      side.cells[0] = cell
    } else {
      side.cells[1] = cell
    }
  }

  // ── Square grid (4 sides) ──

  private buildSquareGrid(): void {
    const cellSize = 1

    // Storage for side sharing:
    // horizontalSides[r][c] = the horizontal side between row r-1 and row r
    // verticalSides[r][c] = the vertical side between col c-1 and col c in row r
    const horizontalSides: Side[][] = []
    const verticalSides: Side[][] = []

    // Pre-create horizontal sides: (rows+1) rows of cols sides
    for (let r = 0; r <= this.rows; r++) {
      horizontalSides[r] = []
      for (let c = 0; c < this.cols; c++) {
        horizontalSides[r][c] = this.createSide()
      }
    }

    // Pre-create vertical sides: rows rows of (cols+1) sides
    for (let r = 0; r < this.rows; r++) {
      verticalSides[r] = []
      for (let c = 0; c <= this.cols; c++) {
        verticalSides[r][c] = this.createSide()
      }
    }

    // Create cells and attach sides
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cx = c * cellSize + cellSize / 2
        const cy = r * cellSize + cellSize / 2
        const x0 = c * cellSize
        const y0 = r * cellSize
        const x1 = x0 + cellSize
        const y1 = y0 + cellSize

        const cell = this.createCell({ x: cx, y: cy }, [
          { x: x0, y: y0 },
          { x: x1, y: y0 },
          { x: x1, y: y1 },
          { x: x0, y: y1 },
        ])

        // top, right, bottom, left
        const top = horizontalSides[r][c]
        const bottom = horizontalSides[r + 1][c]
        const left = verticalSides[r][c]
        const right = verticalSides[r][c + 1]

        this.attachSide(top, cell)
        this.attachSide(right, cell)
        this.attachSide(bottom, cell)
        this.attachSide(left, cell)
      }
    }
  }

  // ── Triangle grid (3 sides) ──

  private buildTriangleGrid(): void {
    // Triangles alternate up/down in a row.
    // Each row has `cols` triangles.
    // Up triangle (r+c even): apex at top
    // Down triangle (r+c odd): apex at bottom
    //
    // Layout: each triangle has width=1, height=sqrt(3)/2
    // Up triangle vertices: bottom-left, bottom-right, top-center
    // Down triangle vertices: top-left, top-right, bottom-center

    const h = Math.sqrt(3) / 2

    // We need to track shared edges:
    // - Horizontal edges between rows (base of up = base of down above)
    // - Left/right diagonal edges between adjacent triangles in same row

    // cellGrid[r][c] stores the cell for lookup during construction
    const cellGrid: Cell[][] = []

    // horizontalEdges[r][c]: horizontal edge at row boundary r, column c
    // Only exists where two triangles share a horizontal base
    // Row r's up-triangle base = row (r-1)'s down-triangle base at same column position

    // Build cells row by row, sharing edges with already-built neighbors
    for (let r = 0; r < this.rows; r++) {
      cellGrid[r] = []
      for (let c = 0; c < this.cols; c++) {
        const isUp = (r + c) % 2 === 0

        // Position: each triangle occupies half a unit width
        const xBase = c * 0.5
        const yBase = r * h

        let center: Point
        let vertices: Point[]

        if (isUp) {
          vertices = [
            { x: xBase, y: yBase + h }, // bottom-left
            { x: xBase + 1, y: yBase + h }, // bottom-right
            { x: xBase + 0.5, y: yBase }, // top
          ]
          center = { x: xBase + 0.5, y: yBase + (2 * h) / 3 }
        } else {
          vertices = [
            { x: xBase, y: yBase }, // top-left
            { x: xBase + 1, y: yBase }, // top-right
            { x: xBase + 0.5, y: yBase + h }, // bottom
          ]
          center = { x: xBase + 0.5, y: yBase + h / 3 }
        }

        const cell = this.createCell(center, vertices)
        cellGrid[r][c] = cell

        // Sides: each triangle has 3 sides
        // For up triangle: bottom (horizontal), left (diagonal), right (diagonal)
        // For down triangle: top (horizontal), left (diagonal), right (diagonal)

        if (isUp) {
          // Bottom edge: horizontal. Shared with down-triangle below (r+1, c) if exists
          // We create it now; the neighbor below will reuse it
          const bottomSide = this.createSide()
          this.attachSide(bottomSide, cell)

          // Left edge (from bottom-left to top): shared with left neighbor (r, c-1) if it's a down triangle
          let leftSide: Side
          if (c > 0 && cellGrid[r][c - 1]) {
            // Left neighbor is down triangle, its right edge is our left edge
            leftSide = cellGrid[r][c - 1].sides[2] // down triangle's right side
          } else {
            leftSide = this.createSide()
          }
          this.attachSide(leftSide, cell)

          // Right edge (from top to bottom-right): shared with right neighbor (r, c+1) if it exists
          // We create it now; right neighbor will reuse it
          const rightSide = this.createSide()
          this.attachSide(rightSide, cell)
        } else {
          // Down triangle
          // Top edge: horizontal. Shared with up-triangle above (r-1, c) if exists
          let topSide: Side
          if (r > 0 && cellGrid[r - 1][c]) {
            // Up triangle above has bottom edge as its first side (index 0)
            topSide = cellGrid[r - 1][c].sides[0]
          } else {
            topSide = this.createSide()
          }
          this.attachSide(topSide, cell)

          // Left edge (from top-left to bottom): shared with left neighbor (r, c-1) if up triangle
          let leftSide: Side
          if (c > 0 && cellGrid[r][c - 1]) {
            // Left neighbor is up triangle, its right edge (index 2) is our left
            leftSide = cellGrid[r][c - 1].sides[2]
          } else {
            leftSide = this.createSide()
          }
          this.attachSide(leftSide, cell)

          // Right edge (from bottom to top-right)
          const rightSide = this.createSide()
          this.attachSide(rightSide, cell)
        }
      }
    }
  }

  // ── Hexagon grid (6 sides) ──

  private buildHexGrid(): void {
    // Flat-top hexagons with odd-q offset coordinates
    // Hex width = 2 * size, hex height = sqrt(3) * size
    const size = 1
    const w = size * 2
    const h = Math.sqrt(3) * size
    const colStep = w * 0.75 // horizontal distance between hex centers
    const rowStep = h // vertical distance between hex centers

    // cellGrid for neighbor lookups during construction
    const cellGrid: (Cell | null)[][] = []

    for (let q = 0; q < this.cols; q++) {
      cellGrid[q] = []
      for (let r = 0; r < this.rows; r++) {
        const cx = q * colStep + size
        const cy = r * rowStep + h / 2 + (q % 2 === 1 ? h / 2 : 0)

        // Flat-top hex vertices (starting from right, going clockwise)
        const vertices: Point[] = []
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          vertices.push({
            x: cx + size * Math.cos(angle),
            y: cy + size * Math.sin(angle),
          })
        }

        const cell = this.createCell({ x: cx, y: cy }, vertices)
        cellGrid[q][r] = cell

        // 6 sides indexed 0-5: side i connects vertex[i] to vertex[(i+1)%6]
        //
        // Flat-top hex vertex positions (angle from center):
        //   v0=0° (right), v1=60° (lower-right), v2=120° (lower-left),
        //   v3=180° (left), v4=240° (upper-left), v5=300° (upper-right)
        //
        // Edge directions:
        //   Side 0 (v0→v1): SE edge (angled)
        //   Side 1 (v1→v2): S edge (horizontal bottom)
        //   Side 2 (v2→v3): SW edge (angled)
        //   Side 3 (v3→v4): NW edge (angled)
        //   Side 4 (v4→v5): N edge (horizontal top)
        //   Side 5 (v5→v0): NE edge (angled)
        const isOdd = q % 2 === 1

        const sides: Side[] = []
        for (let i = 0; i < 6; i++) {
          // Try to find an existing shared side from already-built neighbors
          const shared = this.findSharedHexSide(cellGrid, q, r, i, isOdd)
          sides.push(shared ?? this.createSide())
        }

        for (const side of sides) {
          this.attachSide(side, cell)
        }

        cellGrid[q][r] = cell
      }
    }
  }

  private findSharedHexSide(
    cellGrid: (Cell | null)[][],
    q: number,
    r: number,
    sideIndex: number,
    isOdd: boolean,
  ): Side | null {
    // Odd-q offset: odd columns shifted down by half a row.
    // Each side maps to a specific neighbor and their opposite side.
    //
    // Even q offsets:                  Odd q offsets:
    //   SE(0): (q+1, r)   → side 3    SE(0): (q+1, r+1) → side 3
    //   S (1): (q,   r+1) → side 4    S (1): (q,   r+1) → side 4
    //   SW(2): (q-1, r)   → side 5    SW(2): (q-1, r+1) → side 5
    //   NW(3): (q-1, r-1) → side 0    NW(3): (q-1, r)   → side 0
    //   N (4): (q,   r-1) → side 1    N (4): (q,   r-1) → side 1
    //   NE(5): (q+1, r-1) → side 2    NE(5): (q+1, r)   → side 2
    let nq: number
    let nr: number
    let neighborSideIndex: number

    switch (sideIndex) {
      case 0: // SE → neighbor's side 3 (NW)
        nq = q + 1
        nr = isOdd ? r + 1 : r
        neighborSideIndex = 3
        break
      case 1: // S → neighbor's side 4 (N)
        nq = q
        nr = r + 1
        neighborSideIndex = 4
        break
      case 2: // SW → neighbor's side 5 (NE)
        nq = q - 1
        nr = isOdd ? r + 1 : r
        neighborSideIndex = 5
        break
      case 3: // NW → neighbor's side 0 (SE)
        nq = q - 1
        nr = isOdd ? r : r - 1
        neighborSideIndex = 0
        break
      case 4: // N → neighbor's side 1 (S)
        nq = q
        nr = r - 1
        neighborSideIndex = 1
        break
      case 5: // NE → neighbor's side 2 (SW)
        nq = q + 1
        nr = isOdd ? r : r - 1
        neighborSideIndex = 2
        break
      default:
        return null
    }

    const neighbor = cellGrid[nq]?.[nr]
    if (!neighbor) return null
    return neighbor.sides[neighborSideIndex] ?? null
  }

  // ── Circle grid (dots on hex-arranged circles) ──

  /**
   * Returns the hex neighbor coordinates for direction d using odd-q offset.
   */
  private hexNeighborCoords(
    q: number,
    r: number,
    d: number,
    isOdd: boolean,
  ): { nq: number; nr: number } {
    switch (d) {
      case 0:
        return { nq: q + 1, nr: isOdd ? r + 1 : r } // SE
      case 1:
        return { nq: q, nr: r + 1 } // S
      case 2:
        return { nq: q - 1, nr: isOdd ? r + 1 : r } // SW
      case 3:
        return { nq: q - 1, nr: isOdd ? r : r - 1 } // NW
      case 4:
        return { nq: q, nr: r - 1 } // N
      case 5:
        return { nq: q + 1, nr: isOdd ? r : r - 1 } // NE
      default:
        return { nq: -1, nr: -1 }
    }
  }

  private buildCircleGrid(precision: number): void {
    if (precision < 6 || precision % 6 !== 0) {
      throw new Error(`Circle precision must be a multiple of 6 (got ${precision})`)
    }

    // Hex layout constants (same as buildHexGrid)
    const size = 1
    const w = size * 2
    const h = Math.sqrt(3) * size
    const colStep = w * 0.75
    const rowStep = h

    const dotsPerDirection = precision / 6
    // Inradius: circle fits inside the hexagon, not outside
    const inradius = (size * Math.sqrt(3)) / 2
    const cellGrid: (Cell | null)[][] = []

    // Build all circles
    for (let q = 0; q < this.cols; q++) {
      cellGrid[q] = []
      for (let r = 0; r < this.rows; r++) {
        const cx = q * colStep + size
        const cy = r * rowStep + h / 2 + (q % 2 === 1 ? h / 2 : 0)

        // Vertices: precision dots on a circle with half-step offset
        // so dots straddle hex neighbor directions
        const vertices: Point[] = []
        for (let i = 0; i < precision; i++) {
          const angle = Math.PI / precision + (2 * Math.PI * i) / precision
          vertices.push({
            x: cx + inradius * Math.cos(angle),
            y: cy + inradius * Math.sin(angle),
          })
        }

        const cell = this.createCell({ x: cx, y: cy }, vertices)
        cellGrid[q][r] = cell

        // Create one Side (dot) per vertex, all belonging to this cell only
        for (let i = 0; i < precision; i++) {
          const dot = this.createSide()
          this.attachSide(dot, cell)
        }
      }
    }

    // Connect dots between neighboring circles
    for (let q = 0; q < this.cols; q++) {
      for (let r = 0; r < this.rows; r++) {
        const cellA = cellGrid[q]![r]
        if (!cellA) continue
        const isOdd = q % 2 === 1

        for (let d = 0; d < 6; d++) {
          const { nq, nr } = this.hexNeighborCoords(q, r, d, isOdd)
          const cellB = cellGrid[nq]?.[nr]
          if (!cellB) continue

          // Only connect in one direction to avoid double-linking
          // Connect when (q,r) < (nq,nr) lexicographically
          if (nq < q || (nq === q && nr < r)) continue

          const oppositeD = (d + 3) % 6

          for (let k = 0; k < dotsPerDirection; k++) {
            const dotA = cellA.sides[d * dotsPerDirection + k]
            const dotB = cellB.sides[oppositeD * dotsPerDirection + (dotsPerDirection - 1 - k)]
            dotA.linkedNeighbors.push(dotB)
            dotB.linkedNeighbors.push(dotA)
          }
        }
      }
    }
  }
}

export function createGrid(type: PolygonType, rows: number, cols: number): Grid
export function createGrid(type: 'circle', rows: number, cols: number, precision: number): Grid
export function createGrid(type: GridType, rows: number, cols: number, precision?: number): Grid {
  if (type === 'circle') {
    return new Grid('circle', rows, cols, precision!)
  }
  return new Grid(type, rows, cols)
}
