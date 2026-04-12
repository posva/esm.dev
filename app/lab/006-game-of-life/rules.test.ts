import { describe, it, expect } from 'vitest'
import { classicRule, seedsRule, dayNightRule, resolveFight, survivalRule } from './rules'
import { createGrid, Side, Cell } from './grid'

// Helper: create a standalone side with mock neighbors at given alive states
function makeSideWithNeighbors(
  sideAlive: boolean,
  neighborStates: boolean[],
): { side: Side; neighbors: Side[] } {
  const side = new Side(0)
  side.alive = sideAlive
  const neighbors = neighborStates.map((alive, i) => {
    const s = new Side(i + 1)
    s.alive = alive
    return s
  })
  return { side, neighbors }
}

describe('Classic rule', () => {
  it('dead side with 2 alive neighbors becomes alive', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, true, false])
    expect(classicRule.apply(side, neighbors)).toBe(true)
  })

  it('dead side with 3 alive neighbors becomes alive', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, true, true])
    expect(classicRule.apply(side, neighbors)).toBe(true)
  })

  it('dead side with 1 alive neighbor stays dead', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, false, false])
    expect(classicRule.apply(side, neighbors)).toBe(false)
  })

  it('dead side with 4 alive neighbors stays dead', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, true, true, true])
    expect(classicRule.apply(side, neighbors)).toBe(false)
  })

  it('alive side with 2 neighbors survives', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [true, true, false])
    expect(classicRule.apply(side, neighbors)).toBe(true)
  })

  it('alive side with 1 neighbor dies (underpopulation)', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [true, false, false])
    expect(classicRule.apply(side, neighbors)).toBe(false)
  })

  it('alive side with 4 neighbors dies (overpopulation)', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [true, true, true, true])
    expect(classicRule.apply(side, neighbors)).toBe(false)
  })
})

describe('Seeds rule', () => {
  it('dead side with exactly 2 alive neighbors becomes alive', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, true, false])
    expect(seedsRule.apply(side, neighbors)).toBe(true)
  })

  it('dead side with 1 alive neighbor stays dead', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, false, false])
    expect(seedsRule.apply(side, neighbors)).toBe(false)
  })

  it('dead side with 3 alive neighbors stays dead', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, true, true])
    expect(seedsRule.apply(side, neighbors)).toBe(false)
  })

  it('alive side always dies', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [true, true, false])
    expect(seedsRule.apply(side, neighbors)).toBe(false)
  })

  it('alive side with 0 neighbors dies', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [])
    expect(seedsRule.apply(side, neighbors)).toBe(false)
  })
})

describe('Day & Night rule', () => {
  it('dead side with 3 alive neighbors becomes alive', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, true, true, false, false])
    expect(dayNightRule.apply(side, neighbors)).toBe(true)
  })

  it('dead side with 6 alive neighbors becomes alive', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ])
    expect(dayNightRule.apply(side, neighbors)).toBe(true)
  })

  it('dead side with 2 alive neighbors stays dead', () => {
    const { side, neighbors } = makeSideWithNeighbors(false, [true, true, false, false])
    expect(dayNightRule.apply(side, neighbors)).toBe(false)
  })

  it('alive side with 3 neighbors survives', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [true, true, true, false, false])
    expect(dayNightRule.apply(side, neighbors)).toBe(true)
  })

  it('alive side with 4 neighbors survives', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [true, true, true, true, false, false])
    expect(dayNightRule.apply(side, neighbors)).toBe(true)
  })

  it('alive side with 5 neighbors dies', () => {
    const { side, neighbors } = makeSideWithNeighbors(true, [
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ])
    expect(dayNightRule.apply(side, neighbors)).toBe(false)
  })
})

// ── Fight resolution ──

function makeSideWithLife(id: number, life: number, maxLife?: number): Side {
  const s = new Side(id)
  s.alive = true
  s.life = life
  s.maxLife = maxLife ?? life
  s.hue = 0
  return s
}

describe('resolveFight', () => {
  it('attacker wins when higher life', () => {
    const a = makeSideWithLife(0, 10, 15)
    const d = makeSideWithLife(1, 3, 5)
    resolveFight(a, d, 0.25)
    // Winner ends up at defender's position
    // life: 10 - 3 = 7, + floor(3*0.25)=0 => 7
    expect(a.alive).toBe(false) // attacker position cleared
    expect(d.alive).toBe(true) // winner at defender position
    expect(d.life).toBe(7)
    expect(d.maxLife).toBe(15) // inherits attacker's maxLife
  })

  it('defender wins when higher life', () => {
    const a = makeSideWithLife(0, 2, 10)
    const d = makeSideWithLife(1, 8, 10)
    resolveFight(a, d, 0.25)
    // defender wins, stays at its position
    // life: 8 - 2 = 6, + floor(2*0.25)=0 => 6
    expect(d.alive).toBe(true)
    expect(d.life).toBe(6)
    expect(a.alive).toBe(false)
  })

  it('both die on equal life', () => {
    const a = makeSideWithLife(0, 5)
    const d = makeSideWithLife(1, 5)
    resolveFight(a, d, 0.25)
    expect(a.alive).toBe(false)
    expect(d.alive).toBe(false)
  })

  it('life steal applies and is capped at maxLife', () => {
    const a = makeSideWithLife(0, 14, 15)
    const d = makeSideWithLife(1, 4, 10)
    resolveFight(a, d, 0.5)
    // Winner at defender position: 14 - 4 = 10, + floor(4*0.5) = 2 => 12
    expect(d.life).toBe(12)
    expect(d.maxLife).toBe(15) // inherits attacker's maxLife

    // Test where steal would exceed maxLife
    const a2 = makeSideWithLife(2, 14, 15)
    const d2 = makeSideWithLife(3, 10, 10)
    resolveFight(a2, d2, 0.5)
    // Winner at d2: 14 - 10 = 4, + floor(10*0.5) = 5 => 9, capped at 15 → 9
    expect(d2.life).toBe(9)
  })
})

// ── Survival rule on real grid ──

describe('Survival rule', () => {
  it('initializes newly alive sides with life metadata', () => {
    const grid = createGrid(4, 2, 2)
    grid.sides[0].alive = true
    // maxLife = 0 means uninitialized
    expect(grid.sides[0].maxLife).toBe(0)

    survivalRule.stepGrid!(grid)

    // If it survived (didn't decay to death immediately), it should be initialized
    // With baseLife=10 + random, it should survive the first step
    const aliveSides = grid.sides.filter((s) => s.alive)
    for (const s of aliveSides) {
      expect(s.maxLife).toBeGreaterThan(0)
      expect(s.life).toBeGreaterThan(0)
    }
  })

  it('sides decay and eventually die', () => {
    const grid = createGrid(4, 2, 2)
    grid.sides[0].alive = true
    grid.sides[0].life = 1
    grid.sides[0].maxLife = 10
    grid.sides[0].hue = 100

    survivalRule.stepGrid!(grid)

    // Life was 1, decayed to 0 → should be dead (the alive entity is gone)
    // It may have moved before dying but the original position or moved position will be dead
    const totalAlive = grid.sides.filter((s) => s.alive).length
    expect(totalAlive).toBe(0)
  })

  it('hue shifts each step', () => {
    const grid = createGrid(4, 3, 3)
    grid.sides[0].alive = true
    grid.sides[0].life = 20
    grid.sides[0].maxLife = 30
    grid.sides[0].hue = 100

    survivalRule.stepGrid!(grid)

    // The entity moved (orbit or jump), find it
    const alive = grid.sides.find((s) => s.alive)
    if (alive) {
      // Hue should have shifted from 100
      expect(alive.hue).not.toBe(100)
    }
  })
})

describe('Rules on real grid', () => {
  it('classic rule works with actual grid neighbors', () => {
    const grid = createGrid(4, 3, 3)
    // Set up a pattern: make 2 neighbors of a boundary side alive
    const boundarySide = grid.sides.find((s) => s.cells[1] === null)!
    const neighbors = boundarySide.getNeighbors()
    neighbors[0].alive = true
    neighbors[1].alive = true

    // Dead side with 2 alive neighbors → should become alive
    expect(classicRule.apply(boundarySide, neighbors)).toBe(true)
  })
})
