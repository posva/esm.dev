import { Grid, type GridType, type PolygonType, createGrid } from './grid'
import type { RuleSet } from './rules'

export class Simulation {
  grid: Grid
  generation: number = 0

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
  }

  /**
   * Advance one generation: compute next state for ALL sides simultaneously,
   * then apply. This ensures the standard GoL synchronous update semantics.
   */
  step(): void {
    if (this.rules.stepGrid) {
      this.rules.stepGrid(this.grid)
    } else {
      const nextStates: boolean[] = new Array(this.grid.sides.length)

      for (let i = 0; i < this.grid.sides.length; i++) {
        const side = this.grid.sides[i]
        const neighbors = side.getNeighbors()
        nextStates[i] = this.rules.apply(side, neighbors)
      }

      for (let i = 0; i < this.grid.sides.length; i++) {
        this.grid.sides[i].alive = nextStates[i]
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
    this.generation = 0
  }
}
