import { Grid, type GridType, type PolygonType, createGrid } from './grid'
import type { RuleSet } from './rules'

export class Simulation {
  grid: Grid
  generation: number = 0
  private nextAlive: Uint8Array = new Uint8Array(0)

  constructor(
    public gridType: GridType,
    public rows: number,
    public cols: number,
    public rules: RuleSet,
    public precision?: number,
  ) {
    this.grid =
      gridType === 'circle'
        ? createGrid('circle', rows, cols, precision!)
        : createGrid(gridType, rows, cols)
    this.nextAlive = new Uint8Array(this.grid.sides.length)
  }

  /**
   * Advance one generation: compute next state for ALL sides simultaneously,
   * then apply. This ensures the standard GoL synchronous update semantics.
   */
  step(): void {
    if (this.rules.stepGrid) {
      this.rules.stepGrid(this.grid)
    } else {
      const sides = this.grid.sides
      const n = sides.length
      const offsets = this.grid.neighborOffsets
      const ids = this.grid.neighborIds
      const applyCount = this.rules.applyCount
      const applyArray = this.rules.apply
      const next = this.nextAlive

      if (applyCount) {
        // Fast path: no intermediate Side[] allocation per side.
        for (let i = 0; i < n; i++) {
          const start = offsets[i]
          const end = offsets[i + 1]
          let alive = 0
          for (let k = start; k < end; k++) {
            if (sides[ids[k]].alive) alive++
          }
          next[i] = applyCount(sides[i], alive) ? 1 : 0
        }
      } else {
        // Fallback: array-based API.
        for (let i = 0; i < n; i++) {
          next[i] = applyArray(sides[i], sides[i].getNeighbors()) ? 1 : 0
        }
      }

      for (let i = 0; i < n; i++) {
        sides[i].alive = next[i] === 1
      }
    }

    this.generation++
  }

  /**
   * Clear all sides to dead.
   */
  reset(): void {
    for (const side of this.grid.sides) {
      side.alive = false
      side.life = 0
      side.maxLife = 0
      side.hue = 0
      side.stepsInCell = 0
      side.direction = 1
    }
    this.generation = 0
  }

  /**
   * Randomize side states.
   * @param density Probability of a side being alive (0-1). Defaults to 0.3.
   */
  randomize(density: number = 0.3): void {
    for (const side of this.grid.sides) {
      side.alive = Math.random() < density
      side.life = 0
      side.maxLife = 0
      side.hue = 0
      side.stepsInCell = 0
      side.direction = 1
    }
    this.generation = 0
  }

  /**
   * Rebuild the grid with new parameters.
   */
  rebuild(gridType: GridType, rows: number, cols: number, precision?: number): void {
    this.gridType = gridType
    this.rows = rows
    this.cols = cols
    this.precision = precision
    this.grid =
      gridType === 'circle'
        ? createGrid('circle', rows, cols, precision!)
        : createGrid(gridType, rows, cols)
    this.nextAlive = new Uint8Array(this.grid.sides.length)
    this.generation = 0
  }
}
