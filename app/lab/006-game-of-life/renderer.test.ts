import { describe, it, expect } from 'vitest'
import { createGrid, type Grid, type Side } from './grid'
import { findNearestSide } from './renderer'

// Brute-force reference implementation — mirrors the original O(sides) scan.
function bruteForceNearestSide(
  grid: Grid,
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
): Side | null {
  if (grid.cells.length === 0) return null
  const b = grid.getBounds()
  const gridW = b.maxX - b.minX
  const gridH = b.maxY - b.minY
  if (gridW <= 0 || gridH <= 0) return null
  const scale = Math.max(canvasWidth / gridW, canvasHeight / gridH)
  const offsetX = (canvasWidth - gridW * scale) / 2 - b.minX * scale
  const offsetY = (canvasHeight - gridH * scale) / 2 - b.minY * scale
  const tx = (x: number) => x * scale + offsetX
  const ty = (y: number) => y * scale + offsetY

  const isCircle = grid.gridType === 'circle'
  let best: Side | null = null
  let bestDist = Infinity

  for (const side of grid.sides) {
    const cell = side.cells[0]
    if (!cell) continue
    let sx: number
    let sy: number
    if (isCircle) {
      const v = cell.vertices[side.indexInCellA]
      sx = tx(v.x)
      sy = ty(v.y)
    } else {
      const idx = side.indexInCellA
      const n = cell.vertices.length
      const v1 = cell.vertices[idx]
      const v2 = cell.vertices[(idx + 1) % n]
      sx = (tx(v1.x) + tx(v2.x)) / 2
      sy = (ty(v1.y) + ty(v2.y)) / 2
    }
    const dx = canvasX - sx
    const dy = canvasY - sy
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      best = side
    }
  }
  return best
}

const CANVAS_W = 800
const CANVAS_H = 600

const gridConfigs = [
  { label: 'square', make: () => createGrid(4, 8, 10) },
  { label: 'triangle', make: () => createGrid(3, 8, 16) },
  { label: 'hex', make: () => createGrid(6, 8, 10) },
  { label: 'circle', make: () => createGrid('circle', 5, 6, 12) },
] as const

describe('findNearestSide (spatial hash vs brute force)', () => {
  for (const { label, make } of gridConfigs) {
    it(`matches brute-force for ${label}`, () => {
      const grid = make()
      // Sample a 10x8 grid of probe points across the canvas.
      for (let ix = 0; ix < 10; ix++) {
        for (let iy = 0; iy < 8; iy++) {
          const x = (CANVAS_W * (ix + 0.5)) / 10
          const y = (CANVAS_H * (iy + 0.5)) / 8
          const expected = bruteForceNearestSide(grid, x, y, CANVAS_W, CANVAS_H)
          const actual = findNearestSide(grid, x, y, CANVAS_W, CANVAS_H)
          // Multiple sides can be equidistant; compare by distance, not identity.
          if (expected === actual) continue
          expect(actual).not.toBeNull()
          // Recompute distances using the same transform to confirm tie.
          const distOf = (s: Side) => {
            const exp = bruteForceNearestSide(grid, x, y, CANVAS_W, CANVAS_H)
            // Abuse: if brute returns s, its dist is bestDist. We only need
            // the two candidates to be equal within float tolerance.
            return exp === s ? 0 : Number.MAX_VALUE
          }
          void distOf
          // Fall back to asserting identity (all grids here have unique anchors
          // at the probe points we picked).
          expect(actual!.id).toBe(expected!.id)
        }
      }
    })
  }

  it('returns null on empty grid', () => {
    const grid = createGrid(4, 0, 0)
    expect(findNearestSide(grid, 10, 10, CANVAS_W, CANVAS_H)).toBeNull()
  })
})
