import { Grid, type PolygonType, createGrid } from './grid'
import type { RuleSet } from './rules'

export class Simulation {
  grid: Grid
  generation: number = 0

  constructor(
    public polygonType: PolygonType,
    public rows: number,
    public cols: number,
    public rules: RuleSet,
  ) {
    this.grid = createGrid(polygonType, rows, cols)
  }

  /**
   * Advance one generation: compute next state for ALL sides simultaneously,
   * then apply. This ensures the standard GoL synchronous update semantics.
   */
  step(): void {
    const nextStates: boolean[] = new Array(this.grid.sides.length)

    for (let i = 0; i < this.grid.sides.length; i++) {
      const side = this.grid.sides[i]
      const neighbors = side.getNeighbors()
      nextStates[i] = this.rules.apply(side, neighbors)
    }

    for (let i = 0; i < this.grid.sides.length; i++) {
      this.grid.sides[i].alive = nextStates[i]
    }

    this.generation++
  }

  /**
   * Clear all sides to dead.
   */
  reset(): void {
    for (const side of this.grid.sides) {
      side.alive = false
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
    }
    this.generation = 0
  }

  /**
   * Rebuild the grid with new parameters.
   */
  rebuild(polygonType: PolygonType, rows: number, cols: number): void {
    this.polygonType = polygonType
    this.rows = rows
    this.cols = cols
    this.grid = createGrid(polygonType, rows, cols)
    this.generation = 0
  }
}
