<template>
  <canvas id="experiment"></canvas>
</template>

<script lang="ts">
let rafId: number

export default defineComponent({
  props: {
    labId: {
      required: false,
    },
  },

  mounted() {
    const possibleExperiments = [
      'windmill-problem',
      'maze',
      'coast',
      // the one with pixi is heavier but so much better
      // 'crossing-lines',
      'pixi-crossing-lines',
    ]
    const experimentId =
      this.labId == null
        ? process.env.NODE_ENV === 'production'
          ? Math.floor(Math.random() * possibleExperiments.length)
          : possibleExperiments.length - 1
        : Number(this.labId)

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
        // @ts-ignore
        this.app = module.start()
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
  },

  unmounted() {
    cancelAnimationFrame(rafId)
    // @ts-ignore
    this.app && this.app.stage && this.app.destroy()
  },
})
</script>
