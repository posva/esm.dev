import { describe, it, expect } from 'vitest'
import { classicRule, seedsRule, dayNightRule } from './rules'
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
