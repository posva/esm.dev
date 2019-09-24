<template>
  <canvas id="experiment"></canvas>
</template>

<script lang="ts">
import Vue from 'vue'

let rafId: number

export default Vue.extend({
  props: {
    labId: {
      required: false,
    },
  },

  mounted() {
    const possibleExperiments = ['windmill-problem', 'maze', 'coast']
    const experimentId =
      this.labId == null
        ? process.env.NODE_ENV === 'production'
          ? Math.floor(Math.random() * possibleExperiments.length)
          : possibleExperiments.length - 1
        : Number(this.labId)

    const experiment = () =>
      import(`~/lab/${possibleExperiments[experimentId]}.ts`).catch(err =>
        import(
          `~/lab/${
            possibleExperiments[
              Math.floor(Math.random() * possibleExperiments.length)
            ]
          }.ts`
        )
      )

    function update() {
      rafId = requestAnimationFrame(elapsed => {
        stepper(elapsed)
        update()
      })
    }

    let experimentRender: ((...args: any[]) => void) | null = null

    experiment().then(module => {
      experimentRender = module.render
    })

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
  },

  destroyed() {
    cancelAnimationFrame(rafId)
  },
})
</script>