<script setup lang="ts">
import { Simulation } from '~/lab/006-game-of-life/simulation'
import { renderGrid } from '~/lab/006-game-of-life/renderer'
import { ALL_RULES, classicRule } from '~/lab/006-game-of-life/rules'
import type { PolygonType } from '~/lab/006-game-of-life/grid'

useHead({ title: '🧪 Polygonal Game of Life' })

const canvasRef = ref<HTMLCanvasElement>()
const polygonType = ref<PolygonType>(4)
const rows = ref(20)
const cols = ref(30)
const playing = ref(false)
const speed = ref(10) // steps per second
const ruleIndex = ref(0)
const generation = ref(0)

const currentRule = computed(() => ALL_RULES[ruleIndex.value])

let sim: Simulation | null = null
let rafId = 0
let lastStepTime = 0

function initSim() {
  sim = new Simulation(polygonType.value, rows.value, cols.value, currentRule.value)
  sim.randomize(0.3)
  generation.value = sim.generation
  draw()
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !sim) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  renderGrid(ctx, sim.grid, rect.width, rect.height)
}

function loop(timestamp: number) {
  if (!playing.value || !sim) return

  const interval = 1000 / speed.value
  if (timestamp - lastStepTime >= interval) {
    sim.step()
    generation.value = sim.generation
    draw()
    lastStepTime = timestamp
  }

  rafId = requestAnimationFrame(loop)
}

function play() {
  playing.value = true
  lastStepTime = performance.now()
  rafId = requestAnimationFrame(loop)
}

function pause() {
  playing.value = false
  cancelAnimationFrame(rafId)
}

function togglePlay() {
  if (playing.value) pause()
  else play()
}

function stepOnce() {
  if (!sim) return
  pause()
  sim.step()
  generation.value = sim.generation
  draw()
}

function randomize() {
  if (!sim) return
  sim.randomize(0.3)
  generation.value = sim.generation
  draw()
}

function clear() {
  if (!sim) return
  sim.reset()
  generation.value = sim.generation
  draw()
}

function changePolygon(type: PolygonType) {
  polygonType.value = type
  pause()
  initSim()
}

function changeRule(index: number) {
  ruleIndex.value = index
  if (sim) {
    sim.rules = currentRule.value
  }
}

onMounted(() => {
  initSim()
  window.addEventListener('resize', draw)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', draw)
})
</script>

<template>
  <div class="flex flex-col h-screen bg-neutral-950 text-neutral-200">
    <canvas ref="canvasRef" class="flex-1 w-full min-h-0" />

    <div
      class="flex flex-wrap items-center gap-3 px-4 py-3 bg-neutral-900 border-t border-neutral-800"
    >
      <div class="flex items-center gap-1.5">
        <span class="text-xs uppercase tracking-wide text-neutral-500 mr-0.5">Shape</span>
        <button
          v-for="t in [3, 4, 6] as const"
          :key="t"
          :class="[
            'px-2.5 py-1 border rounded text-sm cursor-pointer transition-all',
            polygonType === t
              ? 'bg-green-500/10 border-green-500 text-green-500'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-500',
          ]"
          @click="changePolygon(t)"
        >
          {{ { 3: '△', 4: '□', 6: '⬡' }[t] }} {{ t }}
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-xs uppercase tracking-wide text-neutral-500 mr-0.5">Rule</span>
        <button
          v-for="(rule, i) in ALL_RULES"
          :key="rule.name"
          :class="[
            'px-2.5 py-1 border rounded text-sm cursor-pointer transition-all',
            ruleIndex === i
              ? 'bg-green-500/10 border-green-500 text-green-500'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-500',
          ]"
          @click="changeRule(i)"
        >
          {{ rule.name }}
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          class="px-2.5 py-1 border border-neutral-700 rounded bg-neutral-800 text-neutral-300 text-sm cursor-pointer transition-all hover:bg-neutral-700 hover:border-neutral-500"
          :title="playing ? 'Pause' : 'Play'"
          @click="togglePlay"
        >
          {{ playing ? '⏸' : '▶' }}
        </button>
        <button
          class="px-2.5 py-1 border border-neutral-700 rounded bg-neutral-800 text-neutral-300 text-sm cursor-pointer transition-all hover:bg-neutral-700 hover:border-neutral-500"
          title="Step forward one generation"
          @click="stepOnce"
        >
          ⏭
        </button>
        <button
          class="px-2.5 py-1 border border-neutral-700 rounded bg-neutral-800 text-neutral-300 text-sm cursor-pointer transition-all hover:bg-neutral-700 hover:border-neutral-500"
          title="Randomize"
          @click="randomize"
        >
          🎲
        </button>
        <button
          class="px-2.5 py-1 border border-neutral-700 rounded bg-neutral-800 text-neutral-300 text-sm cursor-pointer transition-all hover:bg-neutral-700 hover:border-neutral-500"
          title="Clear all"
          @click="clear"
        >
          ✕
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-xs uppercase tracking-wide text-neutral-500">Speed</span>
        <input v-model.number="speed" type="range" min="1" max="60" class="w-24 accent-green-500" />
        <span class="text-xs text-neutral-500 min-w-[2ch] text-right">{{ speed }}</span>
      </div>

      <div class="flex items-center">
        <span class="text-xs uppercase tracking-wide text-neutral-500">Gen {{ generation }}</span>
      </div>

      <p class="text-xs text-neutral-500 basis-full leading-relaxed">
        {{ currentRule.description }}
      </p>
    </div>
  </div>
</template>
