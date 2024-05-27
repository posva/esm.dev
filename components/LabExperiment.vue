<script setup lang="ts">
import { experimentModuleList } from '~/lab'
let rafId: number

let app: any

const props = defineProps<{
  /**
   * The lab id as a number or string of a number. If anything else is passed, a random one will be picked
   */
  labId?: number | string | unknown
}>()

let stop: (() => void) | undefined

onMounted(() => {
  const experimentId =
    props.labId == null
      ? Math.floor(Math.random() * experimentModuleList.length)
      : Number(props.labId)

  const experiment = () =>
    (experimentModuleList[experimentId].module?.() ??
      experimentModuleList[
        Math.floor(Math.random() * experimentModuleList.length)
      ].module) as Promise<{
      isPixi?: boolean
      start: () => any
      stop?: () => void
      render: (...args: any[]) => void
    }>

  experiment().then((module) => {
    if (module.isPixi) {
      app = module.start()
      stop = module.stop
    } else {
      function update() {
        rafId = requestAnimationFrame((elapsed) => {
          stepper(elapsed)
          update()
        })
      }

      let experimentRender: ((...args: any[]) => void) | null = null
      experimentRender = module.render
      update()

      let lastElapsed = 0
      const BASE_DELTA = 1000 / 60 // 1s / 60 frames
      let lastDelta = BASE_DELTA

      function stepper(elapsed: number) {
        lastDelta = elapsed - lastElapsed
        lastElapsed = elapsed
        const ratio = lastDelta / BASE_DELTA

        experimentRender && experimentRender(ratio)
      }
    }
  })
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  if (app?.stage) {
    app.destroy()
  }
  stop?.()
})
</script>

<template>
  <canvas id="experiment"></canvas>
</template>
