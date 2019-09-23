<template>
  <div class="min-h-full">
    <canvas id="experiment"></canvas>

    <div class="my-4"></div>

    <section class="px-4">
      <h1>Hey there</h1>

      <p>
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Atque,
        deserunt minima! Laudantium, fuga cumque. Assumenda modi eveniet nam
        facilis error, et ab rem magnam nemo blanditiis? Odio earum repellendus
        quisquam!
      </p>
    </section>
  </div>
</template>

<script lang="ts">
export default {
  mounted() {
    const possibleExperiments = ['windmill-problem', 'maze', 'coast']
    const experimentId = Number(this.$route.params.id)

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

    let rafId: number
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
}
</script>

<style scoped>
#experiment {
  position: initial;
  /* width: 100%;
  height: 100%; */
}
</style>
