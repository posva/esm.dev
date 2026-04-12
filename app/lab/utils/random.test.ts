import { describe, expect, it } from 'vitest'
import { createRandomizer } from './random'

describe('createRandomizer', () => {
  it('produces deterministic int32 sequence for the same seed', () => {
    const a = createRandomizer('hello')
    const b = createRandomizer('hello')
    for (let i = 0; i < 20; i++) {
      expect(a.int32()).toBe(b.int32())
    }
  })

  it('produces deterministic double sequence for the same seed', () => {
    const a = createRandomizer('hello')
    const b = createRandomizer('hello')
    for (let i = 0; i < 20; i++) {
      expect(a.double()).toBe(b.double())
    }
  })

  it('produces different sequences for different seeds', () => {
    const a = createRandomizer('seed-a')
    const b = createRandomizer('seed-b')
    const vals = Array.from({ length: 5 }, () => a.int32())
    const other = Array.from({ length: 5 }, () => b.int32())
    expect(vals).not.toEqual(other)
  })

  it('int32 returns 32-bit integers', () => {
    const r = createRandomizer('range')
    for (let i = 0; i < 100; i++) {
      const v = r.int32()
      expect(v).toBeGreaterThanOrEqual(-0x80000000)
      expect(v).toBeLessThanOrEqual(0x7fffffff)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('double returns values in [0, 1)', () => {
    const r = createRandomizer('double-range')
    for (let i = 0; i < 100; i++) {
      const v = r.double()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
