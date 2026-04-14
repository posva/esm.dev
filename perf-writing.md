# Making Game of Life Smooth on 4K

The `/labs/006-game-of-life` experiment got laggy on big screens. Fixing it was less about clever algorithms and more about removing work the browser was doing for no reason. These are the techniques that actually moved the needle.

## 1. Don't reset the canvas every frame

The first bug was invisible in code:

```ts
canvasEl.width = Math.round(width * dpr)
canvasEl.height = Math.round(height * dpr)
```

Assigning `canvas.width` — even to the same value — forces the browser to reallocate the entire backbuffer and reset the context. Doing this at 60 Hz on a 4K canvas is a disaster.

Fix: gate it behind a size/dpr change check, and cache the 2D context alongside.

```ts
const sizeChanged = width !== lastWidth || height !== lastHeight || dpr !== lastDpr
if (sizeChanged) {
  canvasEl.width = Math.round(width * dpr)
  canvasEl.height = Math.round(height * dpr)
  cachedCtx = canvasEl.getContext('2d')
  cachedCtx?.setTransform(dpr, 0, 0, dpr, 0, 0)
}
```

## 2. Precompute everything static

Grid topology doesn't change after construction. Neither do cell outlines. Neither does the list of "sides that can be jumped to from here". Yet the original code rebuilt all of them every step.

Three things got lifted to construction time:

**CSR neighbor index.** Instead of `side.getNeighbors()` allocating a `Set` and returning a `Side[]` per call, store neighbors as two `Int32Array`s:

```ts
neighborOffsets: Int32Array // length n+1
neighborIds: Int32Array // flat
// neighbors of side i = neighborIds[offsets[i] .. offsets[i+1]]
```

The simulation loop becomes one tight inner loop with no allocation:

```ts
for (let i = 0; i < n; i++) {
  let alive = 0
  for (let k = offsets[i]; k < offsets[i + 1]; k++) {
    if (sides[ids[k]].alive) alive++
  }
  next[i] = applyCount(sides[i], alive) ? 1 : 0
}
```

**Cached `indexInCell`.** Every render called `cell.sides.indexOf(side)` on the hot path. Cache it once: `side.indexInCellA`, `side.indexInCellB`.

**Precomputed external neighbors.** The Survival rule's jump/split target list is a pure function of topology. Compute it once per grid, store as `Side[][]` keyed by side id, and replace the per-step topology walk with a single array access.

## 3. Reusable scratch buffers

Every `filter`, every `new Set`, every `{a, b} = pair` in a hot loop is a GC problem waiting to happen. Replace them with module-level arrays that get cleared via `.length = 0`:

```ts
const aliveScratch: Side[] = []
const BUCKET_SCRATCH: Side[][] = new Array(72)
for (let i = 0; i < 72; i++) BUCKET_SCRATCH[i] = []
```

Even `[a, b] = [b, a]` for a Fisher-Yates swap allocates a 2-element array per swap. A `tmp` variable is identical to read and doesn't:

```ts
const tmp = arr[i]
arr[i] = arr[j]
arr[j] = tmp
```

## 4. Batch by style, not by object

Canvas 2D is much happier with one big path per style than 50k small strokes. For the rules with a single uniform color, collapse the whole alive layer into a single call:

```ts
ctx.beginPath()
for (const side of grid.sides) {
  if (!side.alive) continue
  // moveTo / lineTo into the same path
}
ctx.stroke()
```

For the Survival rule — where every side has a hue — the hue shift is discrete (5° per step → 72 distinct values), so bucket by rounded hue and emit one stroke per bucket:

```ts
let idx = (side.hue * 0.2) | 0 // * 1/5, truncated
buckets[idx].push(side)
// later: for each bucket, set strokeStyle once, one path, one stroke
```

Fading sides (`life < 10% maxLife`) still need per-side alpha, but that's a small minority.

## 5. Path2D for geometry that never changes

The cell outlines are drawn every frame but don't move. `Path2D` lets you build a path once and hand it to `ctx.stroke(path)` later. The browser keeps the geometry natively:

```ts
const outlines = new Path2D()
for (const cell of grid.cells) {
  outlines.moveTo(tx(verts[0].x), ty(verts[0].y))
  for (let i = 1; i < verts.length; i++) outlines.lineTo(tx(verts[i].x), ty(verts[i].y))
  outlines.closePath()
}
// every frame:
ctx.stroke(outlines)
```

No more 30k `tx/ty` closure calls per frame just to re-stroke the grid.

## 6. Spatial hash for pointer lookups

`findNearestSide` scanned all sides on every `mousemove`. On a 4K canvas during a drag that's 50k × 60 = 3M distance checks per second.

A uniform spatial hash — one bucket per ~16×16 px region, containing the ids of sides whose anchor falls there — drops the search to an expanding-ring walk from the pointer. The pointer bucket plus at most a one-ring halo is almost always enough; a simple bounding test breaks out as soon as nothing outside the ring could be closer.

## 7. A dirty flag for the frame

The display refreshes at 60 or 120 Hz. The simulation steps at 25 Hz. There's no point re-rendering 75% of frames that would look identical.

```ts
if (!dirty) return
// … full render …
dirty = false
```

Any state mutation (sim step, click, key) flips `dirty = true`. This single check turned out to be the biggest remaining win after all the per-frame micro-work was gone — we simply do nothing on most frames.

## 8. Bound the input size

A performance budget is not a performance fix, but it's a guardrail. On a 5K display at 25 px cells, the grid can exceed 50 000 cells. Cap the total:

```ts
const minCellSize = Math.sqrt((width * height) / MAX_CELLS)
const cellSize = Math.max(base, minCellSize)
```

Use a separate cap for circle grids, which emit `precision` sides per cell — the sim cost scales with sides, not cells.

## What didn't make the cut

- **WebGL / Worker.** Tempting, but Canvas 2D has a lot of headroom once you stop fighting it.
- **Mirroring `side.alive` into a `Uint8Array`.** The CSR loop already reads `sides[ids[k]].alive` fast enough; a typed-array mirror complicated the API for marginal gain.

## Takeaway

Most frontend "performance work" is allocation hygiene and memoization in disguise. Find the per-frame allocations. Find the static things being recomputed. Find the places where the display refresh is driving work that nothing asked for. The order of wins, roughly:

1. Stop re-rendering when nothing changed.
2. Stop reallocating the canvas.
3. Precompute what's static.
4. Batch draw calls by style.
5. Replace per-call allocations with scratch buffers.
6. Index structures for hit-testing.

None of it is clever. All of it compounds.
