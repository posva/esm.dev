import type { Side } from './grid'

/**
 * A rule function receives a side and its neighbors (precomputed),
 * and returns the next alive state for that side.
 */
export type RuleFn = (side: Side, neighbors: Side[]) => boolean

export interface RuleSet {
  name: string
  description: string
  apply: RuleFn
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

export const ALL_RULES: RuleSet[] = [classicRule, seedsRule, dayNightRule]
