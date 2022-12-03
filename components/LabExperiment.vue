<script setup lang="ts">
let rafId: number

let app: any

const props = defineProps<{
  /**
   * The lab id as a number or string of a number. If anything else is passed, a random one will be picked
   */
  labId?: number | string | unknown
}>()

onMounted(() => {
  const possibleExperiments = [
    'windmill-problem',
    'maze',
    'coast',
    // the one with pixi is heavier but so much better
    // 'crossing-lines',
    'pixi-crossing-lines',
  ]
  const experimentId =
    props.labId == null
      ? process.env.NODE_ENV === 'production'
        ? Math.floor(Math.random() * possibleExperiments.length)
        : possibleExperiments.length - 1
      : Number(props.labId)

  const experiment = () =>
    import(`~/lab/experiments/${possibleExperiments[experimentId]}.ts`).catch(
      (err) =>
        import(
          `~/lab/experiments/${
            possibleExperiments[
              Math.floor(Math.random() * possibleExperiments.length)
            ]
          }.ts`
        )
    )

  experiment().then((module) => {
    if (module.isPixi) {
      app = module.start()
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
})
</script>

<template>
  <canvas id="experiment"></canvas>
</template>
