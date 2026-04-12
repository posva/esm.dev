import type { Side, Grid } from './grid'

/**
 * A rule function receives a side and its neighbors (precomputed),
 * and returns the next alive state for that side.
 */
export type RuleFn = (side: Side, neighbors: Side[]) => boolean

export interface RuleSet {
  name: string
  description: string
  apply: RuleFn
  /** Optional grid-level step that replaces the default per-side evaluation. */
  stepGrid?: (grid: Grid) => void
}

/**
 * Count alive neighbors of a side.
 */
function aliveCount(neighbors: Side[]): number {
  let count = 0
  for (const n of neighbors) {
    if (n.alive) count++
  }
  return count
}

/**
 * Classic-ish Game of Life adapted for side-based state:
 * - Dead side with 2-3 alive neighbors → becomes alive
 * - Alive side with 2-3 alive neighbors → stays alive
 * - Otherwise → dies
 */
export const classicRule: RuleSet = {
  name: 'Classic',
  description:
    'Sides with 2–3 alive neighbors survive or are born. Too few → dies of loneliness. Too many → overcrowding.',
  apply(side, neighbors) {
    const alive = aliveCount(neighbors)
    if (side.alive) {
      return alive >= 2 && alive <= 3
    }
    return alive >= 2 && alive <= 3
  },
}

/**
 * Seeds rule:
 * - Dead side with exactly 2 alive neighbors → becomes alive
 * - All alive sides die
 */
export const seedsRule: RuleSet = {
  name: 'Seeds',
  description:
    'Every alive side dies. Dead sides with exactly 2 alive neighbors ignite. Creates explosive, chaotic growth.',
  apply(side, neighbors) {
    if (side.alive) return false
    return aliveCount(neighbors) === 2
  },
}

/**
 * Day & Night rule adapted for sides:
 * - Dead side with 3, 6, 7, or 8 alive neighbors → becomes alive
 * - Alive side with 3, 4, 6, 7, or 8 alive neighbors → survives
 */
export const dayNightRule: RuleSet = {
  name: 'Day & Night',
  description:
    'Symmetric rule where alive and dead states are interchangeable. Birth at 3/6/7/8, survival at 3/4/6/7/8. Produces stable, organic blobs.',
  apply(side, neighbors) {
    const alive = aliveCount(neighbors)
    if (side.alive) {
      return alive === 3 || alive === 4 || alive >= 6
    }
    return alive === 3 || alive >= 6
  },
}

// ── Survival rule ──

// Tuning constants — tweak these in source, no keyboard UI
export const SURVIVAL_BASE_LIFE = 10
const SURVIVAL_RANDOM_LIFE = 20
const SURVIVAL_LIFE_DECAY = 1
const SURVIVAL_P_JUMP = 0.08
const SURVIVAL_P_SPLIT = 0.03
const SURVIVAL_HUE_SHIFT = 5
const SURVIVAL_LIFE_STEAL = 0.25
const SURVIVAL_HUE_MUTATION = 10
const SURVIVAL_INITIAL_HUE = 200 // starting hue (blue-ish)

function randomDirection(): 1 | -1 {
  return Math.random() < 0.5 ? 1 : -1
}

function clearSide(side: Side): void {
  side.alive = false
  side.life = 0
  side.maxLife = 0
  side.hue = 0
  side.stepsInCell = 0
  side.direction = 1
}

function moveTo(source: Side, target: Side): void {
  target.alive = true
  target.life = source.life
  target.maxLife = source.maxLife
  target.hue = source.hue
  target.stepsInCell = source.stepsInCell
  target.direction = source.direction
  clearSide(source)
}

/**
 * Resolve a fight between attacker and defender.
 * - Higher life wins, loses the opponent's life, gains life steal.
 * - Equal: both die.
 * The winner ends up at the defender's position.
 */
export function resolveFight(attacker: Side, defender: Side, lifeSteal: number): void {
  const aLife = attacker.life
  const dLife = defender.life

  if (aLife > dLife) {
    // Attacker wins → takes defender's position
    const stolen = Math.min(Math.floor(dLife * lifeSteal), attacker.maxLife - (aLife - dLife))
    defender.life = aLife - dLife + Math.max(0, stolen)
    defender.maxLife = attacker.maxLife
    defender.hue = attacker.hue
    defender.stepsInCell = 0
    defender.alive = true
    clearSide(attacker)
  } else if (dLife > aLife) {
    // Defender wins → stays
    const stolen = Math.min(Math.floor(aLife * lifeSteal), defender.maxLife - (dLife - aLife))
    defender.life = dLife - aLife + Math.max(0, stolen)
    // defender keeps its own metadata
    clearSide(attacker)
  } else {
    // Tie → both die
    clearSide(attacker)
    clearSide(defender)
  }
}

/** Fisher-Yates shuffle in place */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Get neighbors that can serve as a "jump out" target.
 * For circle grids: linkedNeighbors (on different cells).
 * For polygon grids: neighbors that belong to a cell the current side doesn't.
 */
function externalNeighbors(side: Side): Side[] {
  const myCells = new Set<number>()
  if (side.cells[0]) myCells.add(side.cells[0].id)
  if (side.cells[1]) myCells.add(side.cells[1].id)

  return side.getNeighbors().filter((n) => {
    // A neighbor is "external" if it belongs to at least one cell
    // that the current side does NOT belong to
    if (n.cells[0] && !myCells.has(n.cells[0].id)) return true
    if (n.cells[1] && !myCells.has(n.cells[1].id)) return true
    return false
  })
}

/**
 * Get the next side in the same cell (orbit).
 */
function nextSideInCell(side: Side): Side | null {
  const cell = side.cells[0]
  if (!cell) return null
  const idx = cell.sides.indexOf(side)
  const n = cell.sides.length
  return cell.sides[(idx + (side.direction === 1 ? 1 : n - 1)) % n]
}

function survivalStepGrid(grid: Grid): void {
  // Collect and shuffle alive sides
  const alive = grid.sides.filter((s) => s.alive)
  shuffle(alive)

  for (const side of alive) {
    // Skip if already killed by a fight earlier in this step
    if (!side.alive) continue

    // Initialize newly alive sides (from randomize)
    if (side.maxLife === 0) {
      side.life = SURVIVAL_BASE_LIFE + Math.floor(Math.random() * SURVIVAL_RANDOM_LIFE)
      side.maxLife = side.life
      side.hue = SURVIVAL_INITIAL_HUE
      side.stepsInCell = 0
      side.direction = randomDirection()
    }

    // Decay
    side.life -= SURVIVAL_LIFE_DECAY
    side.hue = (side.hue + SURVIVAL_HUE_SHIFT) % 360

    if (side.life <= 0) {
      clearSide(side)
      continue
    }

    // Determine action
    const cell = side.cells[0]
    const cellSize = cell ? cell.sides.length : 0
    const forcedJump = side.stepsInCell >= cellSize

    const roll = Math.random()

    if (forcedJump || roll < SURVIVAL_P_JUMP) {
      // Jump to a neighbor on a different cell
      const ext = externalNeighbors(side)
      if (ext.length === 0) continue // boundary, no external neighbors
      const target = ext[Math.floor(Math.random() * ext.length)]

      if (target.alive) {
        resolveFight(side, target, SURVIVAL_LIFE_STEAL)
      } else {
        moveTo(side, target)
        target.stepsInCell = 0
        target.direction = randomDirection()
      }
    } else if (roll < SURVIVAL_P_JUMP + SURVIVAL_P_SPLIT) {
      // Split: spawn child on external neighbor
      const ext = externalNeighbors(side)
      if (ext.length === 0) continue
      const target = ext[Math.floor(Math.random() * ext.length)]

      const childLife = Math.floor(side.life / 2)
      side.life = Math.ceil(side.life / 2)

      if (childLife <= 0) continue // not enough life to split

      if (target.alive) {
        // Create temporary attacker for fight resolution
        const childHue =
          (side.hue + (Math.random() * SURVIVAL_HUE_MUTATION * 2 - SURVIVAL_HUE_MUTATION) + 360) %
          360
        // Fight: child attacks target
        if (childLife > target.life) {
          const stolen = Math.min(
            Math.floor(target.life * SURVIVAL_LIFE_STEAL),
            side.maxLife - (childLife - target.life),
          )
          target.life = childLife - target.life + Math.max(0, stolen)
          target.maxLife = side.maxLife
          target.hue = childHue
          target.stepsInCell = 0
          target.direction = randomDirection()
        } else if (target.life > childLife) {
          const stolen = Math.min(
            Math.floor(childLife * SURVIVAL_LIFE_STEAL),
            target.maxLife - (target.life - childLife),
          )
          target.life = target.life - childLife + Math.max(0, stolen)
        } else {
          clearSide(target)
        }
      } else {
        target.alive = true
        target.life = childLife
        target.maxLife = side.maxLife
        target.hue =
          (side.hue + (Math.random() * SURVIVAL_HUE_MUTATION * 2 - SURVIVAL_HUE_MUTATION) + 360) %
          360
        target.stepsInCell = 0
        target.direction = randomDirection()
      }
    } else {
      // Default: orbit to next side in same cell
      const next = nextSideInCell(side)
      if (!next || next === side) continue

      if (next.alive) {
        resolveFight(side, next, SURVIVAL_LIFE_STEAL)
      } else {
        side.stepsInCell++
        moveTo(side, next)
      }
    }
  }
}

export const survivalRule: RuleSet = {
  name: 'Survival',
  description:
    'Sides carry life, orbit cells, jump between cells, split, and fight. Hue shifts each step; opacity fades as life runs out.',
  apply(side) {
    return side.alive // no-op; stepGrid handles everything
  },
  stepGrid: survivalStepGrid,
}

export const ALL_RULES: RuleSet[] = [classicRule, seedsRule, dayNightRule, survivalRule]
